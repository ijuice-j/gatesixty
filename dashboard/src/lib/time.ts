/**
 * Timezone helpers for the day view. Day boundaries are computed in the viewer's
 * IANA timezone so the calendar↔ledger join lines up with their wall clock — the
 * mobile app records `occurred_on` as the event's device-local start date, so
 * viewing "Jul 7" must mean the same local day here.
 */

/** True if `tz` is a usable IANA zone (guards user-supplied cookie values). */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Milliseconds the local time in `tz` is offset from UTC at `instant`. */
function tzOffsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(
    dtf.formatToParts(instant).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  const asUTC = Date.UTC(
    +p.year,
    +p.month - 1,
    +p.day,
    +p.hour,
    +p.minute,
    +p.second,
  );
  return asUTC - instant.getTime();
}

/** UTC instant of local midnight starting the calendar day `dateStr` in `tz`. */
export function zonedDayStart(dateStr: string, tz: string): Date {
  const guess = new Date(`${dateStr}T00:00:00Z`);
  // First guess uses the offset sampled at midnight-UTC; re-sample at the
  // resulting instant so a DST transition sitting between midnight-UTC and
  // local midnight (or the wall clock) doesn't leave us an hour off.
  const first = new Date(guess.getTime() - tzOffsetMs(guess, tz));
  const refined = new Date(guess.getTime() - tzOffsetMs(first, tz));
  return refined;
}

/**
 * UTC [start, end) instants bounding the local calendar day `dateStr` in `tz`.
 * `end` is the *next* local midnight — not `start + 24h` — so DST-transition
 * days (23h or 25h long) don't drop or double-count events near the boundary.
 */
export function zonedDayRange(
  dateStr: string,
  tz: string,
): { start: Date; end: Date } {
  return {
    start: zonedDayStart(dateStr, tz),
    end: zonedDayStart(shiftDate(dateStr, 1), tz),
  };
}

/** `YYYY-MM-DD` for `instant` in `tz` (en-CA formats as ISO date). */
export function dateStringInTz(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Shift a `YYYY-MM-DD` string by whole days (UTC math avoids DST drift). */
export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
