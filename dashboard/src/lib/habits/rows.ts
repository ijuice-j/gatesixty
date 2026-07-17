import type { Habit, HabitEntry, HabitKind, HabitPeriod } from "./types";

/** The columns each view selects. Shared so the two callers can't drift apart. */
export const HABIT_COLS = "id, name, kind, unit, target, period, color, sort_order";
export const ENTRY_COLS = "habit_id, occurred_on, value, target_snapshot";

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v));
const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined ? null : num(v);

/**
 * Coerce at the boundary.
 *
 * Postgres `numeric` is arbitrary-precision, so it does NOT arrive as a JS number for
 * free — a value that won't fit a double comes back as a string. One string reaching
 * the metrics module turns `sum + e.value` into concatenation, and "11" instead of 2
 * is a bug that reads as a data problem for hours. Convert once, here, and everything
 * downstream can assume real numbers.
 */
export function toHabit(r: Record<string, unknown>): Habit {
  return {
    id: String(r.id),
    name: String(r.name),
    kind: r.kind as HabitKind,
    unit: r.unit === null || r.unit === undefined ? null : String(r.unit),
    target: numOrNull(r.target),
    period: r.period as HabitPeriod,
    color: String(r.color),
    sort_order: num(r.sort_order),
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
