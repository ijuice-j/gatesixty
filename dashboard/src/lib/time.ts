/**
 * Timezone helpers for the day view. Day boundaries are computed in the viewer's
 * IANA timezone so the calendar↔ledger join lines up with their wall clock — the
 * mobile app records `occurred_on` as a device-local date, so viewing "Jul 7"
 * must mean the same local day here.
 */

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

/** UTC [start, end) instants bounding the local calendar day `dateStr` in `tz`. */
export function zonedDayRange(
  dateStr: string,
  tz: string,
): { start: Date; end: Date } {
  const guess = new Date(`${dateStr}T00:00:00Z`);
  const start = new Date(guess.getTime() - tzOffsetMs(guess, tz));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
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
