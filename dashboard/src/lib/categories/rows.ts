import type { EventCategory } from "./types";

/** The columns every category read needs. One list, so a new column lands in one place. */
export const CATEGORY_COLS = "id, color_id, name";

type CategoryRow = {
  id: string;
  color_id: number;
  name: string;
};

/** DB row → domain. `color_id` is a smallint in Postgres and a string everywhere it's
 *  compared (Google hands back `colorId` as a string), so it's normalised here once. */
export function toCategory(row: CategoryRow): EventCategory {
  return {
    id: row.id,
    colorId: String(row.color_id),
    name: row.name,
  };
}
