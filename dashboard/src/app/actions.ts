"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  invalidateCalendarCache,
  listCalendarEventsForMonths,
  GoogleAuthExpiredError,
} from "@/lib/google/calendar";
import { monthBounds } from "@/lib/activity/range";
import { dateStringInTz, resolveViewerTimeZone } from "@/lib/time";

export type RefreshResult =
  | { ok: true; fetchedAt: number }
  | { ok: false; message: string; reconnect?: boolean };

/**
 * Fetch fresh — drop this user's cached calendar months and go back to Google now.
 *
 * The calendar is cached for five minutes (see lib/google/calendar.ts) because re-fetching
 * it on every navigation was what made the app slow. That's safe precisely because this
 * exists: add a block in Google, hit this, see it. A cache without a way to bust it is a
 * bug waiting to be reported as "the app is showing stale data".
 *
 * It actually FETCHES rather than only invalidating, and that's the whole reason it can
 * report anything. Invalidate-and-revalidate pushes the Google call into the page render,
 * where a dead token surfaces as a banner further down the page and the button itself has
 * already claimed success. Fetching here means the button knows what happened and can say
 * so. The fetch is not wasted work either: it refills the cache the re-render then reads.
 *
 * Returns a result instead of throwing. A thrown server action reaches the client as an
 * opaque digest with the message stripped in production — useless for telling someone
 * their Google sign-in expired.
 */
export async function refreshCalendar(date?: string): Promise<RefreshResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You're signed out. Sign in again to fetch." };

  const { data: cred } = await supabase
    .from("google_credentials")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cred?.refresh_token) {
    return {
      ok: false,
      message: "Google isn't connected, so there's nothing to fetch.",
      reconnect: true,
    };
  }

  invalidateCalendarCache(cred.refresh_token);

  const { tz } = resolveViewerTimeZone((await cookies()).get("tz")?.value);
  // The month the viewer is looking at, or today's. One month is enough to prove the
  // connection works; the rest refill on the re-render that follows.
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "")
    ? (date as string)
    : dateStringInTz(new Date(), tz);

  try {
    await listCalendarEventsForMonths(
      cred.refresh_token,
      [ref.slice(0, 7)],
      (m) => monthBounds(m, tz),
      true, // force — we just invalidated, and this is the probe
    );
  } catch (e) {
    if (e instanceof GoogleAuthExpiredError) {
      return {
        ok: false,
        message: "Your Google sign-in expired. Reconnect to fetch your calendar.",
        reconnect: true,
      };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Couldn't reach Google Calendar.",
    };
  }

  revalidatePath("/");
  revalidatePath("/week");
  revalidatePath("/month");

  return { ok: true, fetchedAt: Date.now() };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

/**
 * Backfill/edit a past event's outcome from the day view.
 *
 * The ledger stores only done rows, so toggling is insert-vs-delete on the
 * `(user_id, gcal_event_id, occurred_on)` unique key:
 *   - make_done=true  → upsert a done row, snapshotting the event as it looks
 *     now (title/window/color come from the live calendar via hidden inputs).
 *   - make_done=false → delete the row, so it reconstructs back to "not done".
 *
 * RLS scopes every write to the signed-in user; the delete needs no explicit
 * user_id filter because the policy already restricts it to owned rows.
 */
export async function toggleDone(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const gcalEventId = emptyToNull(formData.get("gcal_event_id"));
  const occurredOn = emptyToNull(formData.get("occurred_on"));
  if (!gcalEventId || !occurredOn) throw new Error("Missing event reference.");

  const makeDone = formData.get("make_done") === "true";

  if (makeDone) {
    const { error } = await supabase.from("activity_logs").upsert(
      {
        user_id: user.id,
        gcal_event_id: gcalEventId,
        occurred_on: occurredOn,
        title: emptyToNull(formData.get("title")) ?? "(busy)",
        planned_start: emptyToNull(formData.get("planned_start")),
        planned_end: emptyToNull(formData.get("planned_end")),
        color: emptyToNull(formData.get("color")),
        done: true,
      },
      { onConflict: "user_id,gcal_event_id,occurred_on" },
    );
    if (error) throw new Error(`Could not mark done: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("activity_logs")
      .delete()
      .eq("gcal_event_id", gcalEventId)
      .eq("occurred_on", occurredOn);
    if (error) throw new Error(`Could not un-mark: ${error.message}`);
  }

  // All three zoom levels reconstruct from the same ledger, so a backfill on the day
  // view moves the week grid and the month heatmap too.
  revalidatePath("/");
  revalidatePath("/week");
  revalidatePath("/month");
}
