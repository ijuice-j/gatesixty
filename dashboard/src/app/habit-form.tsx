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
export function HabitForm() {
  const [kind, setKind] = useState<"count" | "check">("count");
  const [period, setPeriod] = useState<"day" | "week">("day");
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
          setPeriod("day");
          setColor(COLORS[0]);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not add that.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="color" value={color} />

      <div className="grid gap-4">
        <div className="ds-field max-w-md">
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

        <div className="grid max-w-md gap-4 sm:grid-cols-2">
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
            label="Every"
            name="period"
            value={period}
            onChange={(v) => setPeriod(v as "day" | "week")}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
            ]}
          />
        </div>

        {/* Only a counted habit has a goal or a unit — a check habit's target is 1 by
            definition, and the database rejects a unit on one. */}
        {kind === "count" && (
          <div className="grid max-w-md gap-x-4 gap-y-2 sm:grid-cols-2">
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

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-kumo-line)] pt-4">
        <ColorPicker value={color} onChange={setColor} />

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
      <div className="ds-radio-group flex h-9 items-center gap-4">
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
