"use client";

import { useCallback, useState, useSyncExternalStore, useTransition } from "react";
import { refreshCalendar } from "./actions";
import { Snackbar, type SnackTone } from "./snackbar";

/** "just now" · "4m ago" · "2h ago". Coarse on purpose — the cache TTL is five minutes,
 *  so second-level precision would be noise dressed up as information. */
function ago(from: number, now: number): string {
  const s = Math.max(0, Math.round((now - from) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// The clock, as an external store.
//
// The label needs "now", which is neither a prop nor state — it's a mutable value
// outside React that changes on its own, which is exactly what useSyncExternalStore is
// for. Doing it with useState+useEffect instead means setting state in an effect on
// mount, which React's lint rightly rejects as a cascading render.
//
// getServerSnapshot returns null so the SERVER renders no label at all. The two clocks
// disagree by however long the response took, so a server-rendered "just now" against a
// client-rendered "1m ago" is a hydration mismatch — over a label that is decoration.
// ---------------------------------------------------------------------------

const TICK_MS = 30_000;

function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}

/** Bucketed, and it has to be: getSnapshot must return a stable value between ticks or
 *  React re-renders forever chasing a number that changes on every read. */
const clockTick = () => Math.floor(Date.now() / TICK_MS);
const noClockOnServer = () => null;

/**
 * Fetch fresh — go back to Google now, ignoring the cache.
 *
 * The calendar is cached for five minutes because it changes rarely and re-fetching it on
 * every click was the thing making navigation slow. But "rarely" isn't "never": you'll add
 * a block in Google and want to see it here immediately. This is that escape hatch, and
 * having it is what makes the cache safe to have at all.
 *
 * `fetchedAt` says how stale the thing you're reading is — the question the cache creates
 * and previously left unanswered. Without it, "Fetch fresh" is a button you press on faith.
 */
export function RefreshButton({ fetchedAt }: { fetchedAt: number | null }) {
  const [pending, startTransition] = useTransition();
  const [snack, setSnack] = useState<{
    tone: SnackTone;
    message: string;
    reconnect?: boolean;
  } | null>(null);

  // Only what THIS button achieved. The displayed value is derived below rather than
  // synced from the prop by an effect: a server re-render brings a fresh `fetchedAt`, and
  // whichever of the two is newer wins. No effect, no stale-state window.
  const [justFetchedAt, setJustFetchedAt] = useState<number | null>(null);

  const tick = useSyncExternalStore(subscribeToClock, clockTick, noClockOnServer);
  const now = tick === null ? null : tick * TICK_MS;

  const at =
    justFetchedAt !== null && (fetchedAt === null || justFetchedAt > fetchedAt)
      ? justFetchedAt
      : fetchedAt;

  const dismiss = useCallback(() => setSnack(null), []);

  const run = () => {
    setSnack(null);
    startTransition(async () => {
      // Read from the URL at click time rather than useSearchParams(): this only decides
      // which month gets probed, and reading it here keeps the component out of Suspense
      // and hydration concerns entirely.
      const date = new URLSearchParams(window.location.search).get("date") ?? undefined;
      const res = await refreshCalendar(date);

      if (res.ok) {
        setJustFetchedAt(res.fetchedAt);
        setSnack({ tone: "success", message: "Calendar updated." });
      } else {
        setSnack({ tone: "danger", message: res.message, reconnect: res.reconnect });
      }
    });
  };

  // `now` is up to TICK_MS stale, so a just-set `at` can sit slightly in the future.
  // ago() clamps at zero, which reads as "just now" — the right answer anyway.
  const label = at !== null && now !== null ? ago(at, now) : null;

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Hidden below sm: the header is tight on a phone and the button is the point. */}
        {label && (
          <span
            className="hidden text-sm tabular-nums text-[var(--text-color-kumo-inactive)] sm:inline"
            title={`Last fetched from Google at ${new Date(at as number).toLocaleString()}`}
          >
            {label}
          </span>
        )}
        <button
          type="button"
          className="ds-btn ds-btn--ghost ds-btn--sm"
          disabled={pending}
          title="Re-read your Google Calendar now, ignoring the 5-minute cache"
          onClick={run}
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
      </div>

      {/* Rendered unconditionally — see Snackbar: the live region has to already be in
          the DOM for its text to be announced when it arrives. */}
      <Snackbar
        tone={snack?.tone ?? "success"}
        message={snack?.message ?? null}
        onDismiss={dismiss}
        action={
          snack?.reconnect ? (
            <form action="/auth/signout" method="post">
              <button className="ds-btn ds-btn--outline ds-btn--sm" type="submit">
                Reconnect
              </button>
            </form>
          ) : undefined
        }
      />
    </>
  );
}
