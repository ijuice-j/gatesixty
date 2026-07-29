"use client";

import { useEffect } from "react";

export type SnackTone = "success" | "danger";

/**
 * A transient message pinned to the bottom of the viewport.
 *
 * Built on `.ds-banner` rather than a new look: the design system has no toast recipe,
 * and inventing one would put a second visual language for "something went wrong" beside
 * the banners the review pages already use.
 *
 * Success auto-dismisses; failure does NOT. An error you can miss by looking away is an
 * error that gets reported as "the button does nothing" — the whole point of showing it
 * is that the fetch did not happen and you need to know. It stays until dismissed.
 */
export function Snackbar({
  tone,
  message,
  action,
  onDismiss,
}: {
  tone: SnackTone;
  message: string;
  action?: React.ReactNode;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (tone !== "success") return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [tone, message, onDismiss]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"
      // Announced politely: this narrates the result of something you just did, so it
      // should not interrupt a screen reader mid-sentence.
      role="status"
      aria-live="polite"
    >
      <div
        className={
          "ds-banner pointer-events-auto max-w-xl shadow-lg " +
          (tone === "success" ? "ds-banner--success" : "ds-banner--danger")
        }
      >
        <div className="ds-banner__content">{message}</div>
        <div className="ds-banner__actions flex items-center gap-2">
          {action}
          <button
            type="button"
            className="ds-btn ds-btn--ghost ds-btn--sm"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
