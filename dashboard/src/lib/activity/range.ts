import { reconstructDay, type DayItem } from "./day";
import { zonedDayStart } from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import type { GcalEvent } from "@/lib/google/calendar";

export type ReconstructedDay = { date: string; items: DayItem[] };

/**
 * Reconstruct a run of consecutive days in one pass.
 *
 * Every view needs this: the day view wants a trailing week (to compare today
 * against your own average), the week view wants seven days plus the seven before
 * it, the month wants thirty-odd. Fetch the calendar ONCE over the whole span and
 * slice it here, rather than issuing a Google call per day.
 *
 * `dates` must be consecutive, ascending YYYY-MM-DD. `logs` may span the range;
 * they're bucketed by `occurred_on`, which the mobile app writes as the event's
 * local start date — the same day an event is attributed to here.
 */
export function reconstructRange(
  events: GcalEvent[],
  logs: ActivityLog[],
  now: Date,
  dates: string[],
  tz: string,
): ReconstructedDay[] {
  const byDay = new Map<string, ActivityLog[]>();
  for (const log of logs) {
    const bucket = byDay.get(log.occurred_on);
    if (bucket) bucket.push(log);
    else byDay.set(log.occurred_on, [log]);
  }

  // bounds[i]..bounds[i+1] is day i's window; the extra entry closes the last day.
  const bounds = dates.map((d) => zonedDayStart(d, tz));
  if (dates.length) {
    const last = dates[dates.length - 1];
    const next = new Date(`${last}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    bounds.push(zonedDayStart(next.toISOString().slice(0, 10), tz));
  }

  return dates.map((date, i) => ({
    date,
    items: reconstructDay(events, byDay.get(date) ?? [], now, {
      start: bounds[i],
      end: bounds[i + 1],
    }),
  }));
}

/** Consecutive YYYY-MM-DD strings from `start`, inclusive, for `count` days. */
export function dateRange(start: string, count: number): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < count; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
