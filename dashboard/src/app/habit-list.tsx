"use client";

import { useState } from "react";
import Link from "next/link";
import { formatProgress, trim, type HabitProgress } from "@/lib/habits/metrics";
import { logHabit } from "./habit-actions";

/**
 * Today's habits, logged in place, beside the blocks.
 *
 * It never shows a percentage — follow-through is a percentage backed by hours, this is
 * a count of things. Two numbers of visibly different kinds can't be misread as one
 * number, which is why the score here is "3 of 4" and not "75%".
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
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
          Habits
        </h3>
        {rows.length > 0 && score.scored > 0 && (
          <p className="text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
            <span className="font-semibold text-[var(--text-color-kumo-default)]">
              {score.kept}
            </span>{" "}
            of {score.scored} kept
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="ds-card ds-card--bordered">
          <p className="text-sm text-[var(--text-color-kumo-subtle)]">
            Nothing tracked yet.{" "}
            <Link href="/habits" className="text-[var(--text-color-kumo-info)] underline">
              Add a habit
            </Link>{" "}
            for what the calendar can&apos;t hold — pushups, water, pages.
          </p>
        </div>
      ) : (
        <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
          <ul className="divide-y divide-[var(--color-kumo-line)]">
            {rows.map((row) => (
              <Row key={row.habit.id} row={row} date={date} editable={editable} />
            ))}
          </ul>
        </div>
      )}

      {/* The app already says a rest day scores — and not 0%. Same honesty here: say out
          loud what this number is not. */}
      <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
        Not counted in follow-through — habits have no hours to weigh.
      </p>
    </section>
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

  return (
    <li
      className={
        "border-l-[3px] px-3 py-2.5 transition " +
        (missed
          ? "border-l-[var(--color-kumo-warning)] bg-[color-mix(in_oklab,var(--color-kumo-warning-tint)_55%,transparent)]"
          : "border-l-transparent")
      }
    >
      <div className="flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: habit.color }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-base font-medium">{habit.name}</span>
        {habit.period === "week" && (
          <span className="shrink-0 text-xs text-[var(--text-color-kumo-inactive)]">
            {trim(habit.target ?? 0)}/wk
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {habit.kind === "check" ? (
          <CheckControl row={row} date={date} editable={editable} />
        ) : (
          <CountControl row={row} date={date} editable={editable} />
        )}
        <span className="ml-auto shrink-0 font-mono text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
          {formatProgress(row)}
          {habit.period === "week" && (
            <span className="text-[var(--text-color-kumo-inactive)]"> wk</span>
          )}
        </span>
      </div>

      {row.target !== null && <Meter row={row} />}
    </li>
  );
}

function Meter({ row }: { row: HabitProgress }) {
  const target = row.target as number;
  const filled = Math.min(100, Math.round((row.progress / target) * 100));
  return (
    <span
      className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--color-kumo-fill)]"
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

/** Did you or didn't you — the same badge-as-button the block rows use to backfill.
 *  One click IS the decision here, so there's nothing for a Save button to confirm. */
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
  const [error, setError] = useState<string | null>(null);

  if (!editable) {
    return (
      <span className="ds-badge ds-badge--outline w-24 justify-center">
        {done ? "Done" : "—"}
      </span>
    );
  }

  return (
    <form
      action={async (fd) => {
        setError(null);
        try {
          await logHabit(fd);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not save.");
        }
      }}
    >
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
      {error && (
        <span className="ds-error mt-1 block" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}

/**
 * A number you type, saved when you say so.
 *
 * Explicitly NOT saved on blur: a half-typed "4" on the way to "45" would commit itself
 * the moment you tabbed away, and clicking off an emptied field would silently delete
 * the day's entry. Save is disabled until the value actually changes, so the button
 * doubles as the answer to "is there anything unsaved here?". Enter submits too.
 */
function CountControl({
  row,
  date,
  editable,
}: {
  row: HabitProgress;
  date: string;
  editable: boolean;
}) {
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editable) {
    return (
      <span className="font-mono text-sm tabular-nums text-[var(--text-color-kumo-inactive)]">
        {row.value === null ? "—" : trim(row.value)}
      </span>
    );
  }

  return (
    <form
      className="flex min-w-0 items-center gap-1.5"
      action={async (fd) => {
        setError(null);
        setBusy(true);
        try {
          await logHabit(fd);
          setDirty(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not save.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="habit_id" value={row.habit.id} />
      <input type="hidden" name="occurred_on" value={date} />
      <input
        name="value"
        // Uncontrolled: you are mid-type, and the server is not the authority on the
        // digits under your cursor. The key remounts it only when the STORED value
        // changes underneath — a backfill elsewhere, or this form's own revalidate.
        key={row.value ?? "empty"}
        defaultValue={row.value ?? ""}
        inputMode="decimal"
        placeholder="—"
        aria-label={`${row.habit.name}${row.habit.unit ? ` in ${row.habit.unit}` : ""}`}
        onChange={() => setDirty(true)}
        className="ds-input ds-input--sm w-16 text-right font-mono tabular-nums"
      />
      <button
        type="submit"
        disabled={!dirty || busy}
        className="ds-btn ds-btn--secondary ds-btn--sm shrink-0 disabled:cursor-default disabled:opacity-40"
      >
        {busy ? "…" : "Save"}
      </button>
      {error && (
        <span className="ds-error" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
