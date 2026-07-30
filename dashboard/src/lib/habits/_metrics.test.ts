// The habit rules that are easy to get subtly, cruelly wrong.
//   node --experimental-strip-types _metrics.test.ts
import {
  habitsForDate,
  habitsForWeek,
  habitsOverRange,
  isLive,
  scoreDay,
  formatProgress,
  formatWeekdays,
  type Week,
} from "./metrics.ts";
import { weeksOfMonth } from "../time.ts";
import type { Habit, HabitEntry } from "./types.ts";

// Mon 2026-07-13 .. Sun 2026-07-19
const WEEK: Week = { start: "2026-07-13", end: "2026-07-19" };
const MON = "2026-07-13";
const WED = "2026-07-15";
const THU = "2026-07-16";
const SUN = "2026-07-19";
const NEXT_MON = "2026-07-20"; // the week has settled by here, and not one day sooner
const DATES = ["2026-07-13", "2026-07-14", WED, THU, "2026-07-17", "2026-07-18", SUN];

const habit = (over: Partial<Habit> = {}): Habit => {
  const h: Habit = {
    id: "h1",
    name: "Pushups",
    kind: "count",
    unit: "reps",
    target: 50,
    period: "day",
    color: "#6b7280",
    sort_order: 0,
    // Long dead — so every test that predates lifespan keeps asking what it asked.
    created_on: "2000-01-01",
    archived_on: null,
    active_spans: [],
    // Tracked since forever, so a no-entry day is judged exactly as it was before this
    // column existed. The untracked-then-tracked tests set it explicitly.
    target_effective_since: "2000-01-01",
    // Every day — the weekday tests set a set explicitly.
    weekdays: null,
    ...over,
  };
  // One span from created_on/archived_on unless a test declares its own — so every
  // single-interval test written before spans keeps meaning what it meant, and the
  // archive-restore tests pass a real gap.
  if (over.active_spans === undefined) {
    h.active_spans = [{ start: h.created_on, end: h.archived_on }];
  }
  return h;
};

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

console.log("\nhabits — you cannot break a promise you had not made yet");

await test("a day before the habit existed has no row at all, and is NOT missed", () => {
  const h = habit({ created_on: THU });
  eq(habitsForDate([h], [], WED, SUN, WEEK), [], "Wednesday, declared Thursday");
});

await test("the day you declare it IS judged — the row appears immediately", () => {
  eq(one(habit({ created_on: WED }), [], WED, WED).status, "open", "declared today");
});

await test("a habit archived today is gone from today, but was there yesterday", () => {
  const h = habit({ archived_on: THU });
  eq(habitsForDate([h], [], THU, THU, WEEK), [], "the day you stop is not a day you failed");
  eq(one(h, [entry({ value: 50 })], WED, THU).status, "kept", "the day before still counts");
});

await test("isLive is half-open: [created_on, archived_on)", () => {
  const h = habit({ created_on: WED, archived_on: "2026-07-17" });
  eq([MON, WED, THU, "2026-07-17"].map((d) => isLive(h, d)), [false, true, true, false], "");
});

await test("an archived habit still shows on a day it was alive for", () => {
  // The whole point of the archived decision: reviewing June shows June.
  const h = habit({ archived_on: "2026-07-17" });
  eq(one(h, [entry({ value: 50 })], WED, SUN).status, "kept", "archived later, kept then");
});

console.log("\nhabits — a weekly habit needs the whole week to be judged on it");

await test("a weekly habit declared midweek is NOT judged that week, even at 3/3", () => {
  // Both directions, because the tempting rule keeps the good news and drops the bad.
  const born = habit({ id: "g", target: 3, period: "week", unit: null, created_on: WED });
  const done = [visit("2026-07-15"), visit("2026-07-16"), visit("2026-07-17")];
  eq(one(born, done, WED, "2026-07-20").status, null, "3 of 3 in a week it did not live");
  eq(one(born, [], WED, "2026-07-20").status, null, "0 of 3 in a week it did not live");
});

await test("...but it is loggable that day, and judged from the next full week", () => {
  const born = habit({ id: "g", target: 3, period: "week", unit: null, created_on: WED });
  eq(isLive(born, WED), true, "declared Wednesday, live Wednesday");
  const next: Week = { start: "2026-07-20", end: "2026-07-26" };
  eq(habitsForDate([born], [], "2026-07-20", "2026-07-27", next)[0].status, "missed", "");
});

