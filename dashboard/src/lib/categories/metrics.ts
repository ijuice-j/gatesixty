// Relative, and with the extension: this is a VALUE import, so it survives to runtime,
// and the *.test.ts runner (`node --experimental-strip-types`) resolves the real path on
// disk — it can neither expand the `@/` alias nor guess an extension. The type-only
// imports below are erased before node ever sees them, so they stay bare like everywhere
// else. tsconfig sets allowImportingTsExtensions for exactly this.
import { followThrough, type FollowThrough } from "../activity/metrics.ts";
import type { DayItem } from "../activity/day";
import type { EventCategory } from "./types";

/**
 * The bucket for blocks whose event carries no colour.
 *
 * Deliberately a real row and not a silent drop. If uncategorised time vanished, a
 * month where you coloured two events out of forty would show two tidy categories and
 * read as complete — the numbers would look right and mean nothing. Shown, it says
 * plainly how much of your time is still unfiled.
 */
export const UNCATEGORIZED = "uncategorized";

export type CategoryRollup = {
  /** colorId, or UNCATEGORIZED. */
  key: string;
  name: string;
  /** null for the uncategorised bucket — it has no swatch to draw. */
  colorId: string | null;
  ft: FollowThrough;
};

type Dated = { date: string; items: DayItem[] };

/**
 * Roll a range of reconstructed days up by category.
 *
 * Every bucket is scored by handing its items to `followThrough` — the same function
 * the page header uses — rather than re-summing minutes here. That is not tidiness:
 * it's what makes the category rows RECONCILE with the header above them. followThrough
 * excludes `upcoming` blocks ("you cannot have missed a block that hasn't ended yet"),
 * and a rollup that counted them would quietly total more planned hours than the
 * headline figure, on the same screen, with no way to tell which was lying.
 *
 * Categories you declared but didn't touch this period are KEPT, at zero. "You did no
 * Reading in July" is an answer to the question the page asks; dropping the row would
 * silently turn it into "you never had a Reading category".
 */
export function categoriesOverRange(
  days: Dated[],
  categories: EventCategory[],
): CategoryRollup[] {
  const byColorId = new Map(categories.map((c) => [c.colorId, c]));

  // Seed every declared category so an untouched one still reports its zero.
  const buckets = new Map<string, DayItem[]>();
  for (const c of categories) buckets.set(c.colorId, []);

  for (const day of days) {
    for (const item of day.items) {
      // A colour with no name is not a category — it falls in with the uncoloured.
      // Otherwise naming ten of eleven colours would leave the eleventh as a phantom
      // bucket labelled by a hex nobody chose.
      const key =
        item.colorId && byColorId.has(item.colorId) ? item.colorId : UNCATEGORIZED;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(item);
      else buckets.set(key, [item]);
    }
  }

  const rows: CategoryRollup[] = [];
  for (const [key, items] of buckets) {
    const uncategorized = key === UNCATEGORIZED;
    // An empty uncategorised bucket is nothing to report; an empty NAMED one is.
    if (uncategorized && items.length === 0) continue;
    rows.push({
      key,
      name: uncategorized ? "Uncategorised" : (byColorId.get(key)?.name ?? "—"),
      colorId: uncategorized ? null : key,
      ft: followThrough(items),
    });
  }

  // Where your hours went, most first — the question a month view is asked. Untouched
  // categories fall to the bottom by name, and uncategorised is pinned last: it is
  // often the biggest bucket early on, and letting it head the table would bury the
  // real categories under a row whose only message is "go and colour some events".
  return rows.sort((a, b) => {
    if (a.key === UNCATEGORIZED) return 1;
    if (b.key === UNCATEGORIZED) return -1;
    return (
      b.ft.plannedMin - a.ft.plannedMin || a.name.localeCompare(b.name)
    );
  });
}
