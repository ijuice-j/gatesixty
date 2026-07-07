import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listCalendarEvents, GoogleAuthExpiredError } from "@/lib/google/calendar";
import { reconstructDay, type DayItem, type DayStatus } from "@/lib/activity/day";
import { zonedDayRange, dateStringInTz, shiftDate, resolveViewerTimeZone } from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "./timezone-sync";
import { DashboardHeader } from "./header";
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
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <TimezoneSync current={tz} resolved={false} />
        <p className="mt-4 text-sm text-neutral-500">Loading your day…</p>
      </main>
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <TimezoneSync current={tz} resolved />
      <DashboardHeader email={user.email} />

      <div className="mt-6 flex justify-end">
        <Link
          href={`/week?date=${date}`}
          className="text-xs text-neutral-500 underline-offset-2 transition hover:text-neutral-300 hover:underline"
        >
          Week view →
        </Link>
      </div>

      <nav className="mt-4 flex items-center justify-between">
        <Link
          href={`/?date=${shiftDate(date, -1)}`}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:text-neutral-200"
          aria-label="Previous day"
        >
          ‹ Prev
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">{dateLabel}</p>
          {date !== today && (
            <Link
              href="/"
              className="text-xs text-neutral-500 underline-offset-2 hover:underline"
            >
              Jump to today
            </Link>
          )}
        </div>
        <Link
          href={`/?date=${shiftDate(date, 1)}`}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:text-neutral-200"
          aria-label="Next day"
        >
          Next ›
        </Link>
      </nav>

      <section className="mt-8">
        {needsReconnect && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            Reconnect Google to reconstruct this day.{" "}
            <form action="/auth/signout" method="post" className="inline">
              <button className="font-medium underline underline-offset-2">
                Reconnect
              </button>
            </form>
          </div>
        )}

        {loadError && (
          <p className="text-sm text-red-400">
            Failed to load activity: {loadError}
          </p>
        )}

        {!needsReconnect && !loadError && items.length === 0 && (
          <p className="text-sm text-neutral-500">
            No timed events on this day.
          </p>
        )}

        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-900 bg-neutral-950 px-4 py-3"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-neutral-500">
                  {formatWindow(item.start, item.end, tz)}
                </p>
              </div>
              <StatusControl item={item} date={date} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

const STATUS_STYLES: Record<DayStatus, string> = {
  done: "bg-emerald-500/10 text-emerald-400",
  not_done: "bg-amber-500/10 text-amber-400",
  upcoming: "bg-neutral-500/10 text-neutral-400",
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
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES.upcoming}`}
      >
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
        className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent transition hover:ring-current ${STATUS_STYLES[item.status]}`}
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
