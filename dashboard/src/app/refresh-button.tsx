"use client";

import { useTransition } from "react";
import { refreshCalendar } from "./actions";

/**
 * Fetch fresh — go back to Google now, ignoring the cache.
 *
 * The calendar is cached for five minutes because it changes rarely and re-fetching it on
 * every click was the thing making navigation slow. But "rarely" isn't "never": you'll add
 * a block in Google and want to see it here immediately. This is that escape hatch, and
 * having it is what makes the cache safe to have at all.
 */
export function RefreshButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="ds-btn ds-btn--ghost ds-btn--sm"
      disabled={pending}
      title="Re-read your Google Calendar now, ignoring the 5-minute cache"
      onClick={() => startTransition(() => refreshCalendar())}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
        className={pending ? "motion-safe:animate-spin" : ""}
      >
        <path
          d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M13.5 2v3h-3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {pending ? "Fetching…" : "Fetch fresh"}
    </button>
  );
}
