import { cache } from "react";
import { createClient } from "./server";

/**
 * The signed-in user, once per request.
 *
 * `auth.getUser()` is a NETWORK round-trip to Supabase — it revalidates the JWT rather
 * than trusting the cookie. The layout needs the user (to render the shell and gate the
 * route) and so does every page (for `user.id`), which meant two round-trips stacked on
 * top of the one the middleware already makes.
 *
 * React's `cache()` memoises for the lifetime of a single render pass, so the layout and
 * the page it wraps now share one call. It does NOT cache across requests — each
 * navigation still revalidates, which is the point.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
