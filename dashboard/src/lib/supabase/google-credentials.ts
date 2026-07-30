import { cache } from "react";
import { createClient } from "./server";

/**
 * This user's Google refresh token, once per request.
 *
 * Same trick and same reason as `getUser`: the review LAYOUT needs it (to show how stale
 * the calendar is beside Fetch fresh) and so does every review PAGE (to actually read the
 * calendar), which stacked two identical single-row lookups on every render.
 *
 * `cache()` memoises for one render pass only — a layout and the page it wraps share the
 * call, and the next navigation reads again. It never caches across requests, so
 * reconnecting Google is visible immediately.
 *
 * Returns null when Google was never connected, which is the signal every caller already
 * branches on to show the reconnect banner.
 */
export const getGoogleRefreshToken = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_credentials")
    .select("refresh_token")
    .maybeSingle();
  return data?.refresh_token ?? null;
});
