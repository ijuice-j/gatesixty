import { eventColor, DEFAULT_EVENT_COLOR, type GcalEvent } from "@/lib/google/calendar";
import type { ActivityLog } from "@/lib/types";

export type DayStatus = "done" | "not_done" | "upcoming";

/** One reconstructed row for the day view. */
export type DayItem = {
  id: string; // gcal_event_id
  title: string;
  start: string | null; // ISO timestamptz
  end: string | null;
  color: string;
  status: DayStatus;
};

/**
 * Reconstruct a day's outcomes by joining live calendar events with the ledger.
 * The ledger holds only `done=true` rows, so status falls out of three cases:
 *   - a done row exists            → done      (rendered from the frozen snapshot)
 *   - no row, event already ended  → not_done  (the reconstruction the app punts to web)
 *   - no row, event still to come  → upcoming
 *
 * All-day events are skipped — the tracker only covers timed events, matching
 * the mobile app. `logs` must already be scoped to this day (occurred_on).
 */
export function reconstructDay(
  events: GcalEvent[],
  logs: ActivityLog[],
  now: Date,
): DayItem[] {
  const doneById = new Map(
    logs.filter((l) => l.done).map((l) => [l.gcal_event_id, l]),
  );
  const seen = new Set<string>();
  const items: DayItem[] = [];

  for (const ev of events) {
    const start = ev.start?.dateTime;
    const end = ev.end?.dateTime;
    if (!ev.id || !start || !end) continue; // all-day / malformed → skip
    seen.add(ev.id);

    const log = doneById.get(ev.id);
    if (log) {
      // Prefer the frozen snapshot; fall back to the live event for any gaps.
      items.push({
        id: ev.id,
        title: log.title || ev.summary?.trim() || "(busy)",
        start: log.planned_start ?? start,
        end: log.planned_end ?? end,
        color: log.color ?? eventColor(ev.colorId),
        status: "done",
      });
    } else {
      const ended = new Date(end).getTime() <= now.getTime();
      items.push({
        id: ev.id,
        title: ev.summary?.trim() || "(busy)",
        start,
        end,
        color: eventColor(ev.colorId),
        status: ended ? "not_done" : "upcoming",
      });
    }
  }

  // A done row whose source event was later edited/deleted still belongs on the
  // day — surface it from the ledger snapshot alone.
  for (const log of doneById.values()) {
    if (seen.has(log.gcal_event_id)) continue;
    items.push({
      id: log.gcal_event_id,
      title: log.title || "(busy)",
      start: log.planned_start,
      end: log.planned_end,
      color: log.color ?? DEFAULT_EVENT_COLOR,
      status: "done",
    });
  }

  items.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  return items;
}