console.log("\nhabits — the week grid");

await test("a daily habit gets one cell per day; a weekly one gets no cells", () => {
  const w = habitsForWeek([habit(), gym], [entry({ value: 50 })], DATES, SUN);
  eq(w.daily.length, 1, "one daily row");
  eq(w.weekly.length, 1, "one weekly row");
  eq(w.daily[0].cells.length, 7, "seven cells");
  eq(w.daily[0].cells[2].status, "kept", "Wednesday's 50");
});

await test("cells before the habit existed are null — not scheduled, not missed", () => {
  // NEXT_MON, not SUN: on Sunday the week has not settled and Sunday reads `open`, which
  // is the rule working, not a bug. Judge it from the far side.
  const w = habitsForWeek([habit({ created_on: THU })], [], DATES, NEXT_MON);
  eq(w.daily[0].cells.map((c) => c.status), [null, null, null, "missed", "missed", "missed", "missed"], "");
});

await test("scored counts verdicts only — an unfinished week is not graded", () => {
  // Wednesday lunchtime: Mon+Tue settled, Wed open, Thu-Sun not yet lived.
  const w = habitsForWeek([habit()], [entry({ occurred_on: MON, value: 50 })], DATES, WED);
  eq(w.daily[0].scored, 2, "Mon kept, Tue missed — and nothing else has a verdict");
  eq(w.daily[0].kept, 1, "");
});

await test("a habit never alive in the week is dropped from the grid entirely", () => {
  eq(habitsForWeek([habit({ created_on: "2026-08-01" })], [], DATES, SUN).daily, [], "");
});

await test("a weekly habit alive only MIDweek is still part of that week's grid", () => {
  // Born Tuesday, archived Thursday: it never sees Monday or Sunday, so testing the ends
  // alone would drop it from a week it genuinely lived in.
  const g = habit({ id: "g", period: "week", target: 3, unit: null, created_on: "2026-07-14", archived_on: THU });
  eq(habitsForWeek([g], [], DATES, NEXT_MON).weekly.length, 1, "present…");
  eq(habitsForWeek([g], [], DATES, NEXT_MON).weekly[0].status, null, "…but never judged on it");
});

await test("the weekly band carries its own progress and the days it was logged", () => {
  const w = habitsForWeek([gym], [visit("2026-07-13"), visit("2026-07-17")], DATES, NEXT_MON);
  eq(w.weekly[0].progress, 2, "Mon + Fri");
  eq(w.weekly[0].status, "missed", "2 of 3, week over");
  eq(w.weekly[0].loggedOn, ["2026-07-13", "2026-07-17"], "for the band's tooltip");
});

console.log("\nhabits — the month rollup");

