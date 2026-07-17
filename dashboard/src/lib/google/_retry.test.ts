// Prove the retry/pagination actually behave. Drives the real module with a stubbed fetch.
//   node --experimental-strip-types calendar-retry.test.ts
import {
  listCalendarEvents,
  GoogleAuthExpiredError,
  GoogleUnreachableError,
} from "./calendar.ts";

process.env.GOOGLE_CLIENT_ID = "id";
process.env.GOOGLE_CLIENT_SECRET = "secret";

const T0 = new Date("2026-07-01T00:00:00Z");
const T1 = new Date("2026-09-01T00:00:00Z");

let calls: string[] = [];
const real = globalThis.fetch;

function stub(handler: (url: string, n: number) => Response | Promise<Response> | never) {
  calls = [];
  globalThis.fetch = (async (url: string | URL) => {
    const u = String(url);
    calls.push(u.includes("token") ? "token" : "events");
    return handler(u, calls.length);
  }) as typeof fetch;
}

const tokenOk = () =>
  new Response(JSON.stringify({ access_token: "at", expires_in: 3600 }), { status: 200 });
const eventsPage = (items: unknown[], nextPageToken?: string) =>
  new Response(JSON.stringify({ items, nextPageToken }), { status: 200 });

// undici's real shape: TypeError("fetch failed") with the cause nested.
// `: never` so TS knows a branch calling this doesn't fall through.
const netFail = (code: string): never => {
  const e = new TypeError("fetch failed");
  (e as { cause?: unknown }).cause = { code };
  throw e;
};

let pass = 0;
const fails: string[] = [];
async function test(name: string, fn: () => Promise<void>) {
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
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
};

console.log("\ncalendar — transport");

await test("a transient network failure is retried, then succeeds", async () => {
  let events = 0;
  stub((url) => {
    if (url.includes("token")) return tokenOk();
    events++;
    if (events === 1) netFail("ECONNRESET"); // first attempt dies
    return eventsPage([{ id: "a" }]);
  });
  const out = await listCalendarEvents("rt-1", T0, T1);
  eq(out.length, 1, "recovered after a retry");
  eq(events, 2, "should have taken exactly two attempts");
});

await test("a persistent network failure throws a HUMAN error, not 'fetch failed'", async () => {
  stub((url) => {
    if (url.includes("token")) return tokenOk();
    return netFail("UND_ERR_CONNECT_TIMEOUT");
  });
  try {
    await listCalendarEvents("rt-2", T0, T1);
    throw new Error("should have thrown");
  } catch (e) {
    if (!(e instanceof GoogleUnreachableError)) throw new Error(`wrong type: ${(e as Error).name}`);
    const m = (e as Error).message;
    if (/fetch failed/.test(m)) throw new Error("leaked undici's 'fetch failed' to the user");
    if (!/Couldn't reach Google Calendar/.test(m)) throw new Error(`unhelpful: ${m}`);
    if (!/timed out/.test(m)) throw new Error(`lost the cause: ${m}`);
  }
  // 3 attempts on events (the token succeeded and got cached)
  eq(calls.filter((c) => c === "events").length, 3, "should have tried 3 times");
});

await test("a 5xx is retried", async () => {
  let n = 0;
  stub((url) => {
    if (url.includes("token")) return tokenOk();
    n++;
    if (n < 3) return new Response("nope", { status: 503 });
    return eventsPage([{ id: "b" }]);
  });
  const out = await listCalendarEvents("rt-3", T0, T1);
  eq(out.length, 1, "recovered from 503");
  eq(n, 3, "should have retried twice");
});

await test("a 401 is NOT retried — it's a real answer", async () => {
  let n = 0;
  stub((url) => {
    if (url.includes("token")) return tokenOk();
    n++;
    return new Response("", { status: 401 });
  });
  try {
    await listCalendarEvents("rt-4", T0, T1);
    throw new Error("should have thrown");
  } catch (e) {
    if (!(e instanceof GoogleAuthExpiredError)) throw new Error(`wrong type: ${(e as Error).name}`);
  }
  eq(n, 1, "a 401 is still a 401 on the third go — must not retry");
});

console.log("\ncalendar — pagination (the silent-truncation bug)");

await test("collects EVERY page, not just the first 250", async () => {
  const page = (n: number) => Array.from({ length: 250 }, (_, i) => ({ id: `p${n}-${i}` }));
  stub((url) => {
    if (url.includes("token")) return tokenOk();
    const tok = new URL(url).searchParams.get("pageToken");
    if (!tok) return eventsPage(page(1), "t2");
    if (tok === "t2") return eventsPage(page(2), "t3");
    return eventsPage(page(3)); // no nextPageToken -> done
  });
  const out = await listCalendarEvents("rt-5", T0, T1);
  eq(out.length, 750, "two months of events must not truncate at 250");
});

console.log("\ncalendar — token cache");

await test("the access token is reused, halving the round-trips", async () => {
  stub((url) => (url.includes("token") ? tokenOk() : eventsPage([{ id: "c" }])));
  await listCalendarEvents("rt-cache", T0, T1);
  await listCalendarEvents("rt-cache", T0, T1);
  await listCalendarEvents("rt-cache", T0, T1);
  eq(calls.filter((c) => c === "token").length, 1, "should exchange the refresh token ONCE");
  eq(calls.filter((c) => c === "events").length, 3, "but still fetch events each time");
});

globalThis.fetch = real;
console.log(`\n${fails.length ? "FAILED" : "PASSED"} — ${pass} passed, ${fails.length} failed\n`);
if (fails.length) process.exit(1);
