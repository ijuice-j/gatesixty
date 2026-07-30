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
  /**
   * `null` = there is nothing here to judge, which is not a verdict and not a miss.
   *
   * A weekly habit reaches it for a week it did not live end to end (see isLiveAllWeek); a
   * weekday habit reaches it on a day it isn't scheduled (see `scheduled`). Otherwise a
   * daily habit is in your life on the day and judged, or it isn't in the list at all.
   */
  status: HabitStatus | null;
  /**
   * Is this habit on the schedule for the date asked about? Always true for a daily or
   * weekly habit; false for a weekday habit on an off weekday. The day view keeps the row
   * (greyed, unloggable) so your roster stays visible; `status` is null when this is false.
   */
  scheduled: boolean;
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

/**
 * Was this habit active on `date`? True when `date` falls in ANY active span, half-open.
 *
 * The union, not one `[created_on, archived_on)` interval — archive then restore leaves a
 * gap the pair can't hold, and judging that gap as lived is the false accusation this
 * fixes. It governs whether a habit is SHOWN at all, which is a different question from
 * whether it's judged: "not being tracked then" has no row, rather than a fifth status
 * every renderer would have to draw as nothing.
 */
export function isLive(habit: Habit, date: string): boolean {
  return habit.active_spans.some(
    (s) => date >= s.start && (s.end === null || date < s.end),
  );
}

/**
 * Did ONE span cover the WHOLE week?
 *
 * A weekly habit makes one claim about seven days, so it needs all seven to have been its
 * own — and its own without interruption. Declare "3x a week" on Saturday, or archive it
 * on Wednesday, and the week was not wholly lived; calling either a miss accuses you of
 * failing a target you were never given the days to hit. A single span must contain the
 * week end to end: a pause that splits it disqualifies the week, which is exactly right.
 *
 * The symmetry is the point — it withholds a `kept` as readily as a `missed`. The tempting
 * version, which keeps the good news from a half-lived week and drops the bad, can only
 * ever flatter.
 */
function isLiveAllWeek(habit: Habit, week: Week): boolean {
  return habit.active_spans.some(
    (s) => s.start <= week.start && (s.end === null || week.end < s.end),
  );
}

/**
 * 0=Mon … 6=Sun — the same math as lib/time's weekdayIndex, kept LOCAL on purpose.
 *
 * This module must stay import-free of anything but types: the hand-rolled test runner
 * loads it under `node --experimental-strip-types`, which erases type imports but can't
 * resolve a value import's `@/` path alias. Constructing a Date from a fixed string reads
 * no clock, so purity holds. One line duplicated is the price of the module staying
 * runnable under bare node.
 */
