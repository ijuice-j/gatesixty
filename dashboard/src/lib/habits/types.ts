/** A measured amount ("45 reps") vs. did-you-or-not ("drink 8L: yes"). */
export type HabitKind = "count" | "check";

/** The unit of judgment. A 3x/week habit has not been missed on Monday. */
export type HabitPeriod = "day" | "week";

/**
 * One row of the Supabase `habits` table — the plan you declared.
 *
 * This is the piece Google supplies for a calendar block and you supply for a habit.
 * `activity_logs` can reconstruct "not done" because the calendar says what was
 * planned; nothing outside this table says a habit was ever meant to happen.
 */
export type Habit = {
  id: string;
  name: string;
  kind: HabitKind;
  /** Cosmetic, count-only — "reps", "L", "pages". */
  unit: string | null;
  /** `null` = tracked but never scored. See HabitStatus.untracked. */
  target: number | null;
  /**
   * The viewer-local day the current `target` took effect; `null` exactly when there's no
   * target. A no-entry day before this was lived under no goal and earns no verdict — it
   * is what stops a goal you set today from reaching back and failing days that never had
   * one. `target_snapshot` does this for logged days; this does it for the unlogged ones.
   */
  target_effective_since: string | null;
  period: HabitPeriod;
  color: string; // #RRGGBB
  sort_order: number;
  /** The day you declared it, viewer-local. Nothing before it is asked about. */
  created_on: string;
  /**
   * The day you archived it, viewer-local; `null` while it's live.
   *
   * A habit is live over `[created_on, archived_on)` — half-open, the same shape as
   * zonedDayRange and every `.gte(x).lt(y)` in the app. The exclusive end means archiving
   * stops the asking the moment you click it: a habit archived this morning is off today's
   * list rather than sitting there waiting to hand you a miss at midnight.
   *
   * Be honest about the cost — it cuts both ways. Log your pushups at 9am and archive at
   * 3pm and the day drops the habit, the 50 you logged, and the `kept` you earned for it.
   * That is the behaviour the old `.is("archived_at", null)` query filter had too, so
   * nothing regressed here; it's the price of the archive day belonging to neither side.
   * The alternative — an inclusive end — hands a miss to anyone who quits on a bad day,
   * which is worse and far more common than losing one morning's credit.
   */
  archived_on: string | null;
};

/**
 * One row of `habit_entries` — what you logged.
 *
 * No row for a settled day is what "missed" means, exactly as in the `activity_logs`
 * done-only ledger. A logged `0` is a different fact from no row at all.
 */
export type HabitEntry = {
  habit_id: string;
  occurred_on: string; // YYYY-MM-DD, viewer-local
  value: number;
  /** The target this was judged against, frozen at write time. */
  target_snapshot: number | null;
};
