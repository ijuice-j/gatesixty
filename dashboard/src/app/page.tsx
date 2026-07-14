import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listCalendarEvents, GoogleAuthExpiredError } from "@/lib/google/calendar";
import { reconstructDay, type DayItem, type DayStatus } from "@/lib/activity/day";
import { zonedDayRange, dateStringInTz, shiftDate, resolveViewerTimeZone } from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "./timezone-sync";
import { AppShell } from "./shell";
import { toggleDone } from "./actions";

// Reconstruction reads the live calendar per request — never cache.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  // `rawTz` is a user-settable cookie; resolveViewerTimeZone validates it (an
  // invalid zone would otherwise throw RangeError out of every Intl call). Until
  // it's resolved we skip the calendar fetch and let <TimezoneSync> report the
  // real zone, so the day is fetched once (for the right day) not twice.
  const { tz, resolved: tzResolved } = resolveViewerTimeZone(
    cookieStore.get("tz")?.value,
  );

  if (!tzResolved) {
    return (
      <AppShell email={user.email} title="Activity">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <TimezoneSync current={tz} resolved={false} />
          <p className="text-sm text-[var(--text-color-kumo-subtle)]">Loading your day…</p>
        </div>
      </AppShell>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? (dateParam as string)
    : today;
  const dayWindow = zonedDayRange(date, tz);

  // The Google refresh token (missing for anyone who signed in before this
  // feature shipped) and the day's done rows.
  const [{ data: cred }, { data: logData }] = await Promise.all([
    supabase
      .from("google_credentials")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("activity_logs")
      .select(
        "gcal_event_id, title, done, occurred_on, planned_start, planned_end, color, ended_at",
      )
      .eq("occurred_on", date),
  ]);
  const logs = (logData ?? []) as ActivityLog[];

  let items: DayItem[] = [];
  let needsReconnect = !cred?.refresh_token;
  let loadError: string | null = null;

  if (cred?.refresh_token) {
    try {
      const events = await listCalendarEvents(
        cred.refresh_token,
        dayWindow.start,
        dayWindow.end,
      );
      items = reconstructDay(events, logs, new Date(), dayWindow);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) needsReconnect = true;
      else loadError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  } else if (logs.length) {
    // No calendar access, but recorded done rows can still show.
    items = reconstructDay([], logs, new Date(), dayWindow);
  }

  const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const done = items.filter((i) => i.status === "done").length;

  return (
    <AppShell
      email={user.email}
      title="Activity"
      actions={
        items.length > 0 ? (
          <span className="ds-badge ds-badge--subtle ds-badge--neutral tabular-nums">
            {done}/{items.length} done
          </span>
        ) : undefined
      }
    >
      <div className="w-full max-w-5xl px-6 py-6">
        <TimezoneSync current={tz} resolved />

        <div className="mb-4 flex items-center gap-1.5">
          <Link
            href={`/?date=${shiftDate(date, -1)}`}
            className="ds-btn ds-btn--secondary ds-btn--sm"
            aria-label="Previous day"
          >
            ‹
          </Link>
          <Link
            href={`/?date=${shiftDate(date, 1)}`}
            className="ds-btn ds-btn--secondary ds-btn--sm"
            aria-label="Next day"
          >
            ›
          </Link>
          <h2 className="ml-1.5 text-base font-medium tabular-nums">{dateLabel}</h2>
          {date !== today && (
            <Link href="/" className="ds-btn ds-btn--ghost ds-btn--sm ml-1">
              Today
            </Link>
          )}
        </div>

        {needsReconnect && (
          <div className="ds-banner ds-banner--warning mb-4">
            <div className="ds-banner__content">
              Reconnect Google to reconstruct this day.
            </div>
            <div className="ds-banner__actions">
              <form action="/auth/signout" method="post">
                <button className="ds-btn ds-btn--outline ds-btn--sm" type="submit">
                  Reconnect
                </button>
              </form>
            </div>
          </div>
        )}

        {loadError && (
          <div className="ds-banner ds-banner--danger mb-4">
            <div className="ds-banner__content">Failed to load activity: {loadError}</div>
          </div>
        )}

        {!needsReconnect && !loadError && items.length === 0 && (
          <div className="ds-card ds-card--bordered">
            <p className="text-base text-[var(--text-color-kumo-subtle)]">
              No timed events on this day.
            </p>
          </div>
        )}

        {/* One bordered panel, hairline-separated rows — the target's list pattern.
            p-0 beats the recipe's p-6 because the recipes sit in @layer components. */}
        {items.length > 0 && (
          <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
            <ul className="divide-y divide-[var(--color-kumo-line)]">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex h-12 flex-row items-center gap-3 px-4 hover:bg-[var(--color-kumo-fill-hover)]"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-base font-medium">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-[var(--text-color-kumo-subtle)]">
                    {formatWindow(item.start, item.end, tz)}
                  </span>
                  <StatusControl item={item} date={date} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// Outcome → the badge intent that carries it. `not_done` is a warning, not a danger: a missed
// event is a fact to notice, not an error to alarm about.
//
// success/warning `--subtle` resolve to real tint fills. neutral's tint is deliberately
// color-mix(… 15%, transparent) — near-invisible on the dark canvas, which reads as unfinished
// beside two solid pills. `--outline` keeps "upcoming" low-emphasis but still a pill.
const STATUS_BADGE: Record<DayStatus, string> = {
  done: "ds-badge--subtle ds-badge--success",
  not_done: "ds-badge--subtle ds-badge--warning",
  upcoming: "ds-badge--outline",
};
const STATUS_LABEL: Record<DayStatus, string> = {
  done: "Done",
  not_done: "Missed",
  upcoming: "Upcoming",
};

/**
 * The status pill. For past events (done / not_done) it's a toggle button that
 * backfills or clears the ledger row; upcoming events have no outcome yet, so
 * they render as a static pill.
 */
function StatusControl({ item, date }: { item: DayItem; date: string }) {
  if (item.status === "upcoming") {
    return (
      <span className={`ds-badge w-24 shrink-0 justify-center ${STATUS_BADGE.upcoming}`}>
        {STATUS_LABEL.upcoming}
      </span>
    );
  }

  const makeDone = item.status !== "done"; // clicking flips the outcome
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
        aria-label={makeDone ? "Mark done" : "Mark not done"}
        title={makeDone ? "Mark done" : "Mark not done"}
        className={`ds-badge w-24 cursor-pointer justify-center ${STATUS_BADGE[item.status]}`}
      >
        {STATUS_LABEL[item.status]}
      </button>
    </form>
  );
}

function formatWindow(start: string | null, end: string | null, tz: string) {
  if (!start || !end) return "—";
  const fmt = (s: string) =>
    new Date(s).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    });
  return `${fmt(start)} – ${fmt(end)}`;
}