function weekdayOf(dateStr: string): number {
  return (new Date(`${dateStr}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * Is a DAILY habit on the schedule for `date`?
 *
 * Every day, unless it's a weekday habit and this weekday isn't in its set — then the day
 * is *off*: nothing was promised, so it earns no verdict, the same as a rest day. A weekly
 * habit schedules by the week, not the day, so it's always "on" here; `period !== "day"`
 * short-circuits before weekdays is ever read.
 */
function scheduledOn(habit: Habit, date: string): boolean {
  return (
    habit.period !== "day" ||
    habit.weekdays === null ||
    habit.weekdays.includes(weekdayOf(date))
  );
}

/**
 * Did any active span overlap `[from, to]`?
 *
 * True interval overlap against every span — a habit active only Tuesday–Thursday never
 * sees Monday or Sunday, and one paused across the middle of the range is still part of
 * the range at its edges.
 */
function overlapsLife(habit: Habit, from: string, to: string): boolean {
  return habit.active_spans.some(
    (s) => s.start <= to && (s.end === null || s.end > from),
  );
}

/**
 * One habit's entries inside a Mon–Sun window.
 *
 * A string compare, not date math: `occurred_on` is ISO, so `>=`/`<=` already sort
 * correctly and this module stays free of a calendar.
 */
const entriesInWeek = (es: HabitEntry[], w: Week): HabitEntry[] =>
  es.filter((e) => e.occurred_on >= w.start && e.occurred_on <= w.end);

/**
 * The target a DAY is judged against.
 *
 * With an entry present its snapshot wins outright, null included. With no entry to freeze
 * against, the habit's current target — but only from the day it took effect. A no-entry
 * day before `target_effective_since` was lived under no goal (you added one later), and
 * judging it against today's goal is the retroactive rewrite `target_snapshot` exists to
 * forbid, for the one kind of day a snapshot can't cover.
 */
const dayTarget = (onDay: HabitEntry | null, h: Habit, date: string): number | null =>
  onDay
    ? onDay.target_snapshot
    : h.target_effective_since !== null && date >= h.target_effective_since
      ? h.target
      : null;

/**
 * The target a WEEK is judged against. The same rule, read off the week's latest entry —
 * and for a no-entry week, the current target only if it was effective from the week's
 * start, matching isLiveAllWeek's whole-week test.
 */
const weekTarget = (inWeek: HabitEntry[], h: Habit, weekStart: string): number | null =>
  inWeek.length
    ? latestSnapshot(inWeek)
    : h.target_effective_since !== null && weekStart >= h.target_effective_since
      ? h.target
      : null;

type Indexed = { all: HabitEntry[]; byDay: Map<string, HabitEntry> };
const NO_ENTRIES: Indexed = { all: [], byDay: new Map() };

/**
 * habit_id → its entries, plus a day index. Built once per call.
 *
 * A month of cells is then a map lookup per day per habit, instead of re-scanning every
 * entry you own for every cell drawn.
 */
function indexByHabit(entries: HabitEntry[]): Map<string, Indexed> {
  const idx = new Map<string, Indexed>();
  for (const e of entries) {
    let mine = idx.get(e.habit_id);
    if (!mine) {
      mine = { all: [], byDay: new Map() };
      idx.set(e.habit_id, mine);
    }
    mine.all.push(e);
    mine.byDay.set(e.occurred_on, e);
  }
  return idx;
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
  const idx = indexByHabit(entries);

  // Filtered, not statused — see isLive. Navigate to a day before you declared a habit
  // and it simply isn't there, rather than sitting in the list calling you a failure for
  // a promise you hadn't made yet.
  return habits
    .filter((habit) => isLive(habit, date))
    .map((habit) => {
      const mine = idx.get(habit.id) ?? NO_ENTRIES;
      const onDay = mine.byDay.get(date) ?? null;

      const weekly = habit.period === "week";
      const inWeek = weekly ? entriesInWeek(mine.all, week) : [];
      const progress = weekly
        ? inWeek.reduce((sum, e) => sum + e.value, 0)
        : (onDay?.value ?? 0);
      const target = weekly
        ? weekTarget(inWeek, habit, week.start)
        : dayTarget(onDay, habit, date);

      // Off-day weekday habits stay in the list — the day view greys them rather than
      // hiding them — but carry no verdict, so they never enter the day's score.
      const scheduled = scheduledOn(habit, date);

      return {
        habit,
        value: onDay?.value ?? null,
        progress,
        target,
        scheduled,
        status:
          !scheduled || (weekly && !isLiveAllWeek(habit, week))
            ? null
            : statusOf(habit.period, progress, target, date, today, week.end),
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
    if (r.habit.period !== "day" || r.status === null || r.status === "untracked")
      continue;
    scored++;
    if (r.status === "kept") kept++;
  }
  return { kept, scored };
}

/**
 * "45 / 50 reps" · "2 / 3" · "45 reps" when there's nothing to hit.
 *
 * Structurally typed rather than taking a HabitProgress, so the week view's weekly row
 * says the amount in the same words as the day view's. Same fact, same sentence.
 */
export function formatProgress(
  row: Pick<HabitProgress, "habit" | "progress" | "target">,
): string {
  const n = trim(row.progress);
  const unit = row.habit.unit ? ` ${row.habit.unit}` : "";
  if (row.target === null) return `${n}${unit}`;
  return `${n} / ${trim(row.target)}${unit}`;
}

/** 45, not 45.00 — but 0.5 stays 0.5. */
export function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "Mon Wed Fri" — a weekday habit's schedule, Mon-first, in week order. */
export function formatWeekdays(days: number[]): string {
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_LABELS[d])
    .join(" ");
}

// ---------------------------------------------------------------------------
// Ranges — the week grid and the month rollup
//
// habitsForDate answers "what do I render for this habit today". A review asks a
// different question over many days at once, and the answer is not that one called
// in a loop: a weekly habit called per-day returns the same verdict seven times,
// and seven copies of one verdict drawn in seven cells reads as seven kepts.
// ---------------------------------------------------------------------------

/** One day of a daily habit's week. */
export type HabitCell = {
  date: string;
  /**
   * `null` = the habit wasn't in your life that day. Not a miss and not a verdict
   * withheld — there was nothing to judge. lib/activity/metrics.ts spells the same idea
   * `cells: (status | null)[]`, where `null` is "not scheduled".
   */
  status: HabitStatus | null;
  /** What you logged. `null` = nothing logged, which is not `0`. */
  value: number | null;
};

/** The row a DAILY habit gets: one cell per day, because it judged each one. */
export type HabitDailyRow = {
  habit: Habit;
  /** One per date passed in, in order. */
  cells: HabitCell[];
  kept: number;
  /**
   * Cells that actually got a verdict — kept + missed, and nothing else.
   *
   * `open` is excluded, and that's the whole reason this isn't scoreDay(). At Wednesday
   * lunchtime a seven-cell row with four days still to come would read "2 of 7" and
   * grade you for a week you have not finished living. The blocks grid draws the same
   * line and calls it `scheduled`, skipping `upcoming`.
   *
   * scoreDay() counts `open` because the day view is a workbench, where "0 of 4" means
   * four things left to do. This is a review, and a review reports verdicts. Same
   * habits, different question.
   */
  scored: number;
};

/** The row a WEEKLY habit gets: one verdict, because the week is the unit. */
export type HabitWeeklyRow = {
  habit: Habit;
  /** Logged across the whole Mon–Sun. */
  progress: number;
  target: number | null;
  /** `null` = it didn't live the whole week, so the week has no verdict. */
  status: HabitStatus | null;
  /** The days inside the week holding a log, ascending — for the band's tooltip. */
  loggedOn: string[];
};

export type HabitWeek = { daily: HabitDailyRow[]; weekly: HabitWeeklyRow[] };

/**
 * A week of habits, split along the only cadence axis there is.
 *
 * Daily and weekly habits are not two flavours of one row and must not be drawn as one.
 * Seven cells is a claim about seven days; a weekly habit makes ONE claim about all
 * seven. scoreDay() already refuses to pool them — this refuses to grid them.
 *
 * `dates` must be a whole Mon–Sun, ascending: the week is read off its ends. Hand it a
 * slice and a weekly habit is judged on a fraction of its week and under-counts, which
 * renders as a miss you didn't earn. The fix for a ragged range is never to slice the
 * week, it's to pass the week.
 *
 * Rows come back in input order. The query already sorts by the order you chose, and a
 * grid that reshuffles itself week to week is a grid you stop reading.
 */
export function habitsForWeek(
  habits: Habit[],
  entries: HabitEntry[],
  dates: string[],
  today: string,
): HabitWeek {
  const week: Week = { start: dates[0], end: dates[dates.length - 1] };
  const idx = indexByHabit(entries);
  const out: HabitWeek = { daily: [], weekly: [] };

  for (const habit of habits) {
    const mine = idx.get(habit.id) ?? NO_ENTRIES;

    if (habit.period === "week") {
      const inWeek = entriesInWeek(mine.all, week);
      const target = weekTarget(inWeek, habit, week.start);
      const progress = inWeek.reduce((sum, e) => sum + e.value, 0);
      out.weekly.push({
        habit,
        progress,
        target,
        status: isLiveAllWeek(habit, week)
          ? statusOf(habit.period, progress, target, week.start, today, week.end)
          : null,
        loggedOn: inWeek.map((e) => e.occurred_on).sort(),
      });
      continue;
    }

    const cells: HabitCell[] = dates.map((date) => {
      const onDay = mine.byDay.get(date) ?? null;
      // Not alive, or an off weekday — either way no verdict, and the grid renders both as
      // recessed ground (nothing was promised here).
      if (!isLive(habit, date) || !scheduledOn(habit, date))
        return { date, status: null, value: null };
      const target = dayTarget(onDay, habit, date);
      return {
        date,
        status: statusOf(habit.period, onDay?.value ?? 0, target, date, today, week.end),
        value: onDay?.value ?? null,
      };
    });

    let kept = 0;
    let scored = 0;
    for (const c of cells) {
      if (c.status !== "kept" && c.status !== "missed") continue;
      scored++;
      if (c.status === "kept") kept++;
    }
    out.daily.push({ habit, cells, kept, scored });
  }

  // A habit that wasn't alive for a single day of the week has nothing to say about it.
  out.daily = out.daily.filter((r) => r.cells.some((c) => c.status !== null));
  out.weekly = out.weekly.filter((r) => overlapsLife(r.habit, week.start, week.end));
  return out;
}

/**
 * One habit's range, rolled up.
 *
 * The mirror of RecurringBlock, and deliberately not that type. A recurring block is
 * reconstructed from your calendar; a habit is declared. Two things, two words —
 * lib/activity/metrics.ts makes the same point from the other side.
 */
export type HabitRollup = {
  habit: Habit;
  /**
   * Periods that got a verdict: days for a daily habit, Mon–Sun weeks for a weekly one.
   * `open` periods, `untracked` ones and periods outside the habit's life are all out,
   * so this denominator counts only time you actually lived under a goal.
   *
   * A daily habit's 31 and a weekly habit's 4 are the same KIND of number and nothing
   * like the same size of one, which is why the row has to name the unit: "3 of 4" and
   * "23 of 31" must not get read on one scale.
   */
  judged: number;
  kept: number;
  /** kept ÷ judged, 0–1. `null` when nothing was judged — rendered "—", never 0%. */
  ratio: number | null;
  /**
   * Consecutive kept periods, counting back from the most recent JUDGED one.
   *
   * Counted inside this range only, exactly like recurringBlocksOverRange: a run that
   * started before the range reads short. That's the safe direction — a number that
   * understates your streak has never talked anyone out of it.
   */
  streak: number;
};

/**
 * Roll a range up into one row per habit, worst first.
 *
 * `dates` are the days a DAILY habit is judged on; `weeks` are the Mon–Sun weeks a
 * WEEKLY one is judged on. Two lists and not one because they don't line up: a month's
 * days stop on the 31st and the week the 31st sits in does not. Callers derive both —
 * see lib/time's weeksOfMonth — so this module keeps its type-only imports and no
 * calendar of its own.
 *
 * `entries` must cover every date in `dates` AND every day of every week in `weeks`,
 * which is wider than the month. Come up short and a weekly habit at the edge silently
 * under-counts.
 */
export function habitsOverRange(
  habits: Habit[],
  entries: HabitEntry[],
  dates: string[],
  weeks: Week[],
  today: string,
): HabitRollup[] {
  const idx = indexByHabit(entries);
  const rows: HabitRollup[] = [];

  for (const habit of habits) {
    const mine = idx.get(habit.id) ?? NO_ENTRIES;
    // Settled outcomes in ascending order — the streak is read off the tail, exactly as
    // recurringBlocksOverRange does it.
    const outcomes: boolean[] = [];

    if (habit.period === "week") {
      for (const week of weeks) {
        if (!isLiveAllWeek(habit, week)) continue;
        const inWeek = entriesInWeek(mine.all, week);
        const target = weekTarget(inWeek, habit, week.start);
        const progress = inWeek.reduce((sum, e) => sum + e.value, 0);
        const status = statusOf(habit.period, progress, target, week.start, today, week.end);
        if (status === "kept" || status === "missed") outcomes.push(status === "kept");
      }
    } else {
      for (const date of dates) {
        // Off weekdays are not on the schedule, so they're out of the denominator: a
        // Mon/Wed/Fri habit reads "10 of 13 days", not "10 of 30".
        if (!isLive(habit, date) || !scheduledOn(habit, date)) continue;
        const onDay = mine.byDay.get(date) ?? null;
        const target = dayTarget(onDay, habit, date);
        const status = statusOf(
          habit.period,
          onDay?.value ?? 0,
          target,
          date,
          today,
          date, // a daily habit settles on its own day; weekEnd is unused for period "day"
        );
        if (status === "kept" || status === "missed") outcomes.push(status === "kept");
      }
    }

    // Never alive in the range, or alive but never judged in it — either way there's no
    // row to draw. Callers need no archived-habit filter of their own.
    const alive =
      habit.period === "week"
        ? weeks.some((w) => overlapsLife(habit, w.start, w.end))
        : dates.some((d) => isLive(habit, d));
    if (!alive) continue;

    let streak = 0;
    for (let i = outcomes.length - 1; i >= 0 && outcomes[i]; i--) streak++;

    const judged = outcomes.length;
    const kept = outcomes.filter(Boolean).length;
    rows.push({ habit, judged, kept, ratio: judged ? kept / judged : null, streak });
  }

  // Worst first — the habit you keep dropping is the one you need to see. A habit with
  // nothing to judge sorts to the bottom rather than heading a table it was never scored
  // in: no verdict is not the same as the worst verdict, and putting it on top would be
  // an accusation made by position.
  return rows.sort((x, y) => {
    if (x.ratio === null) return y.ratio === null ? 0 : 1;
    if (y.ratio === null) return -1;
    return x.ratio - y.ratio || y.judged - x.judged;
  });
}
