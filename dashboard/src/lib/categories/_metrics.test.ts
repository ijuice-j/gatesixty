// The category rules that are easy to get subtly, cruelly wrong.
//   node --experimental-strip-types _metrics.test.ts
import { categoriesOverRange, UNCATEGORIZED } from "./metrics.ts";
import type { EventCategory } from "./types.ts";
import type { DayItem } from "../activity/day.ts";

const MON = "2026-07-13";
const TUE = "2026-07-14";

const READING: EventCategory = { id: "c1", colorId: "2", name: "Reading" };
const STARTUP: EventCategory = { id: "c2", colorId: "6", name: "LastSeenPlaying" };

let seq = 0;
/** A settled block of `min` minutes on `date`, coloured `colorId`. */
const block = (
  min: number,
  colorId: string | null,
  status: DayItem["status"] = "done",
  date = MON,
): DayItem => {
  const start = `${date}T09:00:00+00:00`;
  const end = new Date(Date.parse(start) + min * 60000).toISOString();
  return {
    id: `e${++seq}`,
    title: `block ${seq}`,
    start,
    end,
    color: "#000000",
    colorId,
    status,
  };
};

const day = (date: string, items: DayItem[]) => ({ date, items });

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

const byKey = <T extends { key: string }>(rows: T[], key: string): T | undefined =>
  rows.find((r) => r.key === key);

console.log("\ncategories — a colour is a category, an uncoloured block is not");

await test("blocks group by colour, and hours are duration-weighted", () => {
  const rows = categoriesOverRange(
    [day(MON, [block(180, "2"), block(30, "6"), block(60, "2")])],
    [READING, STARTUP],
  );
  eq(byKey(rows, "2")?.ft.plannedMin, 240, "two Reading blocks pooled");
  eq(byKey(rows, "6")?.ft.plannedMin, 30, "one Startup block");
});

await test("a title says nothing — two unrelated names share one colour", () => {
  // The whole point: "Alchemist" and "Great Expectations" carry no shared token.
  const alchemist = { ...block(60, "2"), title: "Alchemist" };
  const expectations = { ...block(60, "2"), title: "Great Expectations" };
  const rows = categoriesOverRange([day(MON, [alchemist, expectations])], [READING]);
  eq(rows.length, 1, "one category, not two rows keyed by title");
  eq(rows[0].ft.plannedMin, 120, "both books are Reading");
});

await test("an uncoloured block lands in Uncategorised, not in a category", () => {
  const rows = categoriesOverRange([day(MON, [block(60, null), block(60, "2")])], [READING]);
  eq(byKey(rows, "2")?.ft.plannedMin, 60, "Reading keeps only its own");
  eq(byKey(rows, UNCATEGORIZED)?.ft.plannedMin, 60, "the uncoloured hour is still counted");
});

await test("a colour you never named is Uncategorised, not a phantom bucket", () => {
  // Naming ten of eleven colours must not leave the eleventh as a row labelled by a
  // hex nobody chose. (Reading is still here at zero — that's the rule below.)
  const rows = categoriesOverRange([day(MON, [block(90, "11")])], [READING]);
  eq(byKey(rows, "11"), undefined, "no row keyed by the unnamed colour");
  eq(byKey(rows, UNCATEGORIZED)?.ft.plannedMin, 90, "its hour fell through to uncategorised");
});

await test("upcoming blocks are excluded — the rollup reconciles with follow-through", () => {
  // followThrough refuses to judge a block that hasn't ended. If this counted them, the
  // category hours would total MORE than the header on the same screen.
  const rows = categoriesOverRange(
    [day(MON, [block(60, "2"), block(120, "2", "upcoming")])],
    [READING],
  );
  eq(rows[0].ft.plannedMin, 60, "only the settled hour is planned-and-judged");
});

await test("kept over planned is per category, not shared", () => {
  const rows = categoriesOverRange(
    [
      day(MON, [block(60, "2"), block(60, "2", "not_done")]),
      day(TUE, [block(120, "6")]),
    ],
    [READING, STARTUP],
  );
  eq(byKey(rows, "2")?.ft.ratio, 0.5, "Reading kept half its hours");
  eq(byKey(rows, "6")?.ft.ratio, 1, "Startup kept all of its own");
});

await test("a declared category with no blocks reports zero, and is not dropped", () => {
  // "You did no Reading in July" is an answer. Dropping the row would silently turn it
  // into "you never had a Reading category".
  const rows = categoriesOverRange([day(MON, [block(60, "6")])], [READING, STARTUP]);
  eq(rows.length, 2, "both declared categories present");
  eq(byKey(rows, "2")?.ft.plannedMin, 0, "Reading reports its zero");
  eq(byKey(rows, "2")?.ft.ratio, null, "and is untracked, not 0% — nothing was planned");
});

await test("an empty Uncategorised bucket is not shown", () => {
  const rows = categoriesOverRange([day(MON, [block(60, "2")])], [READING]);
  eq(byKey(rows, UNCATEGORIZED), undefined, "nothing uncoloured, so no row");
});

await test("hours sort biggest first, and Uncategorised is pinned last", () => {
  const rows = categoriesOverRange(
    [day(MON, [block(30, "2"), block(600, null), block(120, "6")])],
    [READING, STARTUP],
  );
  eq(
    rows.map((r) => r.key),
    ["6", "2", UNCATEGORIZED],
    "the 10h uncategorised block does not head the table",
  );
});

await test("no categories declared at all — everything is one honest bucket", () => {
  const rows = categoriesOverRange([day(MON, [block(60, "2"), block(60, null)])], []);
  eq(rows.length, 1, "one row");
  eq(rows[0].key, UNCATEGORIZED, "a coloured block with no naming is still unfiled");
  eq(rows[0].ft.plannedMin, 120, "and every hour is accounted for");
});

console.log(`\n${fails.length ? "FAILED" : "PASSED"} — ${pass} passed, ${fails.length} failed\n`);
if (fails.length) process.exit(1);
