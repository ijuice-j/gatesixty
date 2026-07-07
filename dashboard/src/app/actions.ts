"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath("/");
}
