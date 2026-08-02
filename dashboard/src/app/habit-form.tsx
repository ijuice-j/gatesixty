"use client";

import { useState } from "react";
import { createHabit } from "./habit-actions";
import { COLORS, ColorPicker } from "./habit-colors";

/**
 * Declaring a habit, inline rather than in a modal.
 *
 * The design system reserves modals for "force a decision"; adding a habit forces
 * nothing, and this page exists for precisely this job. So the form is the page's
 * opening section, and its submit is the one emphasis button the view is allowed.
 *
 * Everything lays out on a GRID rather than a flex row. `.ds-field` is itself
 * `display: grid`, so flexing a row of them and aligning the ends lines each field up by
 * its LAST child — and a field carrying helper text has one more child than one that
 * doesn't. That put Target's helper level with Unit's input and knocked the two boxes a
 * row out of step. Grid cells share rows by construction, so it can't drift again.
 */
/** The three repetition modes. "day" and "weekdays" are both `period='day'` underneath —
 *  the day is the unit of judgment either way — differing only in which weekdays count. */
type Mode = "day" | "weekdays" | "week";

export function HabitForm() {
  const [kind, setKind] = useState<"count" | "check">("count");
  const [mode, setMode] = useState<Mode>("day");
  const [days, setDays] = useState<number[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needsDays = mode === "weekdays" && days.length === 0;

  return (
    <form
      className="ds-card ds-card--bordered"
      action={async (fd) => {
        setError(null);
        setBusy(true);
        try {
          await createHabit(fd);
          setKind("count");
          setMode("day");
          setDays([]);
          setColor(COLORS[0]);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not add that.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="color" value={color} />
      {/* Two UI modes collapse to one period: the day is the unit for both "Day" and
          "Certain days". `weekdays` is what tells them apart, server-side. */}
      <input type="hidden" name="period" value={mode === "week" ? "week" : "day"} />
      <input type="hidden" name="weekdays" value={mode === "weekdays" ? days.join(",") : ""} />

      <div className="grid gap-5">
        <div className="ds-field max-w-lg">
          <label className="ds-label" htmlFor="habit-name">
            Name
          </label>
          <input
            id="habit-name"
            name="name"
            required
            maxLength={80}
            placeholder="Pushups"
            className="ds-input"
          />
        </div>

        <div className="grid max-w-lg gap-5 sm:grid-cols-2">
          <RadioField
            label="Track as"
            name="kind"
            value={kind}
            onChange={(v) => setKind(v as "count" | "check")}
            options={[
              { value: "count", label: "A number" },
              { value: "check", label: "Yes or no" },
            ]}
          />
          <RadioField
            label="Repeat"
            name="mode"
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { value: "day", label: "Day" },
              { value: "weekdays", label: "Certain days" },
              { value: "week", label: "Week" },
            ]}
          />
        </div>

        {/* Only when the schedule is specific weekdays. A weekly quota schedules by the
            week, and a plain daily habit is every day — neither needs a day picker. */}
        {mode === "weekdays" && (
          <div className="ds-field max-w-lg">
            <span className="ds-label">On</span>
            <WeekdayPicker value={days} onChange={setDays} />
            <p className="ds-helper">
              Picked days are scheduled; the rest are off — not misses. Fixed once added.
            </p>
          </div>
        )}

        {/* Only a counted habit has a goal or a unit — a check habit's target is 1 by
            definition, and the database rejects a unit on one. */}
        {kind === "count" && (
          <div className="grid max-w-lg gap-x-5 gap-y-2.5 sm:grid-cols-2">
            <div className="ds-field">
              <label className="ds-label" htmlFor="habit-target">
                Target
              </label>
              <input
                id="habit-target"
                name="target"
                inputMode="decimal"
                placeholder="50"
                className="ds-input font-mono tabular-nums"
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="habit-unit">
                Unit
              </label>
              <input
                id="habit-unit"
                name="unit"
                maxLength={16}
                placeholder="reps"
                className="ds-input"
              />
            </div>
            {/* Its own full-width cell — inside a field it would lengthen that field and
                shove its neighbour out of alignment. */}
            <p className="ds-helper sm:col-span-2">
              Leave the target blank to track it without ever scoring it.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-[var(--color-kumo-line)] pt-5">
        <ColorPicker value={color} onChange={setColor} />

        <button
          type="submit"
          disabled={busy || needsDays}
          className="ds-btn ds-btn--emphasis"
        >
          {busy ? "Adding…" : needsDays ? "Pick a day" : "Add habit"}
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

/** Mon-first, matching lib/time weekdayIndex (0=Mon … 6=Sun). Two Sundays would confuse,
 *  so the labels carry the full name in the aria-label. */
const WEEKDAYS = [
  { i: 0, short: "M", name: "Monday" },
  { i: 1, short: "T", name: "Tuesday" },
  { i: 2, short: "W", name: "Wednesday" },
  { i: 3, short: "T", name: "Thursday" },
  { i: 4, short: "F", name: "Friday" },
  { i: 5, short: "S", name: "Saturday" },
  { i: 6, short: "S", name: "Sunday" },
];

/**
 * Seven toggles for the weekdays a habit repeats on — the ColorPicker pattern, one button
 * per day, `aria-pressed` carrying the state. The selection is a set; order doesn't matter
 * and the metrics sort it for display.
 */
function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (i: number) =>
    onChange(value.includes(i) ? value.filter((d) => d !== i) : [...value, i]);

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Repeat on">
      {WEEKDAYS.map(({ i, short, name }) => {
        const on = value.includes(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            aria-label={name}
            aria-pressed={on}
            className={
              "size-10 rounded-full text-sm font-medium tabular-nums transition " +
              (on
                ? "bg-[var(--color-kumo-brand)] text-[var(--text-color-kumo-inverse)]"
                : "bg-[var(--color-kumo-fill)] text-[var(--text-color-kumo-subtle)] hover:bg-[var(--color-kumo-fill-hover)]")
            }
          >
            {short}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A labelled set of radios that occupies the same two grid rows as a `.ds-field` — label
 * on top, control beneath — so it lines up with the inputs beside it.
 *
 * A <fieldset>/<legend> would be the textbook markup, but a legend inside a grid
 * container lays out as neither a grid item nor a normal box. role="radiogroup" over a
 * plain div gets the same thing to a screen reader without the layout surprise.
 */
function RadioField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="ds-field" role="radiogroup" aria-label={label}>
      <span className="ds-label">{label}</span>
      <div className="ds-radio-group flex h-10 items-center gap-5">
        {options.map((o) => (
          <label key={o.value} className="ds-choice">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="ds-radio ds-radio--brand"
            />
            <span className="ds-choice__label text-base">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
