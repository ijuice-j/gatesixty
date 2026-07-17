"use client";

import { useState } from "react";
import { createHabit } from "./habit-actions";

/**
 * Google Calendar's own palette, mirrored from lib/google/calendar.ts, so a habit dot
 * sits beside a block dot without looking like it wandered in from another app.
 */
const COLORS = [
  "#7986CB",
  "#33B679",
  "#039BE5",
  "#8E24AA",
  "#E67C73",
  "#F6BF26",
  "#F4511E",
  "#616161",
];

/**
 * Declaring a habit, inline rather than in a modal.
 *
 * The design system reserves modals for "force a decision"; adding a habit forces
 * nothing, and this page exists for precisely this job. So the form is the page's
 * opening section, and its submit is the one emphasis button the view is allowed.
 */
export function HabitForm() {
  const [kind, setKind] = useState<"count" | "check">("count");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="ds-card ds-card--bordered"
      action={async (fd) => {
        setError(null);
        setBusy(true);
        try {
          await createHabit(fd);
          setKind("count");
          setColor(COLORS[0]);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not add that.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="color" value={color} />

      <div className="flex flex-wrap items-end gap-4">
        <div className="ds-field min-w-[200px] flex-1">
          <label className="ds-label" htmlFor="habit-name">
            Name
          </label>
          <input
            id="habit-name"
            name="name"
            required
            maxLength={80}
            placeholder="Pushups"
            className="ds-input w-full"
          />
        </div>

        <fieldset className="ds-field">
          <legend className="ds-label">Track as</legend>
          <div className="flex gap-4 pt-1.5">
            <Choice
              name="kind"
              value="count"
              checked={kind === "count"}
              onChange={() => setKind("count")}
              label="A number"
            />
            <Choice
              name="kind"
              value="check"
              checked={kind === "check"}
              onChange={() => setKind("check")}
              label="Yes or no"
            />
          </div>
        </fieldset>

        <fieldset className="ds-field">
          <legend className="ds-label">Every</legend>
          <div className="flex gap-4 pt-1.5">
            <Choice name="period" value="day" defaultChecked label="Day" />
            <Choice name="period" value="week" label="Week" />
          </div>
        </fieldset>
      </div>

      {/* Only a counted habit has a goal or a unit — a check habit's target is 1 by
          definition, and the database rejects a unit on one. */}
      {kind === "count" && (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="ds-field w-32">
            <label className="ds-label" htmlFor="habit-target">
              Target
            </label>
            <input
              id="habit-target"
              name="target"
              inputMode="decimal"
              placeholder="50"
              className="ds-input w-full font-mono tabular-nums"
            />
            <p className="ds-helper">Leave blank to track without scoring.</p>
          </div>
          <div className="ds-field w-32">
            <label className="ds-label" htmlFor="habit-unit">
              Unit
            </label>
            <input
              id="habit-unit"
              name="unit"
              maxLength={16}
              placeholder="reps"
              className="ds-input w-full"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-color-kumo-subtle)]">Colour</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              className={
                "size-5 cursor-pointer rounded-full transition " +
                (color === c
                  ? "ring-2 ring-[var(--color-kumo-focus)] ring-offset-2 ring-offset-[var(--color-kumo-base)]"
                  : "")
              }
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <button type="submit" disabled={busy} className="ds-btn ds-btn--emphasis">
          {busy ? "Adding…" : "Add habit"}
        </button>
      </div>

      {error && (
        <p className="ds-error mt-3" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function Choice({
  name,
  value,
  label,
  checked,
  defaultChecked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className="ds-choice flex cursor-pointer items-center gap-2">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className="ds-radio ds-radio--brand"
      />
      <span className="ds-choice__label text-base">{label}</span>
    </label>
  );
}
