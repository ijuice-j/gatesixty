"use client";

import { useRef } from "react";
import { saveCategory } from "./category-actions";

/**
 * One colour, one name box.
 *
 * Save-on-blur rather than a button per row: eleven rows with eleven Save buttons is a
 * form you have to operate, and this is a list you edit. The submit fires only when the
 * value actually CHANGED — otherwise tabbing down the list would post eleven writes and
 * revalidate the review pages eleven times, for nothing.
 */
export function CategoryRow({
  colorId,
  hex,
  googleName,
  name,
}: {
  colorId: string;
  hex: string;
  googleName: string;
  name: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const initial = useRef(name);

  return (
    <form
      ref={formRef}
      action={saveCategory}
      className="flex h-12 items-center gap-3.5 px-3.5"
    >
      <input type="hidden" name="color_id" value={colorId} />

      <span
        className="size-3.5 shrink-0 rounded-full"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <span className="w-24 shrink-0 truncate text-sm text-[var(--text-color-kumo-subtle)]">
        {googleName}
      </span>

      <input
        name="name"
        defaultValue={name}
        maxLength={40}
        placeholder="Unnamed — not a category yet"
        aria-label={`Category name for ${googleName}`}
        className="ds-input ds-input--sm min-w-0 flex-1"
        onBlur={(e) => {
          const next = e.currentTarget.value.trim();
          if (next === initial.current) return;
          initial.current = next;
          formRef.current?.requestSubmit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur(); // blur does the save, so Enter and tab agree
          }
        }}
      />
    </form>
  );
}
