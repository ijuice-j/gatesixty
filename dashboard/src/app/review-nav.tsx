"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ZOOMS = [
  { href: "/", label: "Day" },
  { href: "/week", label: "Week" },
  { href: "/month", label: "Month" },
] as const;

/**
 * Day / Week / Month is a ZOOM level, not a destination — it's the same question
 * at three resolutions. So it reads as a segmented control, not as sidebar nav.
 */
export function ZoomNav({ date }: { date?: string }) {
  const pathname = usePathname();
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
