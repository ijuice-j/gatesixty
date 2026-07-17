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
  period: HabitPeriod;
  color: string; // #RRGGBB
  sort_order: number;
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
