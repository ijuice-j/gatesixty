// The habit rules that are easy to get subtly, cruelly wrong.
//   node --experimental-strip-types _metrics.test.ts
import { habitsForDate, scoreDay, formatProgress, type Week } from "./metrics.ts";
import type { Habit, HabitEntry } from "./types.ts";

// Mon 2026-07-13 .. Sun 2026-07-19
const WEEK: Week = { start: "2026-07-13", end: "2026-07-19" };
const WED = "2026-07-15";
const THU = "2026-07-16";

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: "h1",
  name: "Pushups",
  kind: "count",
  unit: "reps",
  target: 50,
  period: "day",
  color: "#6b7280",
  sort_order: 0,
  ...over,
});

const entry = (over: Partial<HabitEntry> = {}): HabitEntry => ({
  habit_id: "h1",
  occurred_on: WED,
  value: 50,
  target_snapshot: 50,
  ...over,
});

let pass = 0;
const fails: string[] = [];
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    pass++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    fails.push(name);
    console.log(`  FAIL ${name}\n       ${(e as Error).message}`);
  }
}
const eq = (a: unknown, b: unknown, m: string) => {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
};

const one = (h: Habit, es: HabitEntry[], date: string, today: string) =>
  habitsForDate([h], es, date, today, WEEK)[0];

console.log("\nhabits — you have not missed a day you are still living");

await test("an unlogged habit is OPEN today, not missed", () => {
  eq(one(habit(), [], WED, WED).status, "open", "today with nothing logged");
});

await test("the same unlogged habit IS missed once the day has passed", () => {
  eq(one(habit(), [], WED, THU).status, "missed", "yesterday, still nothing logged");
});

await test("short of target today is OPEN — there's still time", () => {
  eq(one(habit(), [entry({ value: 20 })], WED, WED).status, "open", "20 of 50 today");
});

await test("short of target yesterday is MISSED", () => {
  eq(one(habit(), [entry({ value: 20 })], WED, THU).status, "missed", "20 of 50, day over");
});

await test("hitting the target is KEPT immediately, without waiting for midnight", () => {
  eq(one(habit(), [entry({ value: 50 })], WED, WED).status, "kept", "50 of 50 today");
});

await test("overshooting still counts as kept", () => {
  eq(one(habit(), [entry({ value: 120 })], WED, WED).status, "kept", "120 of 50");
});

console.log("\nhabits — a habit with no target is measured, never judged");

await test("no target is UNTRACKED even long after the day ended", () => {
  const h = habit({ target: null });
  const e = entry({ value: 12, target_snapshot: null });
  eq(one(h, [e], WED, THU).status, "untracked", "logged 12, no goal");
});

await test("no target and nothing logged is still UNTRACKED, never missed", () => {
  eq(one(habit({ target: null }), [], WED, THU).status, "untracked", "no goal, no log");
});

await test("an untracked habit is left out of the day score entirely", () => {
  const rows = habitsForDate(
    [habit({ id: "a" }), habit({ id: "b", target: null })],
    [entry({ habit_id: "a", value: 50 })],
    WED,
    WED,
    WEEK,
  );
  eq(scoreDay(rows), { kept: 1, scored: 1 }, "the untracked one is not the denominator");
});

console.log("\nhabits — raising a goal must not rewrite history");

await test("an old entry is judged against its FROZEN target, not today's", () => {
  // Logged 50 when the goal was 50. The goal is now 100.
  const h = habit({ target: 100 });
  const e = entry({ value: 50, target_snapshot: 50 });
  eq(one(h, [e], WED, THU).status, "kept", "yesterday's success must stay a success");
});

await test("lowering the goal does not retroactively rescue a miss", () => {
  // Logged 20 when the goal was 50. The goal is now 10.
  const h = habit({ target: 10 });
  const e = entry({ value: 20, target_snapshot: 50 });
  eq(one(h, [e], WED, THU).status, "missed", "it was a miss then; it stays a miss");
});

