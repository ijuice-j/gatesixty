import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listCalendarEvents, GoogleAuthExpiredError } from "@/lib/google/calendar";
import { reconstructDay, summarizeDay, type DaySummary } from "@/lib/activity/day";
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

// Reconstruction reads the live calendar per request — never cache.
export const dynamic = "force-dynamic";

type WeekDay = { date: string; summary: DaySummary };

const EMPTY: DaySummary = { total: 0, done: 0, missed: 0, upcoming: 0 };

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
      <AppShell email={user.email} title="Week">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <TimezoneSync current={tz} resolved={false} />
          <p className="text-sm text-[var(--text-color-kumo-subtle)]">Loading your week…</p>
        </div>
      </AppShell>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? (dateParam as string)
    : today;

  const monday = weekStartDate(ref);
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
  const weekEndStr = shiftDate(monday, 7);
  // bounds[i]..bounds[i+1] is day i's UTC window; bounds[7] closes the week.
  const bounds = [...days, weekEndStr].map((d) => zonedDayStart(d, tz));

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
      .gte("occurred_on", monday)
      .lt("occurred_on", weekEndStr),
  ]);
  const logs = (logData ?? []) as ActivityLog[];

  let week: WeekDay[] = days.map((date) => ({ date, summary: EMPTY }));
  let needsReconnect = !cred?.refresh_token;
  let loadError: string | null = null;

  const summarize = (events: Parameters<typeof reconstructDay>[0]) => {
    const now = new Date();
    return days.map((date, i) => {
      const dayLogs = logs.filter((l) => l.occurred_on === date);
      const items = reconstructDay(events, dayLogs, now, {
        start: bounds[i],
        end: bounds[i + 1],
      });
      return { date, summary: summarizeDay(items) };
    });
  };

  if (cred?.refresh_token) {
    try {
      const events = await listCalendarEvents(
        cred.refresh_token,
        bounds[0],
        bounds[7],
      );
      week = summarize(events);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) needsReconnect = true;
      else loadError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  } else if (logs.length) {
    // No calendar access, but recorded done rows can still be tallied.
    week = summarize([]);
  }

  const rangeLabel = `${fmtDay(monday)} – ${fmtDay(days[6])}`;

  return (
    <AppShell email={user.email} title="Week">
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

        {needsReconnect && (
          <div className="ds-banner ds-banner--warning mb-4">
            <div className="ds-banner__content">
              Reconnect Google to reconstruct this week.
            </div>
            <div className="ds-banner__actions">
              <form action="/auth/signout" method="post">
                <button className="ds-btn ds-btn--outline ds-btn--sm" type="submit">
                  Reconnect
                </button>
              </form>
            </div>
          </div>
        )}

        {loadError && (
          <div className="ds-banner ds-banner--danger mb-4">
            <div className="ds-banner__content">Failed to load activity: {loadError}</div>
          </div>
        )}

        {/* Same list pattern as the day view: one bordered panel, hairline-separated rows. */}
        <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
          <ul className="divide-y divide-[var(--color-kumo-line)]">
            {week.map(({ date, summary }) => (
              <li key={date}>
                <Link
                  href={`/?date=${date}`}
                  aria-current={date === today ? "date" : undefined}
                  className="flex h-12 flex-row items-center gap-4 px-4 hover:bg-[var(--color-kumo-fill-hover)] aria-[current]:bg-[var(--color-kumo-tint)]"
                >
                  <span className="w-16 shrink-0 text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
                    <span className="text-[var(--text-color-kumo-default)]">
                      {fmtWeekday(date)}
                    </span>{" "}
                    {fmtDayNum(date)}
                  </span>

                  {summary.total === 0 ? (
                    <span className="flex-1 text-sm text-[var(--text-color-kumo-inactive)]">
                      No events
                    </span>
                  ) : (
                    <>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-kumo-fill)]">
                        <span
                          className="block h-full rounded-full bg-[var(--color-kumo-success)]"
                          style={{
                            width: `${Math.round(
                              (summary.done / summary.total) * 100,
                            )}%`,
                          }}
                        />
                      </span>
                      <span className="w-32 shrink-0 text-right text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
                        {summary.done}/{summary.total} done
                        {summary.missed > 0 && (
                          <span className="text-[var(--text-color-kumo-warning)]">
                            {" "}
                            · {summary.missed} missed
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

/** "Jul 6" for a YYYY-MM-DD string (noon-UTC avoids date rollover). */
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