await test("a daily habit counts days; a weekly one counts weeks", () => {
  const weeks = weeksOfMonth("2026-07-01");
  const dates = Array.from({ length: 31 }, (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`);
  const rows = habitsOverRange([gym], [], dates, weeks, "2026-08-10");
  eq(rows[0].judged, 4, "July 2026 owns four Mondays");
  eq(rows[0].kept, 0, "");
});

await test("an untracked habit is judged on nothing and sorts last, not first", () => {
  const dates = [MON, "2026-07-14", WED];
  const rows = habitsOverRange(
    [habit({ id: "u", target: null }), habit({ id: "d" })],
    [],
    dates,
    [WEEK],
    SUN,
  );
  eq(rows.map((r) => r.habit.id), ["d", "u"], "0% sorts above 'no verdict'");
  eq(rows[1].judged, 0, "measured, never judged");
  eq(rows[1].ratio, null, "renders '—', never 0%");
});

await test("streak counts back from the most recent judged day", () => {
  const dates = [MON, "2026-07-14", WED, THU];
  const es = [MON, WED, THU].map((d) => entry({ occurred_on: d, value: 50 }));
  const rows = habitsOverRange([habit()], es, dates, [WEEK], SUN);
  eq(rows[0].streak, 2, "Wed+Thu — Tuesday broke it");
  eq(rows[0].kept, 3, "");
  eq(rows[0].judged, 4, "");
});

await test("a habit is judged only from the day it existed — a shorter denominator", () => {
  const dates = [MON, "2026-07-14", WED, THU];
  const rows = habitsOverRange([habit({ created_on: WED })], [], dates, [WEEK], SUN);
  eq(rows[0].judged, 2, "Wed and Thu only — declared on Wednesday");
});

console.log("\nhabits — a pause is not a stretch of misses");

await test("a day in the archived gap is NOT live — no false miss", () => {
  // Kept Jan–Feb, archived (injured), restored mid-July. April was a deliberate pause.
  const h = habit({
    created_on: "2026-01-01",
    active_spans: [
      { start: "2026-01-01", end: "2026-03-01" },
      { start: "2026-07-15", end: null },
    ],
  });
  eq(isLive(h, "2026-02-15"), true, "February — active");
  eq(isLive(h, "2026-04-15"), false, "April — the gap, not a miss");
  eq(isLive(h, "2026-07-20"), true, "after restore — active again");
});

await test("the month rollup judges zero days inside an archived gap", () => {
  const h = habit({
    created_on: "2026-01-01",
    active_spans: [
      { start: "2026-01-01", end: "2026-03-01" },
      { start: "2026-07-15", end: null },
    ],
  });
  const april = Array.from({ length: 30 }, (_, i) => `2026-04-${String(i + 1).padStart(2, "0")}`);
  const rows = habitsOverRange([h], [], april, [], "2026-08-01");
  eq(rows.length, 0, "not one April day was active, so there's no row to draw");
});

await test("a habit archived-then-restored still shows the days it WAS kept", () => {
  // The point of restore: the pre-pause history is still yours.
  const h = habit({
    created_on: "2026-01-01",
    active_spans: [
      { start: "2026-01-01", end: "2026-03-01" },
      { start: "2026-07-15", end: null },
    ],
  });
  const kept = one(h, [entry({ occurred_on: "2026-02-11", value: 50 })], "2026-02-11", "2026-08-01");
  eq(kept.status, "kept", "February 11 was lived and logged");
});

await test("a weekly habit archived mid-week is not judged on that split week", () => {
  const g = habit({
    id: "g", period: "week", target: 3, unit: null,
    created_on: "2026-07-06",
    active_spans: [{ start: "2026-07-06", end: "2026-07-16" }], // archived Thursday
  });
  // The Jul 13–19 week is split by the Thu archive: no single span holds it whole.
  eq(one(g, [], "2026-07-13", "2026-07-27").status, null, "the week was not wholly lived");
});

console.log("\nhabits — a target does not reach back before it existed");

await test("a no-entry day before the target took effect is UNTRACKED, not missed", () => {
  // Created untracked in July, given a goal on Aug 1. July had no goal to miss.
  const h = habit({ target: 8, created_on: "2026-07-01", target_effective_since: "2026-08-01" });
  eq(one(h, [], WED, THU).status, "untracked", "the day was lived under no goal");
});

await test("the month rollup counts ZERO judged days before the target existed", () => {
  // This is the reported bug: it used to render "0 of 31 days" and sort to the top.
  const h = habit({ target: 8, created_on: "2026-07-01", target_effective_since: "2026-08-01" });
  const july = Array.from({ length: 31 }, (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`);
  const rows = habitsOverRange([h], [], july, [WEEK], "2026-08-10");
  eq(rows[0].judged, 0, "not one July day was under a goal");
  eq(rows[0].ratio, null, "renders — , never 0 of 31");
});

await test("a habit tracked FROM creation still misses days it wasn't logged", () => {
  // The case a snapshot-only or entry-derived fix would silently break: a goal set at
  // creation and never once logged must still read as missed, not as no-data.
  const h = habit({ target: 15, created_on: MON, target_effective_since: MON });
  eq(one(h, [], WED, THU).status, "missed", "had a goal Wednesday, logged nothing");
});

await test("raising a numeric target does not un-miss earlier no-entry days", () => {
  // effective_since stays put on a goal->goal change; 0 is below the old target and new.
  const h = habit({ target: 100, target_effective_since: "2000-01-01" });
  eq(one(h, [], WED, THU).status, "missed", "0 of 100, day over");
});

await test("a weekly target does not reach into weeks before it took effect", () => {
  const g = habit({
    id: "g", period: "week", target: 3, unit: null,
    created_on: "2026-07-01", target_effective_since: "2026-08-01",
  });
  eq(one(g, [], WED, NEXT_MON).status, "untracked", "the week Jul 13–19 had no target yet");
});

console.log("\nhabits — certain weekdays: off is not missed");

// DATES is Mon..Sun, so weekday indices 0..6 map to its positions. A Mon/Wed/Fri habit
// is weekdays [0, 2, 4].
await test("a Mon/Wed/Fri habit is judged M/W/F and off the rest", () => {
  const mwf = habit({ weekdays: [0, 2, 4] });
  const w = habitsForWeek([mwf], [], DATES, NEXT_MON);
  eq(
    w.daily[0].cells.map((c) => c.status),
    ["missed", null, "missed", null, "missed", null, null],
    "scheduled+unlogged+settled = missed; the off weekdays = null, not missed",
  );
  eq(w.daily[0].scored, 3, "only the three scheduled days are judged");
  eq(w.daily[0].kept, 0, "");
});

await test("an off weekday earns no verdict even long after it settled", () => {
  const mwf = habit({ weekdays: [0, 2, 4] }); // Tuesday (index 1) is off
  eq(one(mwf, [], "2026-07-14", "2026-08-01").status, null, "Tuesday was never on the plan");
});

await test("an off-day habit stays in the day list but out of the day's score", () => {
  const mwf = habit({ id: "m", weekdays: [0, 2, 4] });
  const daily = habit({ id: "d" });
  const rows = habitsForDate(
    [mwf, daily],
    [entry({ habit_id: "d", occurred_on: "2026-07-14", value: 50 })],
    "2026-07-14", // Tuesday
    "2026-07-14",
    WEEK,
  );
  const m = rows.find((r) => r.habit.id === "m")!;
  eq(m.scheduled, false, "Tuesday is off for a M/W/F habit");
  eq(m.status, null, "so it carries no verdict");
  eq(rows.find((r) => r.habit.id === "d")!.scheduled, true, "the every-day habit is on");
  eq(scoreDay(rows), { kept: 1, scored: 1 }, "only the scheduled habit counts toward the score");
});

await test("the month denominator counts only scheduled weekdays", () => {
  const mwf = habit({ weekdays: [0, 2, 4] });
  const july = Array.from({ length: 31 }, (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`);
  const rows = habitsOverRange([mwf], [], july, [], "2026-08-10");
  eq(rows[0].judged, 14, "M/W/F in July 2026 — 4 Mondays + 5 Wednesdays + 5 Fridays");
  eq(rows[0].kept, 0, "none logged");
});

await test("weekdays null is exactly a plain daily habit", () => {
  const everyDay = habit({ weekdays: null });
  const w = habitsForWeek([everyDay], [], DATES, NEXT_MON);
  eq(w.daily[0].scored, 7, "every one of the seven days is judged");
});

await test("formatWeekdays lists the days Mon-first", () => {
  eq(formatWeekdays([4, 0, 2]), "Mon Wed Fri", "sorted into week order");
});

console.log("\ntime — a week belongs to the month its Monday falls in");

await test("July 2026 owns four weeks, starting Jul 6", () => {
  const w = weeksOfMonth("2026-07-01");
  eq(w.length, 4, "");
  eq(w[0], { start: "2026-07-06", end: "2026-07-12" }, "the Jun 29 week is June's");
  eq(w[3], { start: "2026-07-27", end: "2026-08-02" }, "the last week spills, end and all");
});

await test("June and July partition exactly — no week judged twice, none unjudged", () => {
  const jun = weeksOfMonth("2026-06-01");
  const jul = weeksOfMonth("2026-07-01");
  eq(jun.length, 5, "");
  eq(jun[4], { start: "2026-06-29", end: "2026-07-05" }, "June's last week owns Jul 1-5");
  eq(jul[0].start, "2026-07-06", "and July picks up the very next day");
});

await test("every month has at least four weeks", () => {
  const short = weeksOfMonth("2027-02-01");
  eq(short.length >= 4, true, "the shortest month there is still holds four Mondays");
});

console.log(`\n${fails.length ? "FAILED" : "PASSED"} — ${pass} passed, ${fails.length} failed\n`);
if (fails.length) process.exit(1);
