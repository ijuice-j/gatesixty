import type { Habit, HabitEntry } from "./types";

/**
 * The four verdicts, and why there are four rather than two.
 *
 * `open` is this module's `upcoming`. followThrough() excludes upcoming blocks because
 * "at 9am you'd be staring at 8% and feeling like a failure for a day you haven't
 * lived" — a habit list that paints every unticked box red at breakfast makes exactly
 * that mistake. A habit is not missed until its period has ENDED.
 *
 * `untracked` is this module's `ratio: null`. A habit with no target is measured, never
 * judged: it shows the number and scores nothing, the same mercy a rest day gets.
 */
export type HabitStatus = "kept" | "missed" | "open" | "untracked";

export type HabitProgress = {
  habit: Habit;
  /** Logged on the date asked about. `null` = nothing logged, which is not `0`. */
  value: number | null;
  /**
   * What counts toward the target. For a daily habit that's the day's value; for a
   * weekly one it's the running total across the whole week, because the week is the
   * unit of judgment.
   */
  progress: number;
  /**
   * The target being judged against — frozen from the entry whenever one exists, so
   * raising a goal from 50 to 100 cannot turn last week's successes into failures.
   */
  target: number | null;
  status: HabitStatus;
};

/** The window a weekly habit is judged over. Monday…Sunday, inclusive. */
export type Week = { start: string; end: string };

/**
 * The snapshot on the latest entry, taken RAW.
 *
 * A null snapshot means the habit was untracked when that entry was written, and it
 * has to stay untracked — coalescing it to the habit's current target would judge an
 * old entry against a goal that did not exist yet, which is the whole thing
 * target_snapshot is here to prevent.
 */
function latestSnapshot(entries: HabitEntry[]): number | null {
  let latest: HabitEntry | null = null;
  for (const e of entries) {
    if (!latest || e.occurred_on > latest.occurred_on) latest = e;
  }
  return latest ? latest.target_snapshot : null;
}

function statusOf(
  period: Habit["period"],
  progress: number,
  target: number | null,
  date: string,
  today: string,
  weekEnd: string,
): HabitStatus {
  if (target === null) return "untracked";
  if (progress >= target) return "kept";
  // Not there yet — but you have only MISSED it once the period is over.
  const settled = period === "week" ? weekEnd < today : date < today;
  return settled ? "missed" : "open";
}

/**
 * What to render for each habit on `date`.
 *
 * `entries` must cover at least `week` — a weekly habit is judged on its whole week, so
 * Monday's row has to know about Friday's log. Dates are viewer-local `YYYY-MM-DD`;
 * `today` is what decides whether a period has settled.
 *
 * `week` is passed in rather than derived so this module keeps only type-only imports,
 * matching lib/activity/metrics.ts: pure input → output, no clock and no timezone of
 * its own. Callers already hold the week — see lib/time's weekStartDate.
 */
export function habitsForDate(
  habits: Habit[],
  entries: HabitEntry[],
  date: string,
  today: string,
  week: Week,
): HabitProgress[] {
  return habits.map((habit) => {
    const mine = entries.filter((e) => e.habit_id === habit.id);
    const onDay = mine.find((e) => e.occurred_on === date) ?? null;
    const inWeek = mine.filter(
      (e) => e.occurred_on >= week.start && e.occurred_on <= week.end,
    );

    const weekly = habit.period === "week";
    const progress = weekly
      ? inWeek.reduce((sum, e) => sum + e.value, 0)
      : (onDay?.value ?? 0);

    // Fall back to the habit's CURRENT target only when there's no entry to freeze
    // against. With an entry present its snapshot wins outright, null included.
    const target = weekly
      ? inWeek.length
        ? latestSnapshot(inWeek)
        : habit.target
      : onDay
        ? onDay.target_snapshot
        : habit.target;

    return {
      habit,
      value: onDay?.value ?? null,
      progress,
      target,
      status: statusOf(habit.period, progress, target, date, today, week.end),
    };
  });
}

export type HabitScore = { kept: number; scored: number };

/**
 * The day's "3 of 4" — DAILY habits only.
 *
 * A 3x/week habit sitting at 3/3 by Wednesday is not something you "kept today", and
 * counting it would flatter Thursday, Friday, Saturday and Sunday for work already
 * done. Weekly habits carry their own this-week progress instead.
 *
 * Untracked habits are excluded from both halves: they are never judged, so they can
 * neither raise nor lower the count.
 */
export function scoreDay(rows: HabitProgress[]): HabitScore {
  let kept = 0;
  let scored = 0;
  for (const r of rows) {
    if (r.habit.period !== "day" || r.status === "untracked") continue;
    scored++;
    if (r.status === "kept") kept++;
  }
  return { kept, scored };
}

/** "45 / 50 reps" · "2 / 3" · "45 reps" when there's nothing to hit. */
export function formatProgress(row: HabitProgress): string {
  const n = trim(row.progress);
  const unit = row.habit.unit ? ` ${row.habit.unit}` : "";
  if (row.target === null) return `${n}${unit}`;
  return `${n} / ${trim(row.target)}${unit}`;
}

/** 45, not 45.00 — but 0.5 stays 0.5. */
export function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}
