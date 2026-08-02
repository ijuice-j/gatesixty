import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/user";
import { getGoogleRefreshToken } from "@/lib/supabase/google-credentials";
import { listCalendarEventsForMonths, GoogleAuthExpiredError } from "@/lib/google/calendar";
import {
  reconstructRange,
  dateRange,
  monthsSpanned,
  monthBounds,
  type ReconstructedDay,
} from "@/lib/activity/range";
import {
  followThrough,
  totalFollowThrough,
  recurringBlocksOverRange,
  pct,
} from "@/lib/activity/metrics";
import { habitsOverRange, type HabitRollup } from "@/lib/habits/metrics";
import { HABIT_COLS, ENTRY_COLS, toHabit, toEntry } from "@/lib/habits/rows";
import { categoriesOverRange } from "@/lib/categories/metrics";
import { CATEGORY_COLS, toCategory } from "@/lib/categories/rows";
import {
  resolveViewerTimeZone,
  dateStringInTz,
  monthStartDate,
  daysInMonth,
  shiftMonth,
  weekdayIndex,
  weeksOfMonth,
} from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "../../../timezone-sync";
import { MetricHeader } from "../../../metric-header";
import { CategoryRollupTable } from "../../../category-rollup";
import { ReconnectBanner, LoadErrorBanner } from "../../../banners";

