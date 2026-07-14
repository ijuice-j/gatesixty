import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/user";
import { listCalendarEventsForMonths, GoogleAuthExpiredError } from "@/lib/google/calendar";
import {
  reconstructRange,
  dateRange,
  monthsSpanned,
  monthBounds,
  type ReconstructedDay,
} from "@/lib/activity/range";
import {
  followThrough,
  totalFollowThrough,
  habitsOverRange,
  pct,
} from "@/lib/activity/metrics";
import {
  resolveViewerTimeZone,
  dateStringInTz,
  monthStartDate,
  daysInMonth,
  shiftMonth,
  weekdayIndex,
} from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "../../timezone-sync";
import { MetricHeader } from "../../metric-header";
import { ReconnectBanner, LoadErrorBanner } from "../../banners";

// The ledger is read per request and never cached. The CALENDAR is cached for 5 minutes
// (lib/google/calendar.ts) — see the note in ../page.tsx.
export const dynamic = "force-dynamic";

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const cookieStore = await cookies();
  const { tz, resolved } = resolveViewerTimeZone(cookieStore.get("tz")?.value);

  if (!resolved) {
    return (
        <div className="w-full max-w-5xl px-6 py-6">
          <TimezoneSync current={tz} resolved={false} />
          <p className="text-base text-[var(--text-color-kumo-subtle)]">Loading your month…</p>
        </div>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "") ? (dateParam as string) : today;

  const first = monthStartDate(ref);
  const prevFirst = shiftMonth(first, -1);
  const nextFirst = shiftMonth(first, 1);
  const nDays = daysInMonth(first);
  const nPrev = daysInMonth(prevFirst);

  // This month and the previous one — the previous one is the delta.
  const dates = dateRange(prevFirst, nPrev + nDays);

  // Auth and both queries in parallel — RLS scopes each table to its owner, so neither
  // query has to wait for the user id.
  const supabase = await createClient();
  const [user, { data: cred }, { data: logData }] = await Promise.all([
    getUser(),
    supabase.from("google_credentials").select("refresh_token").maybeSingle(),
    supabase
      .from("activity_logs")
      .select(
        "gcal_event_id, title, done, occurred_on, planned_start, planned_end, color, ended_at",
      )
      .gte("occurred_on", prevFirst)
      .lt("occurred_on", nextFirst),
  ]);
  if (!user) redirect("/login");

  const logs = (logData ?? []) as ActivityLog[];

  let all: ReconstructedDay[] = [];
  let needsReconnect = !cred?.refresh_token;
  let loadError: string | null = null;

  if (cred?.refresh_token) {
    try {
      // Exactly the two months this view needs — and they're the same cache entries the
      // day and week views fill, so switching zoom inside a month costs Google nothing.
      const events = await listCalendarEventsForMonths(
        cred.refresh_token,
        monthsSpanned(dates),
        (m) => monthBounds(m, tz),
      );
      all = reconstructRange(events, logs, new Date(), dates, tz);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) needsReconnect = true;
      else loadError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  } else if (logs.length) {
    all = reconstructRange([], logs, new Date(), dates, tz);
  }

  const month = all.slice(nPrev);
  const prevMonth = all.slice(0, nPrev);

  const perDay = month.map((d) => ({ date: d.date, ft: followThrough(d.items) }));
  const ft = totalFollowThrough(perDay.map((d) => d.ft));
  const prevFt = totalFollowThrough(prevMonth.map((d) => followThrough(d.items)));

  const habits = habitsOverRange(month);
  const blockedDays = perDay.filter((d) => d.ft.plannedMin > 0).length;
  const best = bestStreak(habits);

  const monthLabel = new Date(`${first}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const prevLabel = new Date(`${prevFirst}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC",
  });

  return (
      <div className="w-full max-w-5xl px-6 py-6">
        <TimezoneSync current={tz} resolved />

        <div className="mb-4 flex items-center gap-1.5">
          <Link
            href={`/month?date=${prevFirst}`}
            className="ds-btn ds-btn--secondary ds-btn--sm"
            aria-label="Previous month"
          >
            ‹
          </Link>
          <Link
            href={`/month?date=${nextFirst}`}
            className="ds-btn ds-btn--secondary ds-btn--sm"
            aria-label="Next month"
          >
            ›
          </Link>
          <h2 className="ml-1.5 text-base font-medium">{monthLabel}</h2>
        </div>

        <MetricHeader
          label={`Follow-through · ${monthLabel}`}
          ft={ft}
          compare={prevFt.ratio !== null ? prevFt : undefined}
          compareLabel={prevLabel}
        />

        {needsReconnect && <ReconnectBanner what="this month" />}
        {loadError && <LoadErrorBanner message={loadError} />}

        {!needsReconnect && !loadError && (
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            {/* Every day, at a glance. */}
            <section>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
                Every day, by follow-through
              </h3>
              <Heatmap first={first} perDay={perDay} today={today} />
              <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
                Hollow = nothing blocked. Darker = more of what you planned, you kept.
              </p>
              <dl className="mt-4 flex gap-6">
                <div>
                  <dd className="text-xl font-semibold tabular-nums">{best}</dd>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                    Best streak
                  </dt>
                </div>
                <div>
                  <dd className="text-xl font-semibold tabular-nums">{blockedDays}</dd>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                    Days blocked
                  </dt>
                </div>
              </dl>
            </section>

            {/* The habits. Worst first — the block you keep dropping is the one to see. */}
            <section>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
                Recurring blocks · worst first
              </h3>
              {habits.length === 0 ? (
                <div className="ds-card ds-card--bordered">
                  <p className="text-base text-[var(--text-color-kumo-subtle)]">
                    Nothing blocked this month.
                  </p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-[var(--color-kumo-line)] pb-2 pr-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                        Block
                      </th>
                      <th className="border-b border-[var(--color-kumo-line)] pb-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                        Kept
                      </th>
                      <th className="border-b border-[var(--color-kumo-line)] pb-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                        Follow-through
                      </th>
                      <th className="border-b border-[var(--color-kumo-line)] pb-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                        Streak
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((h) => {
                      const p = Math.round(h.ratio * 100);
                      const bad = p < 60;
                      return (
                        <tr key={h.key}>
                          <td className="border-b border-[var(--color-kumo-line)] py-2.5 pr-2.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: h.color }}
                                aria-hidden
                              />
                              <span className="truncate text-base">{h.title}</span>
                            </div>
                          </td>
                          <td className="border-b border-[var(--color-kumo-line)] py-2.5 text-right text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
                            {h.kept}/{h.scheduled}
                          </td>
                          <td className="whitespace-nowrap border-b border-[var(--color-kumo-line)] py-2.5 text-right">
                            <span className="mr-2 inline-block h-1 w-20 overflow-hidden rounded-full bg-[var(--color-kumo-fill)] align-middle">
                              <span
                                className="block h-full rounded-full"
                                style={{
                                  width: `${p}%`,
                                  backgroundColor: bad
                                    ? "var(--color-kumo-warning)"
                                    : "var(--color-kumo-success)",
                                }}
                              />
                            </span>
                            <span
                              className={
                                "font-mono text-sm font-semibold tabular-nums " +
                                (bad ? "text-[var(--text-color-kumo-warning)]" : "")
                              }
                            >
                              {p}%
                            </span>
                          </td>
                          <td className="border-b border-[var(--color-kumo-line)] py-2.5 text-right text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
                            {h.streak ? `${h.streak}d` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
                Grouped by title — a habit identity already in your data.
              </p>
            </section>
          </div>
        )}
      </div>
  );
}

function Heatmap({
  first,
  perDay,
  today,
}: {
  first: string;
  perDay: { date: string; ft: ReturnType<typeof followThrough> }[];
  today: string;
}) {
  const pad = weekdayIndex(first); // Monday-first grid

  return (
    <div className="grid max-w-[360px] grid-cols-7 gap-1.5">
      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
        <div
          key={i}
          className="text-center text-[10px] uppercase tracking-wide text-[var(--text-color-kumo-inactive)]"
        >
          {d}
        </div>
      ))}

      {Array.from({ length: pad }, (_, i) => (
        <div key={`pad-${i}`} />
      ))}

      {perDay.map(({ date, ft }) => {
        const p = pct(ft.ratio);
        const isToday = date === today;
        return (
          <Link
            key={date}
            href={`/?date=${date}`}
            title={
              p === null
                ? `${date} · nothing blocked`
                : `${date} · ${p}% follow-through`
            }
            className={
              "flex aspect-square items-center justify-center rounded-md text-[10px] tabular-nums transition hover:ring-2 hover:ring-[var(--color-kumo-focus)] " +
              (p === null
                ? "border border-[var(--color-kumo-line)] text-[var(--text-color-kumo-inactive)]"
                : "text-[var(--text-color-kumo-default)]") +
              (isToday ? " ring-1 ring-[var(--color-kumo-brand)]" : "")
            }
            style={
              p === null
                ? undefined
                : {
                    // 12% floor so a 0% day still reads as "you had blocks and dropped them",
                    // which is a different fact from "you had none".
                    backgroundColor: `color-mix(in oklab, var(--color-kumo-success) ${Math.round(12 + p * 0.62)}%, var(--color-kumo-base))`,
                  }
            }
          >
            {Number(date.slice(8, 10))}
          </Link>
        );
      })}
    </div>
  );
}

/** The longest kept-run any single block managed this month. */
function bestStreak(habits: { streak: number }[]): number {
  return habits.reduce((m, h) => Math.max(m, h.streak), 0);
}
