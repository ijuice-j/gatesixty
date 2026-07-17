"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dateStringInTz, resolveViewerTimeZone } from "@/lib/time";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function client() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return { supabase, user };
}

/** Today in the viewer's zone. Server actions get no searchParams, so the tz cookie the
 *  pages already set is the only thing that knows what day it is for this person. */
async function viewerToday(): Promise<string> {
  const { tz } = resolveViewerTimeZone((await cookies()).get("tz")?.value);
  return dateStringInTz(new Date(), tz);
}

/** Both views reconstruct from the same rows, so any write moves both. */
function revalidateHabits() {
  revalidatePath("/");
  revalidatePath("/habits");
}

/**
 * Log a habit for a day — or clear it.
 *
 * Insert-vs-delete on `(user_id, habit_id, occurred_on)`, the same shape as toggleDone,
 * and for the same reason: the ledger holds only what happened. Clearing the field
 * DELETES the row rather than storing a 0, because "I never logged it" and "I did zero"
 * are different facts and the day reconstruction reads the difference.
 *
 * `target_snapshot` is frozen from the habit's target as it stands right now. Raise the
 * goal later and this entry is still judged against the goal it was written under.
 */
export async function logHabit(formData: FormData) {
  const { supabase, user } = await client();

  const habitId = str(formData, "habit_id");
  const occurredOn = str(formData, "occurred_on");
  if (!habitId || !DATE_RE.test(occurredOn)) throw new Error("Missing habit or date.");

  // You cannot pre-log a day you haven't lived — the same rule that keeps an unfinished
  // day from being scored. The UI hides the control; this is the door behind it.
  if (occurredOn > (await viewerToday())) {
    throw new Error("That day hasn't happened yet.");
  }

  const raw = str(formData, "value");

  if (raw === "") {
    const { error } = await supabase
      .from("habit_entries")
      .delete()
      .eq("habit_id", habitId)
      .eq("occurred_on", occurredOn);
    if (error) throw new Error(`Could not clear: ${error.message}`);
    revalidateHabits();
    return;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error("Value must be zero or more.");

  // Read the target to freeze it. RLS already scopes this to the owner, so a habit_id
  // belonging to someone else simply isn't here.
  const { data: habit } = await supabase
    .from("habits")
    .select("target")
    .eq("id", habitId)
    .maybeSingle();
  if (!habit) throw new Error("No such habit.");

  const { error } = await supabase.from("habit_entries").upsert(
    {
      user_id: user.id,
      habit_id: habitId,
      occurred_on: occurredOn,
      value,
      target_snapshot: habit.target,
    },
    { onConflict: "user_id,habit_id,occurred_on" },
  );
  if (error) throw new Error(`Could not log: ${error.message}`);

  revalidateHabits();
}

/**
 * Declare a habit.
 *
 * A check habit is normalised to `target = 1, unit = null` — "did you?" has no unit and
 * no partial credit, and the DB rejects anything else. A count habit may have no target
 * at all, which means track it and never score it.
 */
export async function createHabit(formData: FormData) {
  const { supabase, user } = await client();

  const name = str(formData, "name");
  if (!name) throw new Error("Give it a name.");

  const kind = str(formData, "kind");
  if (kind !== "count" && kind !== "check") throw new Error("Pick count or check.");

  const period = str(formData, "period") || "day";
  if (period !== "day" && period !== "week") throw new Error("Pick day or week.");

  const color = str(formData, "color");

  let target: number | null = null;
  let unit: string | null = null;

  if (kind === "check") {
    target = 1;
  } else {
    const raw = str(formData, "target");
    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Target must be more than zero.");
      target = n;
    }
    unit = str(formData, "unit") || null;
  }

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name,
    kind,
    unit,
    target,
    period,
    ...(/^#[0-9a-fA-F]{6}$/.test(color) ? { color } : {}),
  });
  if (error) throw new Error(`Could not add: ${error.message}`);

  revalidateHabits();
}

/**
 * Archive, or bring back.
 *
 * Never a delete: `habit_entries` cascades, so removing the definition would silently
 * take every value you ever logged with it. Archiving keeps the history and just stops
 * asking about it.
 */
export async function setHabitArchived(formData: FormData) {
  const { supabase } = await client();

  const habitId = str(formData, "habit_id");
  if (!habitId) throw new Error("Missing habit.");
  const archived = str(formData, "archived") === "true";

  const { error } = await supabase
    .from("habits")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", habitId);
  if (error) throw new Error(`Could not update: ${error.message}`);

  revalidateHabits();
}
