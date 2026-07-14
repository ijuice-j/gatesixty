import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listCalendarEvents, GoogleAuthExpiredError } from "@/lib/google/calendar";
import { reconstructRange, dateRange, type ReconstructedDay } from "@/lib/activity/range";
import { followThrough, totalFollowThrough, weekGrid, pct } from "@/lib/activity/metrics";
import {
  resolveViewerTimeZone,
  dateStringInTz,
  weekStartDate,
  shiftDate,
  zonedDayStart,
} from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "../timezone-sync";
import { AppShell } from "../shell";
import { ZoomNav } from "../review-nav";
import { MetricHeader } from "../metric-header";
import { ReconnectBanner, LoadErrorBanner } from "../banners";

// Reconstruction reads the live calendar per request — never cache.
export const dynamic = "force-dynamic";

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const { tz, resolved } = resolveViewerTimeZone(cookieStore.get("tz")?.value);

  if (!resolved) {
    return (
      <AppShell email={user.email} title="Review">
        <div className="w-full max-w-5xl px-6 py-6">
          <TimezoneSync current={tz} resolved={false} />
          <p className="text-base text-[var(--text-color-kumo-subtle)]">Loading your week…</p>
        </div>
      </AppShell>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "") ? (dateParam as string) : today;

  const monday = weekStartDate(ref);
  const prevMonday = shiftDate(monday, -7);

  // Fetch 14 days in ONE call — this week and the one before it, so the delta is real.
  const dates = dateRange(prevMonday, 14);
  const windowStart = zonedDayStart(prevMonday, tz);
  const windowEnd = zonedDayStart(shiftDate(monday, 7), tz);

  const [{ data: cred }, { data: logData }] = await Promise.all([
    supabase
      .from("google_credentials")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("activity_logs")
      .select(
        "gcal_event_id, title, done, occurred_on, planned_start, planned_end, color, ended_at",
      )
      .gte("occurred_on", prevMonday)
      .lt("occurred_on", shiftDate(monday, 7)),
  ]);
  const logs = (logData ?? []) as ActivityLog[];

  let all: ReconstructedDay[] = [];
  let needsReconnect = !cred?.refresh_token;
  let loadError: string | null = null;

  if (cred?.refresh_token) {
    try {
      const events = await listCalendarEvents(cred.refresh_token, windowStart, windowEnd);
      all = reconstructRange(events, logs, new Date(), dates, tz);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) needsReconnect = true;
      else loadError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  } else if (logs.length) {
    all = reconstructRange([], logs, new Date(), dates, tz);
  }

  const week = all.slice(7); // this week
  const prev = all.slice(0, 7); // the week before, for the delta

  const perDay = week.map((d) => followThrough(d.items));
  const ft = totalFollowThrough(perDay);
  const prevFt = totalFollowThrough(prev.map((d) => followThrough(d.items)));

  const grid = weekGrid(week);
  const rangeLabel = `${fmtDay(monday)} – ${fmtDay(shiftDate(monday, 6))}`;

  return (
    <AppShell email={user.email} title="Review" actions={<ZoomNav date={ref} />}>
      <div className="w-full max-w-5xl px-6 py-6">
        <TimezoneSync current={tz} resolved />

        <div className="mb-4 flex items-center gap-1.5">
          <Link
            href={`/week?date=${shiftDate(monday, -7)}`}
            className="ds-btn ds-btn--secondary ds-btn--sm"
            aria-label="Previous week"
          >
            ‹
          </Link>
          <Link
            href={`/week?date=${shiftDate(monday, 7)}`}
            className="ds-btn ds-btn--secondary ds-btn--sm"
            aria-label="Next week"
          >
            ›
          </Link>
          <h2 className="ml-1.5 text-base font-medium tabular-nums">{rangeLabel}</h2>
        </div>

        <MetricHeader
          label={`Follow-through · ${rangeLabel}`}
          ft={ft}
          compare={prevFt.ratio !== null ? prevFt : undefined}
          compareLabel="last week"
        />

        {needsReconnect && <ReconnectBanner what="this week" />}
        {loadError && <LoadErrorBanner message={loadError} />}

        {!needsReconnect && !loadError && grid.length === 0 && (
          <div className="ds-card ds-card--bordered">
            <p className="text-base text-[var(--text-color-kumo-subtle)]">
              Nothing blocked this week.
            </p>
          </div>
        )}

        {/* Rows are your recurring blocks; columns are days. "63% this week" tells you
            nothing you can act on — a row reading `Deep work · 2/5` names the culprit. */}
        {grid.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="pb-2.5 pl-0.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                    Block
                  </th>
                  {week.map((d) => (
                    <th
                      key={d.date}
                      className="px-1 pb-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]"
                    >
                      {fmtWeekday(d.date)}
                      <span className="block text-[10px] font-normal tabular-nums text-[var(--text-color-kumo-inactive)]">
                        {fmtDayNum(d.date)}
                      </span>
                    </th>
                  ))}
                  <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                    Kept
                  </th>
                </tr>
              </thead>

              <tbody>
                {grid.map((row) => {
                  const p = row.scheduled ? Math.round((row.kept / row.scheduled) * 100) : null;
                  return (
                    <tr key={row.key}>
                      <td className="border-t border-[var(--color-kumo-line)] py-1.5 pr-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: row.color }}
                            aria-hidden
                          />
                          <span className="truncate text-base font-medium">{row.title}</span>
                        </div>
                      </td>

                      {row.cells.map((cell, i) => (
                        <td
                          key={week[i].date}
                          className="border-t border-[var(--color-kumo-line)] px-1 py-1.5"
                        >
                          <Mark status={cell} title={`${row.title} · ${fmtWeekday(week[i].date)}`} />
                        </td>
                      ))}

                      <td className="whitespace-nowrap border-t border-[var(--color-kumo-line)] py-1.5 text-right">
                        <span className="mr-2 text-sm tabular-nums text-[var(--text-color-kumo-inactive)]">
                          {row.kept}/{row.scheduled}
                        </span>
                        <span
                          className={
                            "font-mono text-sm font-semibold tabular-nums " +
                            (p !== null && p < 60
                              ? "text-[var(--text-color-kumo-warning)]"
                              : "")
                          }
                        >
                          {p === null ? "—" : `${p}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr>
                  <td className="border-t border-[var(--color-kumo-line)] pt-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                    Follow-through
                  </td>
                  {perDay.map((d, i) => {
                    const p = pct(d.ratio);
                    return (
                      <td
                        key={week[i].date}
                        className="border-t border-[var(--color-kumo-line)] pt-3 text-center font-mono text-base font-semibold tabular-nums"
                      >
                        {p === null ? (
                          <span className="font-normal text-[var(--text-color-kumo-inactive)]">
                            —
                          </span>
                        ) : (
                          `${p}%`
                        )}
                      </td>
                    );
                  })}
                  <td className="border-t border-[var(--color-kumo-line)]" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
          A day with nothing blocked scores <strong className="font-semibold">—</strong>, not 0%. A
          rest day is not a failure.
        </p>
      </div>
    </AppShell>
  );
}

/** Kept, missed, or never scheduled — the third is not a failure and must not look like one. */
function Mark({ status, title }: { status: string | null; title: string }) {
  if (status === null || status === "upcoming") {
    return (
      <span
        className="mx-auto block size-6 rounded-md"
        title={`${title} · ${status === null ? "not scheduled" : "upcoming"}`}
      >
        <span className="mx-auto mt-[11px] block h-px w-2 rounded bg-[var(--color-kumo-line)]" />
      </span>
    );
  }
  if (status === "done") {
    return (
      <span
        className="mx-auto block size-6 rounded-md bg-[color-mix(in_oklab,var(--color-kumo-success)_82%,transparent)]"
        title={`${title} · kept`}
      />
    );
  }
  return (
    <span
      className="mx-auto block size-6 rounded-md border-[1.5px] border-dashed border-[color-mix(in_oklab,var(--color-kumo-warning)_70%,transparent)]"
      title={`${title} · missed`}
    />
  );
}

/** "Jul 6" — noon-UTC avoids a date rollover. */
function fmtDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
function fmtWeekday(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}
function fmtDayNum(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: "UTC",
  });
}
