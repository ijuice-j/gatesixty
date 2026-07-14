"use client";

import { useState } from "react";
import type { DayItem, DayStatus } from "@/lib/activity/day";
import { durationMin, formatMinutes } from "@/lib/activity/metrics";
import { toggleDone } from "./actions";

const LABEL: Record<DayStatus, string> = {
  done: "Kept",
  not_done: "Missed",
  upcoming: "Upcoming",
};

type Filter = "all" | "not_done" | "done";

const FILTERS: { k: Filter; label: string }[] = [
  { k: "all", label: "All" },
  { k: "not_done", label: "Missed" },
  { k: "done", label: "Kept" },
];

/**
 * The event is the subject — Google Calendar already renders the time grid, and
 * better. So duration is a COLUMN, not a geometry: the bar is proportional to the
 * longest block of the day, which is what keeps a 3-hour deep-work block visibly
 * outweighing a 15-minute standup. That weight is the one thing a flat list threw
 * away, and it's exactly what the follow-through number is made of.
 */
export function DayList({
  items,
  date,
  tz,
}: {
  items: DayItem[];
  date: string;
  tz: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const longest = Math.max(1, ...items.map((i) => durationMin(i)));
  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <>
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex gap-0.5 rounded-lg bg-[var(--color-kumo-recessed)] p-0.5"
          role="tablist"
          aria-label="Filter blocks"
        >
          {FILTERS.map((f) => (
            <button
              key={f.k}
              type="button"
              role="tab"
              aria-selected={filter === f.k}
              onClick={() => setFilter(f.k)}
              className={
                "h-6 cursor-pointer rounded-md px-2.5 text-sm transition " +
                (filter === f.k
                  ? "bg-[var(--color-kumo-base)] font-medium text-[var(--text-color-kumo-default)] shadow-sm"
                  : "text-[var(--text-color-kumo-subtle)] hover:text-[var(--text-color-kumo-default)]")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm tabular-nums text-[var(--text-color-kumo-inactive)]">
          {shown.length} {filter === "all" ? "blocks" : LABEL[filter].toLowerCase()}
        </span>
      </div>

      <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
        {shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-base text-[var(--text-color-kumo-subtle)]">
            Nothing here.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-kumo-line)]">
            {shown.map((item) => (
              <Row key={item.id} item={item} date={date} tz={tz} longest={longest} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Row({
  item,
  date,
  tz,
  longest,
}: {
  item: DayItem;
  date: string;
  tz: string;
  longest: number;
}) {
  const min = durationMin(item);
  const missed = item.status === "not_done";
  const soon = item.status === "upcoming";

  return (
    <li
      className={
        "flex h-12 items-center gap-3.5 border-l-[3px] pr-3.5 transition " +
        (missed
          ? "border-l-[var(--color-kumo-warning)] bg-[color-mix(in_oklab,var(--color-kumo-warning-tint)_55%,transparent)] hover:bg-[var(--color-kumo-warning-tint)]"
          : "border-l-transparent hover:bg-[var(--color-kumo-fill-hover)]")
      }
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-3.5">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
          aria-hidden
        />
        <span
          className={
            "truncate text-base font-medium " +
            (soon ? "text-[var(--text-color-kumo-inactive)]" : "")
          }
        >
          {item.title}
        </span>
      </div>

      {/* Duration, weighted — the whole reason the metric counts hours. */}
      <div className="hidden w-[132px] shrink-0 items-center gap-2.5 sm:flex">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-kumo-fill)]">
          <span
            className="block h-full rounded-full"
            style={{
              width: `${Math.round((min / longest) * 100)}%`,
              backgroundColor: missed
                ? "var(--color-kumo-warning)"
                : soon
                  ? "var(--color-kumo-interact)"
                  : item.color,
            }}
          />
        </span>
        <span className="w-11 shrink-0 text-right font-mono text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
          {min ? formatMinutes(min) : "—"}
        </span>
      </div>

      <span className="hidden w-[112px] shrink-0 whitespace-nowrap font-mono text-sm tabular-nums text-[var(--text-color-kumo-subtle)] md:block">
        {window(item.start, item.end, tz)}
      </span>

      <StatusPill item={item} date={date} />
    </li>
  );
}

/**
 * Backfill, deliberately demoted. The tablet owns capture — flip clock, one tap,
 * in the moment. This is the "I forgot to tap it" escape hatch, so it's a quiet
 * pill and not the hero of the row.
 */
function StatusPill({ item, date }: { item: DayItem; date: string }) {
  if (item.status === "upcoming") {
    return (
      <span className="ds-badge ds-badge--outline w-24 shrink-0 justify-center">
        {LABEL.upcoming}
      </span>
    );
  }

  const makeDone = item.status !== "done";
  return (
    <form action={toggleDone} className="shrink-0">
      <input type="hidden" name="gcal_event_id" value={item.id} />
      <input type="hidden" name="occurred_on" value={date} />
      <input type="hidden" name="make_done" value={String(makeDone)} />
      <input type="hidden" name="title" value={item.title} />
      <input type="hidden" name="planned_start" value={item.start ?? ""} />
      <input type="hidden" name="planned_end" value={item.end ?? ""} />
      <input type="hidden" name="color" value={item.color} />
      <button
        type="submit"
        title={makeDone ? "Mark kept" : "Mark not kept"}
        aria-label={makeDone ? "Mark kept" : "Mark not kept"}
        className={
          "ds-badge ds-badge--subtle w-24 cursor-pointer justify-center " +
          (makeDone ? "ds-badge--warning" : "ds-badge--success")
        }
      >
        {LABEL[item.status]}
      </button>
    </form>
  );
}

function window(start: string | null, end: string | null, tz: string): string {
  if (!start || !end) return "—";
  const fmt = (s: string) =>
    new Date(s)
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: tz,
      })
      .replace(" ", "")
      .toLowerCase();
  return `${fmt(start)}–${fmt(end)}`;
}