await test("a day with NO entry falls back to the current target", () => {
  // Nothing to freeze against, so the live goal is all there is.
  eq(one(habit({ target: 50 }), [], WED, THU).status, "missed", "no entry, day over");
});

await test("a null snapshot stays untracked even after a target is added later", () => {
  const h = habit({ target: 50 }); // tracked NOW
  const e = entry({ value: 3, target_snapshot: null }); // untracked THEN
  eq(one(h, [e], WED, THU).status, "untracked", "must not judge it against a later goal");
});

console.log("\nhabits — a 3x/week habit has not been missed on Monday");

const gym = habit({ id: "g", name: "Gym", kind: "count", unit: null, target: 3, period: "week" });
const visit = (on: string) => entry({ habit_id: "g", occurred_on: on, value: 1, target_snapshot: 3 });

await test("1 of 3 midweek is OPEN, not missed", () => {
  eq(one(gym, [visit("2026-07-13")], WED, WED).status, "open", "Monday done, Wednesday now");
});

await test("the week's total accumulates across days", () => {
  const r = one(gym, [visit("2026-07-13"), visit("2026-07-15")], WED, WED);
  eq(r.progress, 2, "Mon + Wed");
  eq(r.status, "open", "2 of 3, week still running");
});

await test("hitting 3 anywhere in the week is KEPT", () => {
  const es = [visit("2026-07-13"), visit("2026-07-15"), visit("2026-07-17")];
  eq(one(gym, es, WED, WED).status, "kept", "Mon/Wed/Fri");
});

await test("a weekly habit is only missed once the WEEK is over", () => {
  const nextMon = "2026-07-20";
  eq(one(gym, [visit("2026-07-13")], WED, WED).status, "open", "during the week");
  eq(one(gym, [visit("2026-07-13")], WED, nextMon).status, "missed", "week over at 1 of 3");
});

await test("Friday's log is visible from Monday's row — the week is the unit", () => {
  const es = [visit("2026-07-17")]; // Friday
  const mon = one(gym, es, "2026-07-13", "2026-07-20");
  eq(mon.progress, 1, "Monday's row must see Friday");
  eq(mon.value, null, "but nothing was logged ON Monday");
});

await test("a satisfied weekly habit does not pad the daily score", () => {
  const rows = habitsForDate(
    [habit({ id: "a" }), gym],
    [entry({ habit_id: "a", value: 50 }), visit("2026-07-13"), visit("2026-07-14"), visit("2026-07-15")],
    WED,
    WED,
    WEEK,
  );
  eq(scoreDay(rows), { kept: 1, scored: 1 }, "gym is 3/3 but is not a thing kept TODAY");
});

console.log("\nhabits — logged zero is not the same fact as never logged");

await test("value stays null when nothing was logged", () => {
  eq(one(habit(), [], WED, WED).value, null, "no entry");
});

await test("a logged 0 reads as 0, not as absence", () => {
  eq(one(habit(), [entry({ value: 0 })], WED, WED).value, 0, "explicitly logged zero");
});

console.log("\nhabits — formatting");

await test("progress renders against the target with its unit", () => {
  eq(formatProgress(one(habit(), [entry({ value: 45 })], WED, WED)), "45 / 50 reps", "count");
});

await test("an untracked habit shows the number and no goal", () => {
  const h = habit({ target: null });
  const e = entry({ value: 12, target_snapshot: null });
  eq(formatProgress(one(h, [e], WED, WED)), "12 reps", "no ' / ' when nothing to hit");
});

await test("a unitless weekly habit omits the unit", () => {
  eq(formatProgress(one(gym, [visit("2026-07-13")], WED, WED)), "1 / 3", "no trailing space");
});

await test("whole numbers don't grow decimals", () => {
  eq(formatProgress(one(habit({ unit: "L" }), [entry({ value: 8, target_snapshot: 8 })], WED, WED)), "8 / 8 L", "8 not 8.00");
});

console.log(`\n${fails.length ? "FAILED" : "PASSED"} — ${pass} passed, ${fails.length} failed\n`);
if (fails.length) process.exit(1);
