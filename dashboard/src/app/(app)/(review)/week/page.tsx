import type { ReactNode } from "react";
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
import { followThrough, totalFollowThrough, weekGrid, pct } from "@/lib/activity/metrics";
import {
  habitsForWeek,
  formatProgress,
  trim,
  type HabitCell,
  type HabitStatus,
  type HabitWeeklyRow,
} from "@/lib/habits/metrics";
import { HABIT_COLS, ENTRY_COLS, toHabit, toEntry } from "@/lib/habits/rows";
import type { Habit } from "@/lib/habits/types";
import {
  resolveViewerTimeZone,
  dateStringInTz,
  weekStartDate,
  shiftDate,
} from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "../../../timezone-sync";
import { MetricHeader } from "../../../metric-header";
import { ReconnectBanner, LoadErrorBanner } from "../../../banners";

// The ledger is read per request and never cached. The CALENDAR is cached for 5 minutes
// (lib/google/calendar.ts) — see the note in ../page.tsx.
export const dynamic = "force-dynamic";

export default async function WeekPage({
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
        <p className="text-base text-[var(--text-color-kumo-subtle)]">Loading your week…</p>
      </div>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "") ? (dateParam as string) : today;

  const monday = weekStartDate(ref);
  const prevMonday = shiftDate(monday, -7);

  // 14 days: this week and the one before it, so the delta is real.
  const dates = dateRange(prevMonday, 14);

  // The seven days on screen. Derived here and NOT from the reconstruction below, which
  // is empty whenever Google fails — habits would silently vanish behind a dead token.
  // Named weekDates because `week` is already this file's slice of ReconstructedDay[].
  const weekDates = dateRange(monday, 7);
  const sunday = weekDates[6];

  // Auth and both queries in parallel — RLS scopes each table to its owner, so neither
  // query has to wait for the user id.
  const supabase = await createClient();
  const [user, { data: cred }, { data: logData }, { data: habitData }, { data: entryData }] =
    await Promise.all([
      getUser(),
      supabase.from("google_credentials").select("refresh_token").maybeSingle(),
      supabase
        .from("activity_logs")
        .select(
          "gcal_event_id, title, done, occurred_on, planned_start, planned_end, color, ended_at",
        )
        .gte("occurred_on", prevMonday)
        .lt("occurred_on", shiftDate(monday, 7)),
      // No archived filter — a habit's lifespan decides, per day. See lib/habits/metrics.
      supabase.from("habits").select(HABIT_COLS).order("sort_order").order("created_at"),
      // Exactly the week on screen. It's already a whole Mon–Sun, so a weekly habit is
      // judged on its whole week and nothing spills. No previous week: there is no habit
      // delta to compute, so there's nothing to fetch one for.
      supabase
        .from("habit_entries")
        .select(ENTRY_COLS)
        .gte("occurred_on", monday)
        .lte("occurred_on", sunday),
    ]);
  if (!user) redirect("/login");

  // Built before the calendar try/catch, exactly as on the day view: a habit has no
  // Google event behind it, so a dead token is no reason to hide your week's pushups.
  const habitWeek = habitsForWeek(
    (habitData ?? []).map((r) => toHabit(r, tz)),
    (entryData ?? []).map(toEntry),
    weekDates,
    today,
  );
  const hasHabits = habitWeek.daily.length > 0 || habitWeek.weekly.length > 0;

  const logs = (logData ?? []) as ActivityLog[];

  let all: ReconstructedDay[] = [];
  let needsReconnect = !cred?.refresh_token;
  let loadError: string | null = null;

  if (cred?.refresh_token) {
    try {
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

  const week = all.slice(7); // this week
  const prev = all.slice(0, 7); // the week before, for the delta

  const perDay = week.map((d) => followThrough(d.items));
  const ft = totalFollowThrough(perDay);
  const prevFt = totalFollowThrough(prev.map((d) => followThrough(d.items)));

  const grid = weekGrid(week);
  const rangeLabel = `${fmtDay(monday)} – ${fmtDay(shiftDate(monday, 6))}`;

  return (
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
          <div className="ds-card ds-card--bordered mb-6">
            <p className="text-base text-[var(--text-color-kumo-subtle)]">
              Nothing blocked this week.
            </p>
          </div>
        )}

        {/*
         * Rows are things; columns are days. "63% this week" tells you nothing you can act
         * on — a row reading `Deep work · 2/5` names the culprit.
         *
         * Blocks and habits share this table because they share the DAY: seeing that
         * Wednesday sank both is the observation the week view exists for, and it only
         * lands if the columns line up. What they do NOT share is a verdict. The
         * follow-through row closes the blocks section rather than sitting in a <tfoot>
         * under everything, because it counts blocks and nothing else — a total drawn
         * beneath the habit rows would be claiming to total them. Each section labels
         * itself for the same reason, which is why the first column has no <th>: it holds
         * two kinds of thing and naming it once would name the wrong one.
         *
         * The whole table renders outside the calendar guards. Habits have no Google event
         * behind them, so a dead token blanks the blocks section and leaves the rest.
         */}
        {(grid.length > 0 || hasHabits) && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="pb-2.5 pl-0.5" />
                  {weekDates.map((date) => (
                    <th
                      key={date}
                      className="px-1 pb-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]"
                    >
                      {fmtWeekday(date)}
                      <span className="block text-[10px] font-normal tabular-nums text-[var(--text-color-kumo-inactive)]">
                        {fmtDayNum(date)}
                      </span>
                    </th>
                  ))}
                  <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                    Kept
                  </th>
                </tr>
              </thead>

              {grid.length > 0 && (
                <tbody>
                  <SectionLabel>Recurring blocks</SectionLabel>

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
                            key={weekDates[i]}
                            className="border-t border-[var(--color-kumo-line)] px-1 py-1.5"
                          >
                            <Mark
                              status={cell}
                              title={`${row.title} · ${fmtWeekday(weekDates[i])}`}
                            />
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

                  {/* Closes the blocks section. It counts hours, and only the rows above
                      it have any. */}
                  <tr>
                    <td className="border-t border-[var(--color-kumo-line)] pt-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                      Follow-through
                    </td>
                    {perDay.map((d, i) => {
                      const p = pct(d.ratio);
                      return (
                        <td
                          key={weekDates[i]}
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
                </tbody>
              )}

              {hasHabits && (
                <tbody>
                  <SectionLabel spaced={grid.length > 0}>Habits</SectionLabel>

                  {habitWeek.daily.map((row) => (
                    <tr key={row.habit.id}>
                      <HabitName habit={row.habit} />

                      {row.cells.map((cell) =>
                        cell.status === null ? (
                          // Not a mark — ground. The dash already means "no verdict" twice
                          // over (not scheduled, not yet); a third meaning on the same eight
                          // pixels and the vocabulary stops being one. So the row simply
                          // starts where the habit started, and the days before it are
                          // outside the record rather than inside it and blank.
                          <td
                            key={cell.date}
                            className="border-t border-[var(--color-kumo-line)] bg-[var(--color-kumo-recessed)] px-1 py-1.5"
                            // Both edges of a life land here, and they are not the same
                            // fact — one end you hadn't declared it, the other you'd
                            // retired it. Saying "didn't exist yet" on the far side would
                            // deny a habit you kept for months.
                            title={`${row.habit.name} · ${
                              cell.date < row.habit.created_on ? "didn't exist yet" : "archived"
                            }`}
                          >
                            <span className="block size-6" />
                          </td>
                        ) : (
                          <td
                            key={cell.date}
                            className="border-t border-[var(--color-kumo-line)] px-1 py-1.5"
                          >
                            <HabitMark cell={cell} habit={row.habit} />
                          </td>
                        ),
                      )}

                      {/* The fraction, and only the fraction. The blocks above print a
                          percentage beside theirs; a habit never can — follow-through is a
                          percentage backed by hours and this is a count of things, and two
                          numbers of visibly different kinds must not be misread as one. The
                          gap where the percentage would go is that rule, left visible. */}
                      <td className="whitespace-nowrap border-t border-[var(--color-kumo-line)] py-1.5 text-right">
                        <span className="text-sm tabular-nums text-[var(--text-color-kumo-inactive)]">
                          {row.scored === 0 ? "—" : `${row.kept}/${row.scored}`}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {habitWeek.weekly.map((row) => (
                    <tr key={row.habit.id}>
                      <HabitName habit={row.habit} />
                      <WeekBand row={row} />
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}

        <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
          A day with nothing blocked scores <strong className="font-semibold">—</strong>, not 0%. A
          rest day is not a failure.
        </p>

        {hasHabits && (
          <p className="mt-1.5 text-sm text-[var(--text-color-kumo-inactive)]">
            Habits aren&apos;t counted in follow-through — they have no hours to weigh. A
            weekly habit spans the week because the week is what it&apos;s judged on: it was
            never missed on a Tuesday. A shaded day is one you hadn&apos;t declared the habit
            for, or had already archived it — blank, not missed.
          </p>
        )}
      </div>
  );
}

/** Names a section inside the shared table. Both halves label themselves; neither owns
 *  the first column. */
function SectionLabel({
  children,
  spaced = false,
}: {
  children: ReactNode;
  spaced?: boolean;
}) {
  return (
    <tr>
      <td
        colSpan={9}
        className={
          "pb-1 pl-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)] " +
          (spaced ? "pt-8" : "")
        }
      >
        {children}
      </td>
    </tr>
  );
}

function HabitName({ habit }: { habit: Habit }) {
  return (
    <td className="border-t border-[var(--color-kumo-line)] py-1.5 pr-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: habit.color }}
          aria-hidden
        />
        <span className="truncate text-base font-medium">{habit.name}</span>
      </div>
    </td>
  );
}

/**
 * One verdict, one cell, drawn as wide as the period it is judged over.
 *
 * It spans the Kept column too, and that part is not cosmetic: if the band stopped at
 * Sunday and Kept read `3/3`, that column would mean "3 of 3 days" one row up and "3 of 3
 * gym visits" here. One column, two meanings. The band swallows it.
 *
 * What it is deliberately NOT is a bar. A bar's length is progress toward a target, and a
 * length drawn across a row of weekday labels reads as time — 60% across would sit under
 * Thursday and say "you did this until Thursday". The bracket is the same width at every
 * value: it says "this whole week", and nothing about Thursday.
 */
function WeekBand({ row }: { row: HabitWeeklyRow }) {
  const days = row.loggedOn.length
    ? row.loggedOn.map((d) => fmtWeekday(d)).join(", ")
    : "nothing logged";

  return (
    <td colSpan={8} className="border-t border-[var(--color-kumo-line)] px-1 py-1.5">
      <div className="relative flex h-6 items-center justify-center" title={`${row.habit.name} · ${days}`}>
        <span
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--color-kumo-line)]"
        />
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-2 w-px -translate-y-1/2 bg-[var(--color-kumo-line)]"
        />
        <span
          aria-hidden
          className="absolute right-0 top-1/2 h-2 w-px -translate-y-1/2 bg-[var(--color-kumo-line)]"
        />

        {/* Knocked out of the rule so the line doesn't run through the text. */}
        <span className="relative flex items-center gap-2 bg-[var(--color-kumo-canvas)] px-2">
          <StatusSquare status={row.status} />
          <span className="font-mono text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
            {formatProgress(row)}
            <span className="text-[var(--text-color-kumo-inactive)]"> wk</span>
          </span>
        </span>
      </div>
    </td>
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

/**
 * The habit vocabulary — and deliberately not <Mark>.
 *
 * <Mark> maps done/upcoming/null: three states. A habit has kept/missed/open/untracked,
 * and untracked needs a shape <Mark> has no concept of. Mapping kept→done to reuse it is
 * the RecurringBlock-vs-Habit conflation lib/activity/metrics.ts spends a paragraph
 * forbidding — two meanings behind one word is how they get confused. The two sets share
 * the shapes where they share the meanings, and nowhere else.
 */
function HabitMark({ cell, habit }: { cell: HabitCell; habit: Habit }) {
  const day = fmtWeekday(cell.date);

  // Measured, never judged — so it gets no verdict shape at all. The number IS the
  // rendering, and a digit sitting among squares can't be mistaken for a verdict.
  if (cell.status === "untracked") {
    return (
      <span
        className="mx-auto block size-6 pt-[5px] text-center text-[10px] tabular-nums text-[var(--text-color-kumo-subtle)]"
        title={`${habit.name} · ${day} · ${
          cell.value === null ? "nothing logged" : trim(cell.value)
        } · not scored`}
      >
        {cell.value === null ? "·" : trim(cell.value)}
      </span>
    );
  }

  return (
    <StatusSquare
      status={cell.status}
      title={`${habit.name} · ${day} · ${
        cell.status === "kept" ? "kept" : cell.status === "missed" ? "missed" : "not yet"
      }`}
    />
  );
}

/** Kept, missed, or no verdict yet — the same three shapes the blocks grid uses, because
 *  these three mean the same three things. */
function StatusSquare({ status, title }: { status: HabitStatus | null; title?: string }) {
  if (status === "kept") {
    return (
      <span
        className="mx-auto block size-6 rounded-md bg-[color-mix(in_oklab,var(--color-kumo-success)_82%,transparent)]"
        title={title}
      />
    );
  }
  if (status === "missed") {
    return (
      <span
        className="mx-auto block size-6 rounded-md border-[1.5px] border-dashed border-[color-mix(in_oklab,var(--color-kumo-warning)_70%,transparent)]"
        title={title}
      />
    );
  }
  // `open`, and `null` for a weekly habit that didn't live the whole week. Both mean the
  // same thing — no verdict — and get the dash an upcoming block gets.
  return (
    <span className="mx-auto block size-6 rounded-md" title={title}>
      <span className="mx-auto mt-[11px] block h-px w-2 rounded bg-[var(--color-kumo-line)]" />
    </span>
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
