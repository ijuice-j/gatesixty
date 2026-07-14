import { formatMinutes, pct, type FollowThrough } from "@/lib/activity/metrics";

/**
 * The one number, and what it cost you.
 *
 * `ratio: null` means nothing was scheduled — a rest day, not a failure. It renders
 * as "—" and never as 0%, because an app that scores your rest day zero is an app
 * that punishes you for resting.
 */
export function MetricHeader({
  label,
  ft,
  compare,
  compareLabel,
}: {
  label: string;
  ft: FollowThrough;
  /** The previous period, for the delta. Omit when there's nothing to compare to. */
  compare?: FollowThrough;
  compareLabel?: string;
}) {
  const now = pct(ft.ratio);
  const before = compare ? pct(compare.ratio) : null;
  const delta = now !== null && before !== null ? now - before : null;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-[var(--color-kumo-line)] pb-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
          {label}
        </p>
        <p className="mt-1 font-mono text-5xl font-semibold leading-none tracking-tight tabular-nums">
          {now === null ? (
            <span className="text-[var(--text-color-kumo-inactive)]">—</span>
          ) : (
            <>
              {now}
              <span className="text-2xl text-[var(--text-color-kumo-subtle)]">%</span>
            </>
          )}
        </p>
        <p className="mt-1.5 text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
          {ft.plannedMin === 0 ? (
            "Nothing blocked"
          ) : (
            <>
              {formatMinutes(ft.keptMin)} kept of {formatMinutes(ft.plannedMin)} planned
              {delta !== null && (
                <>
                  {" · "}
                  <span
                    className={
                      "font-semibold " +
                      (delta >= 0
                        ? "text-[var(--text-color-kumo-success)]"
                        : "text-[var(--text-color-kumo-warning)]")
                    }
                  >
                    {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts
                  </span>
                  {compareLabel ? ` vs ${compareLabel}` : ""}
                </>
              )}
            </>
          )}
        </p>
      </div>

      <dl className="ml-auto flex gap-6 text-right">
        <div>
          <dd className="text-xl font-semibold tabular-nums text-[var(--color-kumo-success)]">
            {ft.keptCount}
          </dd>
          <dt className="text-xs uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
            Kept
          </dt>
        </div>
        <div>
          <dd className="text-xl font-semibold tabular-nums text-[var(--text-color-kumo-warning)]">
            {ft.missedCount}
          </dd>
          <dt className="text-xs uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
            Missed
          </dt>
        </div>
        <div>
          <dd className="text-xl font-semibold tabular-nums">
            {formatMinutes(ft.missedMin)}
          </dd>
          <dt className="text-xs uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
            Lost
          </dt>
        </div>
      </dl>
    </div>
  );
}
