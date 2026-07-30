"use client";

import { useState } from "react";
import { trim, formatWeekdays } from "@/lib/habits/metrics";
import type { Habit } from "@/lib/habits/types";
import { ColorPicker } from "./habit-colors";
import { updateHabit, setHabitArchived } from "./habit-actions";

/** "50 reps / day" · "yes or no · Mon Wed Fri" · "3 / week" · "tracked only" */
function describe(h: Habit): string {
  const per = h.weekdays ? `· ${formatWeekdays(h.weekdays)}` : `/ ${h.period}`;
  if (h.kind === "check") return `yes or no ${per}`;
  if (h.target === null) return "tracked only";
  return `${trim(h.target)}${h.unit ? ` ${h.unit}` : ""} ${per}`;
}

/** "a number, every day" · "a number, on Mon Wed Fri" — what can't be edited, said plainly. */
function measuredAs(h: Habit): string {
  const what = h.kind === "check" ? "Yes or no" : "A number";
  return h.weekdays ? `${what}, on ${formatWeekdays(h.weekdays)}` : `${what}, every ${h.period}`;
}

export function HabitRow({ habit, archived }: { habit: Habit; archived: boolean }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="p-3.5">
        <EditForm habit={habit} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex h-12 items-center gap-3.5 px-3.5">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: habit.color }}
        aria-hidden
      />
      <span
        className={
          "truncate text-base font-medium " +
          (archived ? "text-[var(--text-color-kumo-inactive)]" : "")
        }
      >
        {habit.name}
      </span>

      <span className="ml-auto shrink-0 font-mono text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
        {describe(habit)}
      </span>

      {!archived && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ds-btn ds-btn--ghost ds-btn--sm shrink-0"
        >
          Edit
        </button>
      )}

      <form action={setHabitArchived} className="shrink-0">
        <input type="hidden" name="habit_id" value={habit.id} />
        <input type="hidden" name="archived" value={String(!archived)} />
        <button type="submit" className="ds-btn ds-btn--ghost ds-btn--sm">
          {archived ? "Restore" : "Archive"}
        </button>
      </form>
    </li>
  );
}

function EditForm({ habit, onDone }: { habit: Habit; onDone: () => void }) {
  const [color, setColor] = useState(habit.color);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      action={async (fd) => {
        setError(null);
        setBusy(true);
        try {
          await updateHabit(fd);
          onDone();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not save.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="habit_id" value={habit.id} />
      <input type="hidden" name="color" value={color} />

      <div className="grid max-w-md gap-x-4 gap-y-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="ds-field">
          <label className="ds-label" htmlFor={`name-${habit.id}`}>
            Name
          </label>
          <input
            id={`name-${habit.id}`}
            name="name"
            required
            maxLength={80}
            defaultValue={habit.name}
            className="ds-input"
          />
        </div>

        {/* A check habit's target is 1 by definition and the DB rejects a unit on one —
            so there is nothing here to offer. */}
        {habit.kind === "count" && (
          <>
            <div className="ds-field w-24">
              <label className="ds-label" htmlFor={`target-${habit.id}`}>
                Target
              </label>
              <input
                id={`target-${habit.id}`}
                name="target"
                inputMode="decimal"
                placeholder="50"
                defaultValue={habit.target === null ? "" : trim(habit.target)}
                className="ds-input font-mono tabular-nums"
              />
            </div>
            <div className="ds-field w-24">
              <label className="ds-label" htmlFor={`unit-${habit.id}`}>
                Unit
              </label>
              <input
                id={`unit-${habit.id}`}
                name="unit"
                maxLength={16}
                placeholder="reps"
                defaultValue={habit.unit ?? ""}
                className="ds-input"
              />
            </div>
            <p className="ds-helper sm:col-span-3">
              Blank target = tracked, never scored. Changing it re-scores today, but leaves
              settled days judged by the goal they were logged under.
            </p>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDone}
            className="ds-btn ds-btn--ghost ds-btn--sm"
          >
            Cancel
          </button>
          <button type="submit" disabled={busy} className="ds-btn ds-btn--secondary ds-btn--sm">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Kind and period decide what a logged value MEANS, so they aren't editable —
          say why rather than just leaving them out. */}
      <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
        {measuredAs(habit)} — archive and add a new one to change that. Old entries stay
        readable under the terms they were recorded.
      </p>

      {error && (
        <p className="ds-error mt-2" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
