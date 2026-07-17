"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dateStringInTz, resolveViewerTimeZone, weekStartDate } from "@/lib/time";
import type { HabitSpan } from "@/lib/habits/types";

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

  // "3,0,2" → [0,2,3]. A weekly quota schedules by the week, so weekdays belong only to a
  // daily habit; the DB CHECK enforces the same. Empty → null = every day.
  const rawDays = str(formData, "weekdays");
  let weekdays: number[] | null = null;
  if (rawDays) {
    if (period !== "day") throw new Error("Weekdays only apply to a daily habit.");
    const parsed = [...new Set(rawDays.split(",").map((s) => Number(s.trim())))];
    if (parsed.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      throw new Error("That isn't a valid set of weekdays.");
    }
    weekdays = parsed.sort((a, b) => a - b);
  }

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

  const today = await viewerToday();

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name,
    kind,
    unit,
    target,
    // The day this target took effect — today, if it has one. Null stays null: an
    // untracked habit has no goal to date from. See lib/habits/metrics dayTarget.
    target_effective_since: target === null ? null : today,
    // The first active span, open from today. The DB trigger would fill this from
    // created_at if omitted, but writing it here keeps it viewer-local rather than UTC.
    active_spans: [{ start: today, end: null }] satisfies HabitSpan[],
    period,
    weekdays,
    ...(/^#[0-9a-fA-F]{6}$/.test(color) ? { color } : {}),
  });
  if (error) throw new Error(`Could not add: ${error.message}`);

  revalidateHabits();
}

/**
 * Edit a habit's name, goal, unit or colour.
 *
 * `kind` and `period` are NOT editable, and the form doesn't offer them. They decide what
 * an entry MEANS — flip 'count' to 'check' and every logged 45 silently becomes "done"
 * forty-five times over; flip 'day' to 'week' and days that were each judged on their own
 * are retroactively pooled. Archive and add a new one instead; the old history stays
 * readable under the terms it was recorded.
 */
export async function updateHabit(formData: FormData) {
  const { supabase } = await client();

  const habitId = str(formData, "habit_id");
  if (!habitId) throw new Error("Missing habit.");

  const name = str(formData, "name");
  if (!name) throw new Error("Give it a name.");

  // kind and period come from the row, never the form — see above. `target` comes too, to
  // catch the untracked<->tracked transition that moves target_effective_since.
  const { data: current } = await supabase
    .from("habits")
    .select("kind, period, target")
    .eq("id", habitId)
    .maybeSingle();
  if (!current) throw new Error("No such habit.");

  const color = str(formData, "color");

  let target: number | null = null;
  let unit: string | null = null;

  if (current.kind === "check") {
    target = 1; // "did you?" has exactly one target, and the DB rejects any other.
  } else {
    const raw = str(formData, "target");
    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Target must be more than zero.");
      target = n;
    }
    unit = str(formData, "unit") || null;
  }

  // Move target_effective_since only on the untracked<->tracked edge, and only then.
  //   null -> a goal : it takes effect today; days before today stay un-judged.
  //   a goal -> null : there's no goal to date from any more.
  //   goal -> goal   : leave it. The start of tracking hasn't moved, and a no-entry day
  //                    scores 0, which is below the old target and the new one alike.
  const today = await viewerToday();
  const wasTracked = current.target !== null;
  const nowTracked = target !== null;
  const effectiveSince =
    !wasTracked && nowTracked ? { target_effective_since: today } : {};
  const clearSince =
    wasTracked && !nowTracked ? { target_effective_since: null } : {};

  const { error } = await supabase
    .from("habits")
    .update({
      name,
      target,
      unit,
      ...effectiveSince,
      ...clearSince,
      ...(/^#[0-9a-fA-F]{6}$/.test(color) ? { color } : {}),
    })
    .eq("id", habitId);
  if (error) throw new Error(`Could not save: ${error.message}`);

  // Re-freeze the goal onto entries whose period hasn't SETTLED yet.
  //
  // The snapshot exists to protect verdicts, and an unsettled period has no verdict to
  // protect — nothing has been decided about today. So today follows the new goal while
  // every settled day keeps the one it was actually judged against.
  //
  // Without this, the most obvious edit there is quietly does nothing visible: add a
  // target to a habit you'd been tracking untracked, and today's entry keeps its null
  // snapshot, stays "untracked", and shows no bar. It reads as a broken save.
  const unsettledFrom = current.period === "week" ? weekStartDate(today) : today;

  const { error: reErr } = await supabase
    .from("habit_entries")
    .update({ target_snapshot: target })
    .eq("habit_id", habitId)
    .gte("occurred_on", unsettledFrom);
  if (reErr) throw new Error(`Saved, but could not re-apply to today: ${reErr.message}`);

  revalidateHabits();
}

/**
 * Archive, or bring back.
 *
 * Never a delete: `habit_entries` cascades, so removing the definition would silently
 * take every value you ever logged with it. Archiving keeps the history and just stops
 * asking about it.
 *
 * The pause is recorded, not erased. Archiving CLOSES the open active span at today;
 * restoring OPENS a fresh one from today, leaving the gap between visible. Without that,
 * a habit paused for a season and brought back would read as live the whole time and hand
 * you a miss for every day of a break you chose to take — the bug this shape exists to
 * prevent. `archived_at` stays too: it's still the flag the manage page splits on.
 */
export async function setHabitArchived(formData: FormData) {
  const { supabase } = await client();

  const habitId = str(formData, "habit_id");
  if (!habitId) throw new Error("Missing habit.");
  const archived = str(formData, "archived") === "true";
  const today = await viewerToday();

  const { data: current } = await supabase
    .from("habits")
    .select("active_spans")
    .eq("id", habitId)
    .maybeSingle();
  if (!current) throw new Error("No such habit.");

  const spans = (current.active_spans as HabitSpan[] | null) ?? [];
  const last = spans[spans.length - 1];
  let nextSpans: HabitSpan[];
  if (archived) {
    // Close the open span at today. If none is open, this is a no-op — you can't archive
    // something already archived, and the UI never offers it.
    nextSpans =
      last && last.end === null
        ? [...spans.slice(0, -1), { ...last, end: today }]
        : spans;
  } else {
    // Restore: reopen from today, unless a span is already open (nothing to bring back).
    nextSpans = last && last.end === null ? spans : [...spans, { start: today, end: null }];
  }

  const { error } = await supabase
    .from("habits")
    .update({
      archived_at: archived ? new Date().toISOString() : null,
      active_spans: nextSpans,
    })
    .eq("id", habitId);
  if (error) throw new Error(`Could not update: ${error.message}`);

  revalidateHabits();
}
