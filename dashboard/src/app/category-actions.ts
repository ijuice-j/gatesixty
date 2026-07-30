"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function client() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return { supabase, user };
}

/** Naming a colour changes every rollup that reads it, at every zoom — and "/" is one
 *  of them. It renders "Where the day went" beside the habits, so leaving it out here
 *  left the day view serving a stale router-cache payload with the old name. */
function revalidateCategories() {
  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/week");
  revalidatePath("/month");
}

/**
 * Name a colour, rename it, or clear the name.
 *
 * One action rather than create/update/delete, because from the screen there is only
 * one gesture: you type into the box next to a swatch, or you empty it. Upsert on
 * `(user_id, color_id)` makes "name it" and "rename it" the same write, and an empty
 * box means delete — a category with no name is not a category, and storing "" would
 * put an unlabelled row in every rollup.
 *
 * Deleting is safe in a way it isn't for habits: nothing references a category. No
 * event stores one, because categories resolve at read time from the live colour. So
 * clearing a name reclassifies that colour's blocks as Uncategorised and loses nothing.
 */
export async function saveCategory(formData: FormData) {
  const { supabase, user } = await client();

  const raw = formData.get("color_id");
  const colorId = Number(typeof raw === "string" ? raw : "");
  if (!Number.isInteger(colorId) || colorId < 1 || colorId > 11) {
    throw new Error("Not a Google Calendar colour.");
  }

  const nameRaw = formData.get("name");
  const name = (typeof nameRaw === "string" ? nameRaw : "").trim();

  if (name === "") {
    const { error } = await supabase
      .from("event_categories")
      .delete()
      .eq("color_id", colorId);
    if (error) throw new Error(`Could not clear: ${error.message}`);
    revalidateCategories();
    return;
  }

  if (name.length > 40) throw new Error("Keep the name under 40 characters.");

  const { error } = await supabase.from("event_categories").upsert(
    { user_id: user.id, color_id: colorId, name },
    { onConflict: "user_id,color_id" },
  );
  if (error) throw new Error(`Could not save: ${error.message}`);

  revalidateCategories();
}
