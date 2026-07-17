"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { formatProgress, trim, type HabitProgress } from "@/lib/habits/metrics";
import { logHabit } from "./habit-actions";

/**
 * Today's habits, logged in place.
 *
 * This sits BELOW the blocks on purpose: the day's subject is still the calendar. And it
 * never shows a percentage — follow-through is a percentage backed by hours, this is a
 * count of things. Two numbers of visibly different kinds can't be misread as one
 * number, which is the whole reason the score here is "3 of 4" and not "75%".
 */
export function HabitList({
  rows,
  score,
  date,
  editable,
}: {
  rows: HabitProgress[];
  score: { kept: number; scored: number };
  date: string;
  /** A day you haven't lived can't be logged. Future dates render read-only. */
  editable: boolean;
}) {
  if (rows.length === 0) {
    return (
      <section className="mt-8">
        <Heading score={null} />
        <div className="ds-card ds-card--bordered">
          <p className="text-base text-[var(--text-color-kumo-subtle)]">
            No habits yet.{" "}
            <Link href="/habits" className="text-[var(--text-color-kumo-info)] underline">
              Add one
            </Link>{" "}
            to track something the calendar can&apos;t — pushups, water, pages read.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <Heading score={score} />

      <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
        <ul className="divide-y divide-[var(--color-kumo-line)]">
          {rows.map((row) => (
            <Row key={row.habit.id} row={row} date={date} editable={editable} />
          ))}
        </ul>
      </div>

      {/* The app already tells you a rest day scores — and not 0%. Same honesty here:
          say out loud what this number is not. */}
      <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
        Not counted in follow-through — habits have no hours to weigh.
      </p>
    </section>
  );
}

function Heading({ score }: { score: { kept: number; scored: number } | null }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
        Habits
      </h3>
      {score && score.scored > 0 && (
        <p className="text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
          <span className="font-semibold text-[var(--text-color-kumo-default)]">
            {score.kept}
          </span>{" "}
          of {score.scored} kept
        </p>
      )}
    </div>
  );
}

function Row({
  row,
  date,
  editable,
}: {
  row: HabitProgress;
  date: string;
  editable: boolean;
}) {
  const { habit, status } = row;
  const missed = status === "missed";
  const weekly = habit.period === "week";

  return (
    <li
      className={
        "flex h-12 items-center gap-3.5 border-l-[3px] pr-3.5 transition " +
        (missed
          ? "border-l-[var(--color-kumo-warning)] bg-[color-mix(in_oklab,var(--color-kumo-warning-tint)_55%,transparent)]"
          : "border-l-transparent hover:bg-[var(--color-kumo-fill-hover)]")
      }
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-3.5">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: habit.color }}
          aria-hidden
        />
        <span className="truncate text-base font-medium">{habit.name}</span>
        {weekly && (
          <span className="shrink-0 text-sm text-[var(--text-color-kumo-inactive)]">
            · {trim(habit.target ?? 0)}/wk
          </span>
        )}
      </div>

      {/* The meter, mirroring the duration bar on a block row. */}
      <div className="hidden w-[168px] shrink-0 items-center gap-2.5 sm:flex">
        <Meter row={row} />
        <span className="w-[86px] shrink-0 text-right font-mono text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
          {formatProgress(row)}
          {weekly && <span className="text-[var(--text-color-kumo-inactive)]"> wk</span>}
        </span>
      </div>

      {habit.kind === "check" ? (
        <CheckControl row={row} date={date} editable={editable} />
      ) : (
        <CountControl row={row} date={date} editable={editable} />
      )}
    </li>
  );
}

function Meter({ row }: { row: HabitProgress }) {
  // Nothing to fill against — an untracked habit has no bar, only a number.
  if (row.target === null) {
    return <span className="h-1.5 flex-1" aria-hidden />;
  }
  const filled = Math.min(100, Math.round((row.progress / row.target) * 100));
  return (
    <span
      className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-kumo-fill)]"
      role="progressbar"
      aria-valuenow={filled}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${row.habit.name} progress`}
    >
      <span
        className="block h-full rounded-full transition-[width]"
        style={{
          width: `${filled}%`,
          backgroundColor:
            row.status === "kept"
              ? "var(--color-kumo-success)"
              : row.status === "missed"
                ? "var(--color-kumo-warning)"
                : row.habit.color,
        }}
      />
    </span>
  );
}

/** Did you or didn't you — the same badge-as-button the block rows use to backfill. */
function CheckControl({
  row,
  date,
  editable,
}: {
  row: HabitProgress;
  date: string;
  editable: boolean;
}) {
  const done = row.value !== null && row.value > 0;

  if (!editable) {
    return (
      <span className="ds-badge ds-badge--outline w-24 shrink-0 justify-center">
        {done ? "Done" : "—"}
      </span>
    );
  }

  return (
    <form action={logHabit} className="shrink-0">
      <input type="hidden" name="habit_id" value={row.habit.id} />
      <input type="hidden" name="occurred_on" value={date} />
      {/* Clearing writes an empty value, which DELETES the row — never a stored 0. */}
      <input type="hidden" name="value" value={done ? "" : "1"} />
      <button
        type="submit"
        aria-label={done ? `Un-mark ${row.habit.name}` : `Mark ${row.habit.name} done`}
        className={
          "ds-badge ds-badge--subtle w-24 cursor-pointer justify-center " +
          (done ? "ds-badge--success" : row.status === "missed" ? "ds-badge--warning" : "")
        }
      >
        {done ? "Done" : row.status === "missed" ? "Missed" : "Not yet"}
      </button>
    </form>
  );
}

/** A number you type. Submits on Enter, and on blur once it's actually changed. */
function CountControl({
  row,
  date,
  editable,
}: {
  row: HabitProgress;
  date: string;
  editable: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);

  if (!editable) {
    return (
      <span className="w-24 shrink-0 text-right font-mono text-sm tabular-nums text-[var(--text-color-kumo-inactive)]">
        {row.value === null ? "—" : trim(row.value)}
      </span>
    );
  }

  return (
    <form
      ref={form}
      action={logHabit}
      className="ds-input-group w-24 shrink-0"
      onSubmit={() => setDirty(false)}
    >
      <input type="hidden" name="habit_id" value={row.habit.id} />
      <input type="hidden" name="occurred_on" value={date} />
      <input
        name="value"
        // Uncontrolled: you are mid-type, the server is not the authority on the
        // digits under your cursor. The key remounts it when the stored value
        // changes underneath (a backfill elsewhere, a revalidate).
        key={row.value ?? "empty"}
        defaultValue={row.value ?? ""}
        inputMode="decimal"
        placeholder="—"
        aria-label={`${row.habit.name}${row.habit.unit ? ` in ${row.habit.unit}` : ""}`}
        onChange={() => setDirty(true)}
        onBlur={() => dirty && form.current?.requestSubmit()}
        className="ds-input ds-input--sm w-full text-right font-mono tabular-nums"
      />
    </form>
  );
}
