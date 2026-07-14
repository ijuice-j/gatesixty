"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidateCalendarCache } from "@/lib/google/calendar";

/**
 * Fetch fresh — drop this user's cached calendar months and re-render.
 *
 * The calendar is cached for five minutes (see lib/google/calendar.ts) because re-fetching
 * it on every navigation was what made the app slow. That's safe precisely because this
 * exists: add a block in Google, hit this, see it. A cache without a way to bust it is a
 * bug waiting to be reported as "the app is showing stale data".
 */
export async function refreshCalendar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: cred } = await supabase
    .from("google_credentials")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cred?.refresh_token) invalidateCalendarCache(cred.refresh_token);

  revalidatePath("/");
  revalidatePath("/week");
  revalidatePath("/month");
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
