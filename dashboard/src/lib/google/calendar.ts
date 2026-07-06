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

/** Exchange the stored refresh token for a short-lived access token. */
async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set; cannot read Calendar.",
    );
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    // invalid_grant (400) / unauthorized (401) => access was revoked.
    if (res.status === 400 || res.status === 401) throw new GoogleAuthExpiredError();
    throw new Error(`Google token exchange failed (${res.status}).`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Google token exchange returned no access token.");
  }
  return json.access_token;
}

/**
 * List events on the primary calendar in [timeMin, timeMax). Recurring events
 * are expanded to single instances so each maps to one ledger occurrence.
 */
export async function listCalendarEvents(
  refreshToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GcalEvent[]> {
  const accessToken = await getAccessToken(refreshToken);

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const res = await fetch(`${EVENTS_ENDPOINT}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401) throw new GoogleAuthExpiredError();
    throw new Error(`Google Calendar request failed (${res.status}).`);
  }

  const json = (await res.json()) as { items?: GcalEvent[] };
  return json.items ?? [];
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
