"use client";

/**
 * Google Calendar's own palette, mirrored from lib/google/calendar.ts, so a habit dot
 * sits beside a block dot without looking like it wandered in from another app.
 */
export const COLORS = [
  "#7986CB",
  "#33B679",
  "#039BE5",
  "#8E24AA",
  "#E67C73",
  "#F6BF26",
  "#F4511E",
  "#616161",
];

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm text-[var(--text-color-kumo-subtle)]">Colour</span>
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Colour ${c}`}
          aria-pressed={value === c}
          className={
            "size-6 cursor-pointer rounded-full transition " +
            (value === c
              ? "ring-2 ring-[var(--color-kumo-focus)] ring-offset-2 ring-offset-[var(--color-kumo-base)]"
              : "")
          }
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
