/**
 * Shown the instant you click, while the server renders.
 *
 * Before this, a navigation just froze the page: no spinner, no skeleton, nothing — the UI
 * sat there until Supabase and Google both answered. Even 300ms of that reads as "broken".
 * Next swaps this in immediately, and because the shell now lives in the layout, only the
 * content region changes — the sidebar, header and zoom control never move.
 *
 * The shapes deliberately match the real thing (metric block, toolbar, rows), so the swap
 * lands without a jolt.
 */
export default function Loading() {
  return (
    <div className="w-full max-w-5xl px-6 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* date nav */}
      <div className="mb-4 flex items-center gap-1.5">
        <Bar className="h-8 w-8" />
        <Bar className="h-8 w-8" />
        <Bar className="ml-1.5 h-5 w-28" />
      </div>

      {/* the metric */}
      <div className="mb-4 flex items-end gap-8 border-b border-[var(--color-kumo-line)] pb-5">
        <div>
          <Bar className="h-3 w-40" />
          <Bar className="mt-2 h-12 w-32" />
          <Bar className="mt-2 h-4 w-56" />
        </div>
        <div className="ml-auto flex gap-6">
          <Bar className="h-10 w-12" />
          <Bar className="h-10 w-12" />
          <Bar className="h-10 w-16" />
        </div>
      </div>

      {/* toolbar */}
      <div className="mb-3 flex items-center gap-3">
        <Bar className="h-7 w-44" />
      </div>

      {/* rows */}
      <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
        <ul className="divide-y divide-[var(--color-kumo-line)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex h-12 items-center gap-3.5 px-3.5">
              <Bar className="size-2 rounded-full" />
              <Bar className="h-4 flex-1 max-w-[220px]" />
              <Bar className="ml-auto hidden h-1.5 w-[132px] sm:block" />
              <Bar className="hidden h-4 w-[92px] md:block" />
              <Bar className="h-6 w-24 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** One shimmering placeholder. `motion-safe` so a reduced-motion viewer just gets a still block. */
function Bar({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "block rounded bg-[var(--color-kumo-fill)] motion-safe:animate-pulse " + className
      }
      aria-hidden
    />
  );
}
