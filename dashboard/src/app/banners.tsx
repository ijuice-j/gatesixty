"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Shared by day / week / month — all three reconstruct from the live calendar. */

export function ReconnectBanner({ what }: { what: string }) {
  return (
    <div className="ds-banner ds-banner--warning mb-4">
      <div className="ds-banner__content">
        Reconnect Google to reconstruct {what}.
      </div>
      <div className="ds-banner__actions">
        <form action="/auth/signout" method="post">
          <button className="ds-btn ds-btn--outline ds-btn--sm" type="submit">
            Reconnect
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * A failed calendar read is almost always a transient network blip — the fetch is
 * already retried three times before it gets here — so the useful thing to offer is
 * one more go, not a wall of text. `router.refresh()` re-runs the server render
 * without losing the page, so the whole view repopulates in place.
 */
export function LoadErrorBanner({ message }: { message: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tries, setTries] = useState(0);

  return (
    <div className="ds-banner ds-banner--danger mb-4">
      <div className="ds-banner__content">
        {message}
        {tries > 0 && !pending && (
          <span className="text-[var(--text-color-kumo-subtle)]">
            {" "}
            Still failing after {tries + 3} attempts.
          </span>
        )}
      </div>
      <div className="ds-banner__actions">
        <button
          type="button"
          className="ds-btn ds-btn--outline ds-btn--sm"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              setTries((n) => n + 1);
              router.refresh();
            })
          }
        >
          {pending ? "Retrying…" : "Try again"}
        </button>
      </div>
    </div>
  );
}