// The ledger is read per request and never cached. The CALENDAR is cached for 5 minutes
// (lib/google/calendar.ts) — see the note in ../page.tsx.
export const dynamic = "force-dynamic";

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const cookieStore = await cookies();
  const { tz, resolved } = resolveViewerTimeZone(cookieStore.get("tz")?.value);

  if (!resolved) {
    return (
        <div className="mx-auto w-full max-w-[97rem] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <TimezoneSync current={tz} resolved={false} />
          <p className="text-base text-[var(--text-color-kumo-subtle)]">Loading your month…</p>
        </div>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "") ? (dateParam as string) : today;

  const first = monthStartDate(ref);
  const prevFirst = shiftMonth(first, -1);
  const nextFirst = shiftMonth(first, 1);
  const nDays = daysInMonth(first);
  const nPrev = daysInMonth(prevFirst);

  // This month and the previous one — the previous one is the delta.
  const dates = dateRange(prevFirst, nPrev + nDays);

  // The month's own days, derived here rather than from the reconstruction below, which is
  // empty whenever Google fails.
  const monthDates = dateRange(first, nDays);
  // The Mon–Sun weeks this month OWNS — see weeksOfMonth. The last one usually ends in
  // next month, and the entry window is built FROM it rather than around it: two
  // expressions of one policy is how a weekly habit at the edge silently under-counts.
  const weeks = weeksOfMonth(first);
  const entryTo = weeks[weeks.length - 1].end;

  // Auth and both queries in parallel — RLS scopes each table to its owner, so neither
  // query has to wait for the user id.
  const supabase = await createClient();
  const [
    user,
    refreshToken,
    { data: logData },
    { data: habitData },
    { data: entryData },
    { data: categoryData },
  ] = await Promise.all([
      getUser(),
      getGoogleRefreshToken(),
      supabase
        .from("activity_logs")
        .select(
          "gcal_event_id, title, done, occurred_on, planned_start, planned_end, color, ended_at",
        )
        .gte("occurred_on", prevFirst)
        .lt("occurred_on", nextFirst),
      // No archived filter — a habit's lifespan decides. See lib/habits/metrics.
      supabase.from("habits").select(HABIT_COLS).order("sort_order").order("created_at"),
      // From the 1st, because every week this month owns starts on or after it, and a
      // daily habit needs the 1st anyway. Out to the last week's end, which spills — and
      // that spill is the point. No previous month: there is no habit delta.
      supabase
        .from("habit_entries")
        .select(ENTRY_COLS)
        .gte("occurred_on", first)
        .lte("occurred_on", entryTo),
      // Eleven rows at most, and no date filter — a category is a naming, not an event.
      supabase.from("event_categories").select(CATEGORY_COLS).order("color_id"),
    ]);
  if (!user) redirect("/login");

  // Before the calendar try/catch, as on the day view — habits need no Google token.
  const habitRows = habitsOverRange(
    (habitData ?? []).map((r) => toHabit(r, tz)),
    (entryData ?? []).map(toEntry),
    monthDates,
    weeks,
    today,
  );

  const logs = (logData ?? []) as ActivityLog[];

  let all: ReconstructedDay[] = [];
  let needsReconnect = !refreshToken;
  let loadError: string | null = null;

  if (refreshToken) {
    try {
      // Exactly the two months this view needs — and they're the same cache entries the
      // day and week views fill, so switching zoom inside a month costs Google nothing.
      const events = await listCalendarEventsForMonths(
        refreshToken,
        monthsSpanned(dates),
        (m) => monthBounds(m, tz),
      );
      all = reconstructRange(events, logs, new Date(), dates, tz);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) needsReconnect = true;
      else loadError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  } else if (logs.length) {
    all = reconstructRange([], logs, new Date(), dates, tz);
  }

  const month = all.slice(nPrev);
  const prevMonth = all.slice(0, nPrev);

  const perDay = month.map((d) => ({ date: d.date, ft: followThrough(d.items) }));
  const ft = totalFollowThrough(perDay.map((d) => d.ft));
  const prevFt = totalFollowThrough(prevMonth.map((d) => followThrough(d.items)));

  const blocks = recurringBlocksOverRange(month);
  const blockedDays = perDay.filter((d) => d.ft.plannedMin > 0).length;
  const best = bestStreak(blocks);

  const categories = (categoryData ?? []).map(toCategory);
  const categoryRows = categoriesOverRange(month, categories);

  const monthLabel = new Date(`${first}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const prevLabel = new Date(`${prevFirst}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC",
  });

  return (
      // The width cap lives on the COLUMNS, as on the day and week views; the outer cap
      // equals the columns plus gap and gutters, so it only centers on a wide screen.
      <div className="mx-auto w-full max-w-[97rem] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <TimezoneSync current={tz} resolved />

        <div className="mb-8 flex items-center gap-2">
          <Link
            href={`/month?date=${prevFirst}`}
            className="ds-btn ds-btn--secondary ds-btn--sm"
            aria-label="Previous month"
          >
            ‹
          </Link>
          <Link
            href={`/month?date=${nextFirst}`}
            className="ds-btn ds-btn--secondary ds-btn--sm"
            aria-label="Next month"
          >
            ›
          </Link>
          <h2 className="ml-2 text-lg font-semibold">{monthLabel}</h2>
        </div>

        {/*
         * Two columns, matching the day and week views — same cap on the main column,
         * same 400px rail, so "Where the hours went" sits in the same place at every
         * zoom. Habits stay in the LEFT column here rather than joining it: that table
         * is three columns wide and would be cramped into illegibility by the rail.
         */}
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,64rem)_minmax(0,400px)] xl:gap-12">
          <div className="min-w-0">
            <MetricHeader
              label={`Follow-through · ${monthLabel}`}
              ft={ft}
              compare={prevFt.ratio !== null ? prevFt : undefined}
              compareLabel={prevLabel}
            />

            {needsReconnect && <ReconnectBanner what="this month" />}
            {loadError && <LoadErrorBanner message={loadError} />}

            {!needsReconnect && !loadError && (
              <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
                {/* Every day, at a glance. */}
                <section>
                  <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
                    Every day, by follow-through
                  </h3>
                  <Heatmap first={first} perDay={perDay} today={today} />
                  <p className="mt-4 text-sm text-[var(--text-color-kumo-inactive)]">
                    Hollow = nothing blocked. Darker = more of what you planned, you kept.
                  </p>
                  <dl className="mt-6 flex gap-8">
                    <div>
                      <dd className="text-xl font-semibold tabular-nums">{best}</dd>
                      <dt className="text-xs uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                        Best streak
                      </dt>
                    </div>
                    <div>
                      <dd className="text-xl font-semibold tabular-nums">{blockedDays}</dd>
                      <dt className="text-xs uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                        Days blocked
                      </dt>
                    </div>
                  </dl>
                </section>

                {/* Worst first — the block you keep dropping is the one to see. */}
                <section>
                  <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
                    Recurring blocks · worst first
                  </h3>
                  {blocks.length === 0 ? (
                    <div className="ds-card ds-card--bordered">
                      <p className="text-base text-[var(--text-color-kumo-subtle)]">
                        Nothing blocked this month.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border-b border-[var(--color-kumo-line)] pb-3 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                            Block
                          </th>
                          <th className="border-b border-[var(--color-kumo-line)] pb-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                            Kept
                          </th>
                          <th className="border-b border-[var(--color-kumo-line)] pb-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                            Follow-through
                          </th>
                          <th className="border-b border-[var(--color-kumo-line)] pb-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                            Streak
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {blocks.map((h) => {
                          const p = Math.round(h.ratio * 100);
                          const bad = p < 60;
                          return (
                            <tr key={h.key}>
                              <td className="border-b border-[var(--color-kumo-line)] py-3.5 pr-2.5">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: h.color }}
                                    aria-hidden
                                  />
                                  <span className="truncate text-base">{h.title}</span>
                                </div>
                              </td>
                              <td className="border-b border-[var(--color-kumo-line)] py-3.5 text-right text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
                                {h.kept}/{h.scheduled}
                              </td>
                              <td className="whitespace-nowrap border-b border-[var(--color-kumo-line)] py-3.5 text-right">
                                <span className="mr-2.5 inline-block h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-kumo-fill)] align-middle">
                                  <span
                                    className="block h-full rounded-full"
                                    style={{
                                      width: `${p}%`,
                                      backgroundColor: bad
                                        ? "var(--color-kumo-warning)"
                                        : "var(--color-kumo-success)",
                                    }}
                                  />
                                </span>
                                <span
                                  className={
                                    "font-mono text-sm font-semibold tabular-nums " +
                                    (bad ? "text-[var(--text-color-kumo-warning)]" : "")
                                  }
                                >
                                  {p}%
                                </span>
                              </td>
                              <td className="border-b border-[var(--color-kumo-line)] py-3.5 text-right text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
                                {h.streak ? `${h.streak}d` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  <p className="mt-4 text-sm text-[var(--text-color-kumo-inactive)]">
                    Grouped by title — a recurring identity already in your data.
                  </p>
                </section>
              </div>
            )}

            {/*
             * Outside the guards above, deliberately: a habit has no Google event behind it, so
             * a dead token blanks the blocks and leaves this standing.
             *
             * No per-day strip here, and no second heatmap. The month already decided a
             * thing × day grid is the wrong zoom — that's what /week is for — and a habits
             * heatmap beside a follow-through heatmap would be two identical green ramps
             * meaning two incomparable things, which is the exact misreading habit-list.tsx
             * exists to refuse. A month asks which habit you are dropping. This answers that.
             */}
            {habitRows.length > 0 && (
              <section className="mt-12">
                <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
                  Habits · worst first
                </h3>

                {/* No bar in this table, and the empty space is the point. A bar whose length
                    is kept ÷ judged IS a percentage, drawn — and it would sit inches below a
                    bar whose length is hours kept ÷ hours planned, inviting exactly the
                    length-to-length comparison that means nothing. The ratio orders these rows
                    and colours the bad ones. It is never printed and never drawn. */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {/* No Target column, deliberately. The habit row carries the goal you
                          hold NOW, while Kept beside it was judged against the goal frozen on
                          each entry — so a June row judged at 50 reps would sit under a header
                          reading 100 and claim you hit it 23 times. The target you are chasing
                          lives on /habits; this table answers which habit you are dropping. */}
                      {["Habit", "Kept", "Streak"].map((h, i) => (
                        <th
                          key={h}
                          className={
                            "border-b border-[var(--color-kumo-line)] pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)] " +
                            (i === 0 ? "pr-3 text-left" : "text-right")
                          }
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {habitRows.map((row) => (
                      <HabitRollupRow key={row.habit.id} row={row} />
                    ))}
                  </tbody>
                </table>

                <p className="mt-4 text-sm text-[var(--text-color-kumo-inactive)]">
                  Declared, not derived — a habit is here because you said so. Judged from the
                  day you made it: one added on the 8th is scored on 24 days, not 31. Not
                  counted in follow-through — habits have no hours to weigh.
                </p>
              </section>
            )}
          </div>

          {/* Inside the calendar guards: a category is a naming of a Google colour, so
              with no calendar there is nothing to group, and an empty table would read
              as "you did nothing" rather than "we couldn't look". */}
          <aside className="min-w-0">
            {!needsReconnect && !loadError && (
              <section>
                <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
                  Where the hours went
                </h3>
                <CategoryRollupTable
                  rows={categoryRows}
                  emptyHint={categories.length === 0}
                />
              </section>
            )}
          </aside>
        </div>
      </div>
  );
}

function HabitRollupRow({ row }: { row: HabitRollup }) {
  const bad = row.ratio !== null && row.ratio < 0.6;
  const unit = row.habit.period === "week" ? "weeks" : "days";
  const cell = "border-b border-[var(--color-kumo-line)] py-3.5";

  return (
    <tr>
      <td className={`${cell} pr-3`}>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.habit.color }}
            aria-hidden
          />
          <span className="truncate text-base">{row.habit.name}</span>
        </div>
      </td>

      {/* "18 of 24 days" · "2 of 4 weeks". A count, not a percentage — and prose, so it
          can't be read on the same scale as the follow-through column above it. The
          denominator carries the lifespan for free: a habit declared on the 8th says 24
          where its neighbours say 31, without spending a cell to explain itself. */}
      <td className={`${cell} whitespace-nowrap text-right text-sm tabular-nums text-[var(--text-color-kumo-subtle)]`}>
        {row.judged === 0 ? (
          <span className="text-[var(--text-color-kumo-inactive)]">—</span>
        ) : (
          <>
            <span
              className={
                "font-semibold " +
                (bad
                  ? "text-[var(--text-color-kumo-warning)]"
                  : "text-[var(--text-color-kumo-default)]")
              }
            >
              {row.kept}
            </span>{" "}
            of {row.judged} {unit}
          </>
        )}
      </td>

      <td className={`${cell} text-right text-sm tabular-nums text-[var(--text-color-kumo-subtle)]`}>
        {row.streak ? `${row.streak}${row.habit.period === "week" ? "w" : "d"}` : "—"}
      </td>
    </tr>
  );
}

function Heatmap({
  first,
  perDay,
  today,
}: {
  first: string;
  perDay: { date: string; ft: ReturnType<typeof followThrough> }[];
  today: string;
}) {
  const pad = weekdayIndex(first); // Monday-first grid

  return (
    <div className="grid max-w-[380px] grid-cols-7 gap-2">
      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
        <div
          key={i}
          className="text-center text-[11px] uppercase tracking-wide text-[var(--text-color-kumo-inactive)]"
        >
          {d}
        </div>
      ))}

      {Array.from({ length: pad }, (_, i) => (
        <div key={`pad-${i}`} />
      ))}

      {perDay.map(({ date, ft }) => {
        const p = pct(ft.ratio);
        const isToday = date === today;
        return (
          <Link
            key={date}
            href={`/?date=${date}`}
            title={
              p === null
                ? `${date} · nothing blocked`
                : `${date} · ${p}% follow-through`
            }
            className={
              "flex aspect-square items-center justify-center rounded-md text-[11px] tabular-nums transition hover:ring-2 hover:ring-[var(--color-kumo-focus)] " +
              (p === null
                ? "border border-[var(--color-kumo-line)] text-[var(--text-color-kumo-inactive)]"
                : "text-[var(--text-color-kumo-default)]") +
              (isToday ? " ring-1 ring-[var(--color-kumo-brand)]" : "")
            }
            style={
              p === null
                ? undefined
                : {
                    // 12% floor so a 0% day still reads as "you had blocks and dropped them",
                    // which is a different fact from "you had none".
                    backgroundColor: `color-mix(in oklab, var(--color-kumo-success) ${Math.round(12 + p * 0.62)}%, var(--color-kumo-base))`,
                  }
            }
          >
            {Number(date.slice(8, 10))}
          </Link>
        );
      })}
    </div>
  );
}

/** The longest kept-run any single block managed this month. */
function bestStreak(blocks: { streak: number }[]): number {
  return blocks.reduce((m, b) => Math.max(m, b.streak), 0);
}
