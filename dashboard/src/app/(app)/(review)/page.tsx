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
import { followThrough, totalFollowThrough } from "@/lib/activity/metrics";
import { habitsForDate, scoreDay } from "@/lib/habits/metrics";
import { HABIT_COLS, ENTRY_COLS, toHabit, toEntry } from "@/lib/habits/rows";
import {
  dateStringInTz,
  shiftDate,
  weekStartDate,
  resolveViewerTimeZone,
} from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "../../timezone-sync";
import { DayList } from "../../day-list";
import { HabitList } from "../../habit-list";
import { MetricHeader } from "../../metric-header";
import { ReconnectBanner, LoadErrorBanner } from "../../banners";

// The ledger is read per request and never cached — marking something done must show up
// instantly. The CALENDAR is cached for 5 minutes inside lib/google/calendar.ts, which is
// what made date navigation stop being slow.
export const dynamic = "force-dynamic";

/** The day, plus the 6 before it — so "vs your average" is your OWN average. */
const TRAILING = 7;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const cookieStore = await cookies();
  // An invalid tz would throw RangeError out of every Intl call, so until it's resolved we
  // skip the fetch and let <TimezoneSync> report the real zone — the day is then fetched
  // once, for the right day, instead of twice.
  const { tz, resolved } = resolveViewerTimeZone(cookieStore.get("tz")?.value);

  if (!resolved) {
    return (
      <div className="w-full max-w-5xl px-6 py-6">
        <TimezoneSync current={tz} resolved={false} />
        <p className="text-base text-[var(--text-color-kumo-subtle)]">Loading your day…</p>
      </div>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? (dateParam as string)
    : today;

  const from = shiftDate(date, -(TRAILING - 1));
  const dates = dateRange(from, TRAILING);

  // A weekly habit is judged on its whole week, so Monday's row has to see Friday's log.
  // That's the entry window — one indexed week, not the months a streak would need.
  const week = { start: weekStartDate(date), end: shiftDate(weekStartDate(date), 6) };

  // All the Supabase reads fire together. This used to run getUser() and THEN the
  // queries, stacking network round-trips for no reason: RLS already scopes every table
  // to its owner, so none of them needs to wait for the user id to come back.
  const supabase = await createClient();
  const [user, { data: cred }, { data: logData }, { data: habitData }, { data: entryData }] =
    await Promise.all([
      getUser(), // cache()'d — the layout already asked, so this costs nothing
      supabase.from("google_credentials").select("refresh_token").maybeSingle(),
      supabase
        .from("activity_logs")
        .select(
          "gcal_event_id, title, done, occurred_on, planned_start, planned_end, color, ended_at",
        )
        .gte("occurred_on", from)
        .lte("occurred_on", date),
      supabase
        .from("habits")
        .select(HABIT_COLS)
        .is("archived_at", null)
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("habit_entries")
        .select(ENTRY_COLS)
        .gte("occurred_on", week.start)
        .lte("occurred_on", week.end),
    ]);
  if (!user) redirect("/login");

  // Habits need no calendar and no Google token, so they're built before the try/catch
  // below and render even when the calendar can't load.
  const habitRows = habitsForDate(
    (habitData ?? []).map(toHabit),
    (entryData ?? []).map(toEntry),
    date,
    today,
    week,
  );

  const logs = (logData ?? []) as ActivityLog[];

  let days: ReconstructedDay[] = [];
  let needsReconnect = !cred?.refresh_token;
  let loadError: string | null = null;

  if (cred?.refresh_token) {
    try {
      // Whole months, not a ragged 7-day sliver — so stepping a day left or right lands
      // inside a month we already hold, and costs Google nothing.
      const events = await listCalendarEventsForMonths(
        cred.refresh_token,
        monthsSpanned(dates),
        (m) => monthBounds(m, tz),
      );
      days = reconstructRange(events, logs, new Date(), dates, tz);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) needsReconnect = true;
      else loadError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  } else if (logs.length) {
    // No calendar access, but recorded rows can still show.
    days = reconstructRange([], logs, new Date(), dates, tz);
  }

  const items = days.find((d) => d.date === date)?.items ?? [];
  const ft = followThrough(items);

  // "Your average" is the other six days — comparing today with itself is no comparison at
  // all. Days with nothing blocked contribute nothing, so a rest day can't drag the baseline.
  const prior = totalFollowThrough(
    days.filter((d) => d.date !== date).map((d) => followThrough(d.items)),
  );

  const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <div className="w-full max-w-5xl px-6 py-6">
      <TimezoneSync current={tz} resolved />

      <div className="mb-4 flex items-center gap-1.5">
        <Link
          href={`/?date=${shiftDate(date, -1)}`}
          className="ds-btn ds-btn--secondary ds-btn--sm"
          aria-label="Previous day"
        >
          ‹
        </Link>
        <Link
          href={`/?date=${shiftDate(date, 1)}`}
          className="ds-btn ds-btn--secondary ds-btn--sm"
          aria-label="Next day"
        >
          ›
        </Link>
        <h2 className="ml-1.5 text-base font-medium tabular-nums">{dateLabel}</h2>
        {date !== today && (
          <Link href="/" className="ds-btn ds-btn--ghost ds-btn--sm ml-1">
            Today
          </Link>
        )}
      </div>

      <MetricHeader
        label={`Follow-through · ${dateLabel}`}
        ft={ft}
        compare={prior.ratio !== null ? prior : undefined}
        compareLabel="your 6-day average"
      />

      {needsReconnect && <ReconnectBanner what="this day" />}
      {loadError && <LoadErrorBanner message={loadError} />}

      {!needsReconnect && !loadError && <DayList items={items} date={date} tz={tz} />}

      {/* Outside the calendar guards on purpose: a habit has no Google event behind it,
          so a dead token or a failed fetch is no reason to stop you logging pushups. */}
      <HabitList
        rows={habitRows}
        score={scoreDay(habitRows)}
        date={date}
        editable={date <= today}
      />
    </div>
  );
}
