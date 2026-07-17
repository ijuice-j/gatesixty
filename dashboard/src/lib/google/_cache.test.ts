// Does month-caching actually stop the Google calls? Drives the real module with a stubbed
// fetch and counts the round-trips.  node --experimental-strip-types _cache.test.ts
import {
  listCalendarEventsForMonths,
  invalidateCalendarCache,
} from "./calendar.ts";

process.env.GOOGLE_CLIENT_ID = "id";
process.env.GOOGLE_CLIENT_SECRET = "secret";

let events = 0;
let tokens = 0;

globalThis.fetch = (async (url: string | URL) => {
  const u = String(url);
  if (u.includes("token")) {
    tokens++;
    return new Response(JSON.stringify({ access_token: "at", expires_in: 3600 }), { status: 200 });
  }
  events++;
  const month = new URL(u).searchParams.get("timeMin")!.slice(0, 7);
  return new Response(JSON.stringify({ items: [{ id: `${month}-evt` }] }), { status: 200 });
}) as typeof fetch;

const bounds = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return { start: new Date(Date.UTC(y, mo - 1, 1)), end: new Date(Date.UTC(y, mo, 1)) };
};

let pass = 0;
const fails: string[] = [];
async function test(name: string, fn: () => Promise<void>) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fails.push(name); console.log(`  FAIL ${name}\n       ${(e as Error).message}`); }
}
const eq = (a: unknown, b: unknown, m: string) => {
  if (a !== b) throw new Error(`${m}: got ${a}, want ${b}`);
};

const TOKEN = "rt";

console.log("\ncalendar — the month cache (why date navigation got fast)");

await test("stepping through 20 days in one month costs ONE Google call", async () => {
  invalidateCalendarCache(TOKEN);
  events = 0;
  for (let d = 1; d <= 20; d++) {
    await listCalendarEventsForMonths(TOKEN, ["2026-07"], bounds);
  }
  eq(events, 1, "20 date-arrow clicks must not be 20 Google fetches");
});

await test("switching Day -> Week -> Month inside a month costs NOTHING extra", async () => {
  invalidateCalendarCache(TOKEN);
  events = 0;
  await listCalendarEventsForMonths(TOKEN, ["2026-07"], bounds);          // day
  await listCalendarEventsForMonths(TOKEN, ["2026-07"], bounds);          // week
  await listCalendarEventsForMonths(TOKEN, ["2026-06", "2026-07"], bounds); // month (+prev)
  eq(events, 2, "only the newly-needed month (June) should be fetched");
});

await test("a range spanning two months fetches each month exactly once", async () => {
  invalidateCalendarCache(TOKEN);
  events = 0;
  await listCalendarEventsForMonths(TOKEN, ["2026-06", "2026-07"], bounds);
  await listCalendarEventsForMonths(TOKEN, ["2026-06", "2026-07"], bounds);
  eq(events, 2, "two months, fetched once each, then served from cache");
});

await test("an event on a month boundary is not double-counted", async () => {
  invalidateCalendarCache(TOKEN);
  const out = await listCalendarEventsForMonths(TOKEN, ["2026-06", "2026-07"], bounds);
  const ids = out.map((e) => e.id);
  eq(new Set(ids).size, ids.length, "duplicate ids would inflate the follow-through denominator");
});

await test("Fetch fresh busts the cache and re-fetches", async () => {
  invalidateCalendarCache(TOKEN);
  events = 0;
  await listCalendarEventsForMonths(TOKEN, ["2026-07"], bounds);
  eq(events, 1, "cold");
  await listCalendarEventsForMonths(TOKEN, ["2026-07"], bounds);
  eq(events, 1, "warm — served from cache");
  invalidateCalendarCache(TOKEN);                       // <- the button
  await listCalendarEventsForMonths(TOKEN, ["2026-07"], bounds);
  eq(events, 2, "after Fetch fresh, Google is hit again");
});

await test("force=true bypasses the cache without clearing it", async () => {
  invalidateCalendarCache(TOKEN);
  events = 0;
  await listCalendarEventsForMonths(TOKEN, ["2026-07"], bounds);
  await listCalendarEventsForMonths(TOKEN, ["2026-07"], bounds, true);
  eq(events, 2, "force must re-fetch");
});

await test("one user's Fetch fresh does not clear another user's cache", async () => {
  invalidateCalendarCache("a");
  invalidateCalendarCache("b");
  events = 0;
  await listCalendarEventsForMonths("a", ["2026-07"], bounds);
  await listCalendarEventsForMonths("b", ["2026-07"], bounds);
  eq(events, 2, "two users, two fetches");
  invalidateCalendarCache("a");
  await listCalendarEventsForMonths("b", ["2026-07"], bounds);
  eq(events, 2, "b must still be cached");
});

console.log(`\n${fails.length ? "FAILED" : "PASSED"} — ${pass} passed, ${fails.length} failed\n`);
if (fails.length) process.exit(1);
