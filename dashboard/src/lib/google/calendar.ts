/**
 * Server-side Google Calendar access. The dashboard reconstructs "not done"
 * from the gap between the user's live calendar and the activity_logs ledger,
 * so it must read Calendar itself. It does that with a refresh token stored at
 * login (see auth/callback), exchanged here for short-lived access tokens.
 *
 * Uses Google's REST API via fetch — no `googleapis` dependency. The client
 * secret is required and must stay server-only (never NEXT_PUBLIC_*).
 */

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const EVENTS_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/** The stored refresh token is no longer valid (revoked or expired). The user
 *  must sign in again to re-grant Calendar access. */
export class GoogleAuthExpiredError extends Error {
  constructor() {
    super("Google access expired; reconnect required.");
    this.name = "GoogleAuthExpiredError";
  }
}

/**
 * Google couldn't be reached — DNS, TLS, a reset connection, a timeout.
 *
 * This exists because Node's fetch throws a TypeError whose message is the
 * famously useless string "fetch failed", with the real cause nested in
 * `.cause`. That string was going straight to the UI. An error must say what
 * broke and what to do about it.
 */
export class GoogleUnreachableError extends Error {
  constructor(cause?: unknown) {
    super(
      `Couldn't reach Google Calendar${detail(cause)}. ` +
        `This is a network problem, not your data — try again in a moment.`,
    );
    this.name = "GoogleUnreachableError";
    this.cause = cause;
  }
}

/** Dig the real reason out of undici's nested cause, if it left us one. */
function detail(cause: unknown): string {
  const code = (cause as { code?: string } | undefined)?.code;
  switch (code) {
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return " (DNS lookup failed)";
    case "ECONNRESET":
      return " (connection reset)";
    case "ECONNREFUSED":
      return " (connection refused)";
    case "ETIMEDOUT":
    case "UND_ERR_CONNECT_TIMEOUT":
    case "UND_ERR_HEADERS_TIMEOUT":
    case "UND_ERR_BODY_TIMEOUT":
      return " (timed out)";
    default:
      return code ? ` (${code})` : "";
  }
}

/** One Calendar event (only the fields the dashboard reads). */
export type GcalEvent = {
  id?: string;
  summary?: string;
  colorId?: string;
  status?: string;
  // Timed events carry `dateTime`; all-day events carry `date`.
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 10_000;
const ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch, with a timeout and a retry for the failures that are worth retrying.
 *
 * Retryable: a network-layer throw (Google unreachable), 429, and 5xx. Anything
 * else is a real answer from Google and retrying it just wastes time — a 401 is
 * still a 401 on the third go.
 */
async function request(url: string, init: RequestInit): Promise<Response> {
  let lastCause: unknown;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // Google is up but asked us to back off, or fell over.
      if ((res.status === 429 || res.status >= 500) && attempt < ATTEMPTS) {
        const retryAfter = Number(res.headers.get("retry-after"));
        await sleep(
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 5_000)
            : backoff(attempt),
        );
        continue;
      }
      return res;
    } catch (e) {
      // AbortSignal.timeout throws TimeoutError; undici throws TypeError("fetch failed").
      lastCause = (e as { cause?: unknown })?.cause ?? e;
      if (attempt === ATTEMPTS) break;
      await sleep(backoff(attempt));
    }
  }

  throw new GoogleUnreachableError(lastCause);
}

/** 300ms, 900ms — with jitter, so a flapping network doesn't get a thundering herd. */
function backoff(attempt: number): number {
  return 300 * 3 ** (attempt - 1) + Math.random() * 200;
}

// ---------------------------------------------------------------------------
// Access tokens
// ---------------------------------------------------------------------------

/**
 * Access tokens live an hour, and every page render needs one. Exchanging the
 * refresh token on each render doubled the number of round-trips to Google —
 * and so doubled the chance of a "couldn't reach Google" on any given load, for
 * a token we already had. Cache it in-process until shortly before it expires.
 *
 * Per-instance and lost on restart, which is fine: the worst case is one extra
 * exchange, exactly what we do today.
 */
const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const EXPIRY_MARGIN_MS = 60_000; // refresh a minute early rather than race the clock

async function getAccessToken(refreshToken: string): Promise<string> {
  const cached = tokenCache.get(refreshToken);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set; cannot read Calendar.",
    );
  }

  const res = await request(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    // invalid_grant (400) / unauthorized (401) => access was revoked.
    if (res.status === 400 || res.status === 401) {
      tokenCache.delete(refreshToken);
      throw new GoogleAuthExpiredError();
    }
    throw new Error(`Google token exchange failed (${res.status}).`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new Error("Google token exchange returned no access token.");
  }

  const ttl = (json.expires_in ?? 3600) * 1000;
  tokenCache.set(refreshToken, {
    token: json.access_token,
    expiresAt: Date.now() + Math.max(ttl - EXPIRY_MARGIN_MS, 0),
  });
  return json.access_token;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const PAGE_SIZE = 250;
const MAX_PAGES = 12; // 3000 events — a backstop, not a real ceiling

/**
 * List events on the primary calendar in [timeMin, timeMax). Recurring events
 * are expanded to single instances so each maps to one ledger occurrence.
 *
 * PAGINATED, and that matters: the month view asks for two months at a time, and
 * at a handful of blocks a day that comfortably exceeds one 250-event page. A
 * single un-paginated call would silently return the first 250 and compute your
 * follow-through against partial data — a wrong number with no error, which is
 * worse than a failed load.
 */
export async function listCalendarEvents(
  refreshToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GcalEvent[]> {
  const accessToken = await getAccessToken(refreshToken);
  const events: GcalEvent[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: String(PAGE_SIZE),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await request(`${EVENTS_ENDPOINT}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        tokenCache.delete(refreshToken); // the cached token is no good
        throw new GoogleAuthExpiredError();
      }
      throw new Error(`Google Calendar request failed (${res.status}).`);
    }

    const json = (await res.json()) as {
      items?: GcalEvent[];
      nextPageToken?: string;
    };
    if (json.items?.length) events.push(...json.items);

    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return events;
}

/** Fallback accent when an event has no `colorId`. Matches the mobile app. */
export const DEFAULT_EVENT_COLOR = "#7B81C9";

/** Google Calendar's standard event palette (colorId "1".."11"), mirrored from
 *  the mobile app so a reconstructed event keeps the colour it shows on device. */
const GOOGLE_EVENT_COLORS: Record<string, string> = {
  "1": "#7986CB", // Lavender
  "2": "#33B679", // Sage
  "3": "#8E24AA", // Grape
  "4": "#E67C73", // Flamingo
  "5": "#F6BF26", // Banana
  "6": "#F4511E", // Tangerine
  "7": "#039BE5", // Peacock
  "8": "#616161", // Graphite
  "9": "#3F51B5", // Blueberry
  "10": "#0B8043", // Basil
  "11": "#D50000", // Tomato
};

export function eventColor(colorId?: string): string {
  return (colorId && GOOGLE_EVENT_COLORS[colorId]) || DEFAULT_EVENT_COLOR;
}
