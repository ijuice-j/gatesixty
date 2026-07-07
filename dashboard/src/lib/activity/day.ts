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

/** UTC [start, end) instants bounding the day being reconstructed. */
export type DayWindow = { start: Date; end: Date };

/**
 * Reconstruct a day's outcomes by joining live calendar events with the ledger.
 * The ledger holds only `done=true` rows, so status falls out of three cases:
 *   - a done row exists            → done      (rendered from the frozen snapshot)
 *   - no row, event already ended  → not_done  (the reconstruction the app punts to web)
 *   - no row, event still to come  → upcoming
 *
 * An event belongs to the day it **starts** — matching the mobile app, which
 * writes `occurred_on` as the event's local start date. Google's events.list
 * returns everything that *overlaps* the window, so a cross-midnight event comes
 * back on both days; filtering by start keeps it on its start day only (no
 * phantom "Missed" duplicate on the other day). `window` is that day's range;
 * `logs` must already be scoped to this day (occurred_on).
 *
 * All-day events are skipped — the tracker only covers timed events.
 */
export function reconstructDay(
  events: GcalEvent[],
  logs: ActivityLog[],
  now: Date,
  window: DayWindow,
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

    // Keep only events that start within this day (Google also returns events
    // that merely overlap the window from an earlier day).
    const startMs = new Date(start).getTime();
    if (startMs < window.start.getTime() || startMs >= window.end.getTime()) {
      continue;
    }
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

  // Sort by true instant, not by string. Done rows come from the ledger in UTC
  // (…+00:00) while missed/upcoming come live from Google in the calendar's
  // local offset (…+05:30), so a lexical compare of the two representations
  // mis-orders them — e.g. a just-marked-done event would jump ahead of an
  // earlier live one. Date.parse normalises both to a millisecond instant.
  items.sort(
    (a, b) =>
      (a.start ? Date.parse(a.start) : 0) - (b.start ? Date.parse(b.start) : 0),
  );
  return items;
}

/** Per-day tallies for the week overview. */
export type DaySummary = {
  total: number;
  done: number;
  missed: number;
  upcoming: number;
};

export function summarizeDay(items: DayItem[]): DaySummary {
  let done = 0;
  let missed = 0;
  let upcoming = 0;
  for (const it of items) {
    if (it.status === "done") done++;
    else if (it.status === "not_done") missed++;
    else upcoming++;
  }
  return { total: items.length, done, missed, upcoming };
}
