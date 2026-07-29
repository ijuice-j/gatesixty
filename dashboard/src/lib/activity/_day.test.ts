// How a colorId reaches a DayItem — the wiring categories are resolved from.
//   node --experimental-strip-types _day.test.ts
import { reconstructDay, type DayWindow } from "./day.ts";
import type { GcalEvent } from "../google/calendar.ts";
import type { ActivityLog } from "../types.ts";

// Mon 2026-07-13, UTC day.
const WINDOW: DayWindow = {
  start: new Date("2026-07-13T00:00:00Z"),
  end: new Date("2026-07-14T00:00:00Z"),
};
const START = "2026-07-13T09:00:00Z";
const END = "2026-07-13T10:00:00Z";
const AFTER = new Date("2026-07-13T23:00:00Z"); // "now" — the block has ended

const ev = (over: Partial<GcalEvent> = {}): GcalEvent => ({
  id: "e1",
  summary: "Reading",
  start: { dateTime: START },
  end: { dateTime: END },
  ...over,
});

const log = (over: Partial<ActivityLog> = {}): ActivityLog => ({
  gcal_event_id: "e1",
  title: "Reading",
  done: true,
  occurred_on: "2026-07-13",
  planned_start: START,
  planned_end: END,
  color: null,
  ended_at: END,
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

console.log("\nday — the colour id survives reconstruction");

await test("a live event carries its colorId through", () => {
  const [item] = reconstructDay([ev({ colorId: "6" })], [], AFTER, WINDOW);
  eq(item.colorId, "6", "straight off the event");
  eq(item.color, "#F4511E", "and the hex still resolves for display");
});

await test("an event with no colour has a null colorId, not a default one", () => {
  // DEFAULT_EVENT_COLOR is not one of Google's eleven, so "uncoloured" must stay
  // distinguishable from every real category rather than collapsing into one.
  const [item] = reconstructDay([ev()], [], AFTER, WINDOW);
  eq(item.colorId, null, "no colour set");
  eq(item.color, "#7B81C9", "renders with the fallback accent");
});

await test("a DONE block takes the LIVE colour, not the frozen snapshot", () => {
  // The whole retroactive-recolouring promise rests on this. The ledger froze this
  // event as Sage (#33B679); it has since been recoloured Tangerine in Google.
  const [item] = reconstructDay(
    [ev({ colorId: "6" })],
    [log({ color: "#33B679" })],
    AFTER,
    WINDOW,
  );
  eq(item.status, "done", "still a kept block");
  eq(item.colorId, "6", "recolouring reaches backwards — category follows the live event");
  // And the SWATCH follows it. Filing by the new colour while drawing the old one made
  // the row contradict itself: old dot, new category.
  eq(item.color, "#F4511E", "the hex moves with the id, not with the snapshot");
});

await test("a done block's other fields still come from the frozen snapshot", () => {
  // Only the CATEGORY reaches backwards. The verdict must not move under you.
  const [item] = reconstructDay(
    [ev({ colorId: "6", summary: "Renamed later" })],
    [log({ title: "Reading" })],
    AFTER,
    WINDOW,
  );
  eq(item.title, "Reading", "the title you marked done with is preserved");
});

await test("a ledger-only row recovers its colorId from the frozen hex", () => {
  // The event was deleted from Google. Nothing live to read, so reverse the palette.
  const [item] = reconstructDay([], [log({ color: "#0B8043" })], AFTER, WINDOW);
  eq(item.colorId, "10", "Basil, recovered from hex");
});

await test("a ledger-only row with the fallback hex is uncategorised, not Lavender", () => {
  // #7B81C9 is the "no colorId" fallback and is deliberately absent from the palette.
  // Reversing it to a real colour would invent a category the user never chose.
  const [item] = reconstructDay([], [log({ color: "#7B81C9" })], AFTER, WINDOW);
  eq(item.colorId, null, "the fallback is not a colour");
});

await test("an upcoming block carries its colorId too", () => {
  const before = new Date("2026-07-13T08:00:00Z"); // the block hasn't ended
  const [item] = reconstructDay([ev({ colorId: "2" })], [], before, WINDOW);
  eq(item.status, "upcoming", "not yet settled");
  eq(item.colorId, "2", "and still filed under its colour");
});

console.log(`\n${fails.length ? "FAILED" : "PASSED"} — ${pass} passed, ${fails.length} failed\n`);
if (fails.length) process.exit(1);
