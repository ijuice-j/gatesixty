"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const ZOOMS = [
  { href: "/", label: "Day" },
  { href: "/week", label: "Week" },
  { href: "/month", label: "Month" },
] as const;

/**
 * Day / Week / Month is a ZOOM level, not a destination — it's the same question
 * at three resolutions. So it reads as a segmented control, not as sidebar nav.
 *
 * It reads `?date` itself rather than taking it as a prop, because it's rendered from the
 * layout — and a layout cannot see searchParams. Carrying the date across a zoom switch is
 * what makes Day → Week land on the week containing the day you were looking at, instead of
 * silently jumping you back to today.
 */
export function ZoomNav() {
  const pathname = usePathname();
  const date = useSearchParams().get("date") ?? undefined;
  const q = date ? `?date=${date}` : "";

  return (
    <div
      className="flex gap-0.5 rounded-lg bg-[var(--color-kumo-recessed)] p-0.5"
      role="tablist"
      aria-label="Zoom level"
    >
      {ZOOMS.map((z) => {
        const active = pathname === z.href;
        return (
          <Link
            key={z.href}
            href={`${z.href}${q}`}
            role="tab"
            aria-selected={active}
            className={
              "flex h-7 items-center rounded-md px-3 text-sm transition " +
              (active
                ? "bg-[var(--color-kumo-base)] font-medium text-[var(--text-color-kumo-default)] shadow-sm"
                : "text-[var(--text-color-kumo-subtle)] hover:text-[var(--text-color-kumo-default)]")
            }
          >
            {z.label}
          </Link>
        );
      })}
    </div>
  );
}
