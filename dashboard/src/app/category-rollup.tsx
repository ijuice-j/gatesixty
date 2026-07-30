import Link from "next/link";
import { formatMinutes, pct } from "@/lib/activity/metrics";
import { GOOGLE_COLORS } from "@/lib/google/calendar";
import type { CategoryRollup } from "@/lib/categories/metrics";

const HEX = new Map(GOOGLE_COLORS.map((c) => [c.id, c.hex]));

/**
 * Where the hours went, by category.
 *
 * Two numbers per row and they answer different questions, so they're drawn
 * differently on purpose. HOURS is the bar — this is a "where did my time go" table,
 * and time is the quantity, so length means minutes. FOLLOW-THROUGH is text — it's a
 * ratio, and a second bar beside the first would invite reading one length against
 * the other when they share no unit. That is the same trap the month view's habit
 * table calls out by refusing to draw its own ratio.
 */
export function CategoryRollupTable({
  rows,
  emptyHint,
}: {
  rows: CategoryRollup[];
  emptyHint: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="ds-card ds-card--bordered">
        <p className="text-base text-[var(--text-color-kumo-subtle)]">
          Nothing blocked here.
        </p>
      </div>
    );
  }

  // Scale against the biggest category, not the total: the question is which category
  // outweighs which, and a share-of-total bar makes every row short as soon as you have
  // more than a handful of them.
  const longest = Math.max(1, ...rows.map((r) => r.ft.plannedMin));

  return (
    <>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Category", "Hours", "Kept"].map((h, i) => (
              <th
                key={h}
                className={
                  "border-b border-[var(--color-kumo-line)] pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-color-kumo-subtle)] " +
                  (i === 0 ? "pr-2.5 text-left" : "text-right")
                }
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const p = pct(row.ft.ratio);
            const bad = p !== null && p < 60;
            const cell = "border-b border-[var(--color-kumo-line)] py-2.5";
            const hex = row.colorId ? HEX.get(row.colorId) : undefined;

            return (
              <tr key={row.key}>
                <td className={`${cell} pr-2.5`}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={
                        "size-2 shrink-0 rounded-full " +
                        (hex ? "" : "border border-[var(--color-kumo-line)]")
                      }
                      style={hex ? { backgroundColor: hex } : undefined}
                      aria-hidden
                    />
                    <span
                      className={
                        "truncate text-base " +
                        (hex ? "" : "text-[var(--text-color-kumo-subtle)]")
                      }
                    >
                      {row.name}
                    </span>
                  </div>
                </td>

                <td className={`${cell} whitespace-nowrap text-right`}>
                  <span className="mr-2 inline-block h-1 w-20 overflow-hidden rounded-full bg-[var(--color-kumo-fill)] align-middle">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.round((row.ft.plannedMin / longest) * 100)}%`,
                        backgroundColor: hex ?? "var(--color-kumo-fill-hover)",
                      }}
                    />
                  </span>
                  <span className="font-mono text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
                    {row.ft.plannedMin ? formatMinutes(row.ft.plannedMin) : "—"}
                  </span>
                </td>

                {/* Hours kept, then the ratio — "4h of 6h · 67%" would need two more
                    columns to stay aligned, so the ratio carries it and the tooltip
                    holds the raw minutes. */}
                <td
                  className={`${cell} whitespace-nowrap text-right text-sm tabular-nums`}
                  title={
                    p === null
                      ? "Nothing settled yet"
                      : `${formatMinutes(row.ft.keptMin)} kept of ${formatMinutes(row.ft.plannedMin)} planned`
                  }
                >
                  {p === null ? (
                    <span className="text-[var(--text-color-kumo-inactive)]">—</span>
                  ) : (
                    <span
                      className={
                        "font-mono font-semibold " +
                        (bad ? "text-[var(--text-color-kumo-warning)]" : "")
                      }
                    >
                      {p}%
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
        {emptyHint ? (
          <>
            Grouped by Google Calendar colour.{" "}
            <Link
              href="/categories"
              className="text-[var(--text-color-kumo-info)] underline"
            >
              Name your colours
            </Link>{" "}
            to split this up.
          </>
        ) : (
          <>
            Grouped by Google Calendar colour — recolour an event and its whole history
            moves with it. Upcoming blocks aren&apos;t counted, so these hours reconcile
            with the follow-through above.
          </>
        )}
      </p>
    </>
  );
}
