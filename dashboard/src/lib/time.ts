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

/** Monday (`YYYY-MM-DD`) of the week containing `dateStr`. Pure calendar math,
 *  so it's timezone-independent. */
export function weekStartDate(dateStr: string): string {
  const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  return shiftDate(dateStr, -((dow + 6) % 7)); // days back to Monday
}

/** The 1st (`YYYY-MM-DD`) of the month containing `dateStr`. */
export function monthStartDate(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

/** How many days the month containing `dateStr` has. */
export function daysInMonth(dateStr: string): number {
  const [y, m] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate(); // day 0 of next month = last of this
}

/** Shift by whole months, clamping the day (31 Jan − 1 month → 31 Dec, not 3 Mar). */
export function shiftMonth(dateStr: string, months: number): string {
  const [y, m] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday. The grid starts on Monday, like weekStartDate. */
export function weekdayIndex(dateStr: string): number {
  return (new Date(`${dateStr}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * The Mon–Sun weeks belonging to the month containing `dateStr`.
 *
 * A week belongs to the month its MONDAY falls in. The week straddling the 1st is the
 * previous month's; the week straddling the last is this one's, spilling end and all.
 * Every week lands in exactly one month: none judged twice, none unjudged.
 *
 * The alternative — every week that OVERLAPS the month — counts a straddling week in
 * both, and twelve months of "weeks kept" then add up to more weeks than the year has.
 *
 * Ascending. The last one's `end` is usually NOT in the month, which is exactly what a
 * weekly habit's entry window has to be built FROM rather than around. Never empty: the
 * shortest month there is holds four Mondays.
 */
export function weeksOfMonth(dateStr: string): { start: string; end: string }[] {
  const first = monthStartDate(dateStr);
  const last = shiftDate(shiftMonth(first, 1), -1);

  let monday = weekStartDate(first);
  if (monday < first) monday = shiftDate(monday, 7); // that week is last month's

  const weeks: { start: string; end: string }[] = [];
  for (; monday <= last; monday = shiftDate(monday, 7)) {
    weeks.push({ start: monday, end: shiftDate(monday, 6) });
  }
  return weeks;
}

/**
 * Resolve the viewer's timezone from the raw `tz` cookie. `resolved` is false
 * when the cookie is absent or invalid — callers render a placeholder and let
 * <TimezoneSync> report the real zone, avoiding a UTC-then-refresh double fetch.
 */
export function resolveViewerTimeZone(rawTz: string | undefined): {
  tz: string;
  resolved: boolean;
} {
  const resolved = !!rawTz && isValidTimeZone(rawTz);
  return { tz: resolved ? (rawTz as string) : "UTC", resolved };
}
