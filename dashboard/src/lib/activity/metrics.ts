import type { DayItem } from "./day";

/**
 * Follow-through: the hours you kept, over the hours you planned.
 *
 * Weighted by DURATION, not event count — and that distinction is the whole point.
 * A day with six kept 15-minute blocks and one dropped 3-hour deep-work block is
 * 86% by count and 30% by hours. Counting events lets a day of shallow wins hide
 * the loss of every hour you actually cared about.
 */
export type FollowThrough = {
  /** Minutes of settled blocks — i.e. everything that has already ended. */
  plannedMin: number;
  keptMin: number;
  missedMin: number;
  keptCount: number;
  missedCount: number;
  /** kept ÷ planned, 0-1. `null` when nothing was scheduled — see below. */
  ratio: number | null;
};

const EMPTY: FollowThrough = {
  plannedMin: 0,
  keptMin: 0,
  missedMin: 0,
  keptCount: 0,
  missedCount: 0,
  ratio: null,
};

/** Duration in whole minutes, or 0 when the window is unknown. */
export function durationMin(item: Pick<DayItem, "start" | "end">): number {
  if (!item.start || !item.end) return 0;
  const ms = Date.parse(item.end) - Date.parse(item.start);
  return ms > 0 ? Math.round(ms / 60000) : 0;
}

/**
 * Two rules here decide whether the number feels fair or punitive:
 *
 * 1. `upcoming` blocks are EXCLUDED. You cannot have missed a block that hasn't
 *    ended yet — count them and at 9am you'd be staring at 8% and feeling like a
 *    failure for a day you haven't lived.
 *
 * 2. A period with nothing scheduled yields `ratio: null`, NOT 0. A rest day is
 *    not a failure and must never drag an average down. Callers render it as "—".
 */
export function followThrough(items: DayItem[]): FollowThrough {
  const out: FollowThrough = { ...EMPTY };

  for (const item of items) {
    if (item.status === "upcoming") continue; // not settled — no verdict yet
    const min = durationMin(item);
    out.plannedMin += min;
    if (item.status === "done") {
      out.keptMin += min;
      out.keptCount++;
    } else {
      out.missedMin += min;
      out.missedCount++;
    }
  }

  out.ratio = out.plannedMin > 0 ? out.keptMin / out.plannedMin : null;
  return out;
}

/** Sum several periods into one — used for the week and month totals. */
export function totalFollowThrough(parts: FollowThrough[]): FollowThrough {
  const out: FollowThrough = { ...EMPTY };
  for (const p of parts) {
    out.plannedMin += p.plannedMin;
    out.keptMin += p.keptMin;
    out.missedMin += p.missedMin;
    out.keptCount += p.keptCount;
    out.missedCount += p.missedCount;
  }
  out.ratio = out.plannedMin > 0 ? out.keptMin / out.plannedMin : null;
  return out;
}

/** 0-100, or null when nothing was scheduled. */
export function pct(ratio: number | null): number | null {
  return ratio === null ? null : Math.round(ratio * 100);
}

/** "2h 45m" · "45m" · "—" */
export function formatMinutes(min: number): string {
  if (min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Habits
//
// A recurring calendar block IS a habit. Google returns `recurringEventId` on
// every instance (we pass singleEvents:true), which is the exact identity — but
// we don't store it yet, so we group on the TITLE instead.
//
// This is a deliberate heuristic, not an oversight: it needs no migration and it
// is right for every event whose name is stable. Its failure mode is honest and
// bounded — rename a recurring event and its history splits in two. The fix is
// one nullable column, `activity_logs.recurring_event_id`, at which point this
// function keys on that and falls back to the title for pre-existing rows.
// ---------------------------------------------------------------------------

export type Habit = {
  key: string;
  title: string;
  color: string;
  /** Occurrences that have settled (ended). Upcoming ones are not yet judged. */
  scheduled: number;
  kept: number;
  ratio: number;
  /** Consecutive kept occurrences, counting back from the most recent settled one. */
  streak: number;
};

type Dated = { date: string; items: DayItem[] };

const keyOf = (title: string) => title.trim().toLowerCase();

/**
 * Roll a range of reconstructed days up into per-habit stats.
 * `days` must be in ascending date order.
 *
 * `minOccurrences` exists because a block that happened ONCE is not a habit — it's an
 * appointment. Left unfiltered, a one-off meeting you skipped shows up as
 * "0/1 · 0% · streak —" and sits at the top of a worst-first table, crowding out the
 * recurring block you're genuinely failing to keep. Two is the floor for "recurring".
 */
export function habitsOverRange(days: Dated[], minOccurrences = 2): Habit[] {
  type Acc = {
    title: string;
    color: string;
    scheduled: number;
    kept: number;
    /** settled outcomes in ascending date order — the streak is read off the tail */
    outcomes: boolean[];
  };
  const acc = new Map<string, Acc>();

  for (const day of days) {
    for (const item of day.items) {
      if (item.status === "upcoming") continue;
      const k = keyOf(item.title);
      if (!k) continue;
      let a = acc.get(k);
      if (!a) {
        a = { title: item.title, color: item.color, scheduled: 0, kept: 0, outcomes: [] };
        acc.set(k, a);
      }
      const done = item.status === "done";
      a.scheduled++;
      if (done) a.kept++;
      a.outcomes.push(done);
    }
  }

  const habits: Habit[] = [];
  for (const [key, a] of acc) {
    if (a.scheduled < minOccurrences) continue; // an appointment, not a habit
    // Count back from the most recent settled occurrence until one was missed.
    let streak = 0;
    for (let i = a.outcomes.length - 1; i >= 0 && a.outcomes[i]; i--) streak++;
    habits.push({
      key,
      title: a.title,
      color: a.color,
      scheduled: a.scheduled,
      kept: a.kept,
      ratio: a.scheduled ? a.kept / a.scheduled : 0,
      streak,
    });
  }

  // Worst first: the block you keep dropping is the one you need to see.
  return habits.sort((x, y) => x.ratio - y.ratio || y.scheduled - x.scheduled);
}

/**
 * The week grid: one row per recurring block, one cell per day.
 * `null` means the block wasn't scheduled that day — which is not a miss.
 */
export type GridRow = {
  key: string;
  title: string;
  color: string;
  cells: (DayItem["status"] | null)[];
  scheduled: number;
  kept: number;
};

export function weekGrid(days: Dated[]): GridRow[] {
  const rows = new Map<string, GridRow>();

  days.forEach((day, i) => {
    for (const item of day.items) {
      const k = keyOf(item.title);
      if (!k) continue;
      let row = rows.get(k);
      if (!row) {
        row = {
          key: k,
          title: item.title,
          color: item.color,
          cells: Array(days.length).fill(null),
          scheduled: 0,
          kept: 0,
        };
        rows.set(k, row);
      }
      // A day can hold two instances of the same block; the worse outcome wins,
      // so a grid cell never flatters you.
      const prev = row.cells[i];
      const rank = { done: 0, upcoming: 1, not_done: 2 } as const;
      if (prev === null || rank[item.status] > rank[prev]) row.cells[i] = item.status;
    }
  });

  for (const row of rows.values()) {
    for (const c of row.cells) {
      if (c === null || c === "upcoming") continue;
      row.scheduled++;
      if (c === "done") row.kept++;
    }
  }

  // Most-scheduled first, so the daily anchors sit at the top and the grid reads
  // in a stable order week to week. The score column does the ranking.
  return [...rows.values()].sort(
    (a, b) => b.scheduled - a.scheduled || a.title.localeCompare(b.title),
  );
}
