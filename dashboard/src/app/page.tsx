import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listCalendarEvents, GoogleAuthExpiredError } from "@/lib/google/calendar";
import { reconstructRange, dateRange, type ReconstructedDay } from "@/lib/activity/range";
import { followThrough, totalFollowThrough } from "@/lib/activity/metrics";
import { dateStringInTz, shiftDate, zonedDayStart, resolveViewerTimeZone } from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "./timezone-sync";
import { AppShell } from "./shell";
import { ZoomNav } from "./review-nav";
import { MetricHeader } from "./metric-header";
import { DayList } from "./day-list";
import { ReconnectBanner, LoadErrorBanner } from "./banners";

// Reconstruction reads the live calendar per request — never cache.
export const dynamic = "force-dynamic";

/** The day, plus the 6 before it — so "vs your average" is your OWN average. */
const TRAILING = 7;

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
  // An invalid tz would throw RangeError out of every Intl call, so until it's
  // resolved we skip the fetch and let <TimezoneSync> report the real zone —
  // the day is then fetched once, for the right day, instead of twice.
  const { tz, resolved } = resolveViewerTimeZone(cookieStore.get("tz")?.value);

  if (!resolved) {
    return (
      <AppShell email={user.email} title="Review">
        <div className="w-full max-w-5xl px-6 py-6">
          <TimezoneSync current={tz} resolved={false} />
          <p className="text-base text-[var(--text-color-kumo-subtle)]">Loading your day…</p>
        </div>
      </AppShell>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? (dateParam as string)
    : today;

  // One Google call for the whole trailing window, then slice it per day.
  const from = shiftDate(date, -(TRAILING - 1));
  const dates = dateRange(from, TRAILING);
  const windowStart = zonedDayStart(from, tz);
  const windowEnd = zonedDayStart(shiftDate(date, 1), tz);

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
      .gte("occurred_on", from)
      .lte("occurred_on", date),
  ]);
  const logs = (logData ?? []) as ActivityLog[];

  let days: ReconstructedDay[] = [];
  let needsReconnect = !cred?.refresh_token;
  let loadError: string | null = null;

  if (cred?.refresh_token) {
    try {
      const events = await listCalendarEvents(cred.refresh_token, windowStart, windowEnd);
      days = reconstructRange(events, logs, new Date(), dates, tz);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) needsReconnect = true;
      else loadError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  } else if (logs.length) {
    // No calendar access, but recorded rows can still show.
    days = reconstructRange([], logs, new Date(), dates, tz);
  }

  const items = days.find((d) => d.date === date)?.items ?? [];
  const ft = followThrough(items);

  // "Your average" is the other six days — comparing today with itself is no
  // comparison at all. Days with nothing blocked contribute nothing, so a rest
  // day can't drag the baseline down.
  const priorDays = days.filter((d) => d.date !== date).map((d) => followThrough(d.items));
  const prior = totalFollowThrough(priorDays);

  const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <AppShell email={user.email} title="Review" actions={<ZoomNav date={date} />}>
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

        <MetricHeader
          label={`Follow-through · ${dateLabel}`}
          ft={ft}
          compare={prior.ratio !== null ? prior : undefined}
          compareLabel="your 6-day average"
        />

        {needsReconnect && <ReconnectBanner what="this day" />}
        {loadError && <LoadErrorBanner message={loadError} />}

        {!needsReconnect && !loadError && (
          <DayList items={items} date={date} tz={tz} />
        )}
      </div>
    </AppShell>
  );
}
