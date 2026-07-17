import { dateStringInTz } from "@/lib/time";
import type { Habit, HabitEntry, HabitKind, HabitPeriod } from "./types";

/** The columns each view selects. Shared so the two callers can't drift apart. */
export const HABIT_COLS =
  "id, name, kind, unit, target, period, color, sort_order, created_at, archived_at, target_effective_since";
export const ENTRY_COLS = "habit_id, occurred_on, value, target_snapshot";

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v));
const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined ? null : num(v);

/** An instant → the viewer's calendar day. See the note in toHabit. */
const dayOrNull = (v: unknown, tz: string): string | null =>
  v === null || v === undefined ? null : dateStringInTz(new Date(String(v)), tz);

/**
 * Coerce at the boundary.
 *
 * Postgres `numeric` is arbitrary-precision, so it does NOT arrive as a JS number for
 * free — a value that won't fit a double comes back as a string. One string reaching
 * the metrics module turns `sum + e.value` into concatenation, and "11" instead of 2
 * is a bug that reads as a data problem for hours. Convert once, here, and everything
 * downstream can assume real numbers.
 *
 * The same trick a second time, for time. `created_at` and `archived_at` are
 * timestamptz — instants — while every date this app judges is a viewer-local calendar
 * day, which is what `occurred_on` already is. They are not the same fact, and slicing
 * the first ten characters off the instant is the bug: a habit declared at 9am on the
 * 17th in Auckland was created at 21:00Z on the 16th, so the slice hands back a day the
 * habit did not exist and the grid paints it a miss. `::date` in Postgres has the same
 * bug from the same direction — the database is UTC and the viewer is not.
 *
 * Spending the timezone here is what lets lib/habits/metrics.ts compare a habit's life
 * against an entry's date with a string compare, and keep no clock and no timezone of
 * its own. `tz` is required rather than defaulted: a lifespan wrong by one day quietly
 * paints a miss you didn't earn, and a default is how you ship one.
 */
export function toHabit(r: Record<string, unknown>, tz: string): Habit {
  return {
    id: String(r.id),
    name: String(r.name),
    kind: r.kind as HabitKind,
    unit: r.unit === null || r.unit === undefined ? null : String(r.unit),
    target: numOrNull(r.target),
    period: r.period as HabitPeriod,
    color: String(r.color),
    sort_order: num(r.sort_order),
    created_on: dateStringInTz(new Date(String(r.created_at)), tz),
    archived_on: dayOrNull(r.archived_at, tz),
    // Already a `date`, viewer-local by construction (the app writes the viewer's own day),
    // so unlike the timestamptz pair above it needs no zone spent on it — just like
    // occurred_on.
    target_effective_since:
      r.target_effective_since === null || r.target_effective_since === undefined
        ? null
        : String(r.target_effective_since),
  };
}

export function toEntry(r: Record<string, unknown>): HabitEntry {
  return {
    habit_id: String(r.habit_id),
    occurred_on: String(r.occurred_on),
    value: num(r.value),
    target_snapshot: numOrNull(r.target_snapshot),
  };
}
