import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listCalendarEvents, GoogleAuthExpiredError } from "@/lib/google/calendar";
import { reconstructDay, summarizeDay, type DaySummary } from "@/lib/activity/day";
import {
  resolveViewerTimeZone,
  dateStringInTz,
  weekStartDate,
  shiftDate,
  zonedDayStart,
} from "@/lib/time";
import type { ActivityLog } from "@/lib/types";
import { TimezoneSync } from "../timezone-sync";
import { DashboardHeader } from "../header";

// Reconstruction reads the live calendar per request — never cache.
export const dynamic = "force-dynamic";

type WeekDay = { date: string; summary: DaySummary };

const EMPTY: DaySummary = { total: 0, done: 0, missed: 0, upcoming: 0 };

export default async function WeekPage({
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
  const { tz, resolved } = resolveViewerTimeZone(cookieStore.get("tz")?.value);

  if (!resolved) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <TimezoneSync current={tz} resolved={false} />
        <p className="mt-4 text-sm text-neutral-500">Loading your week…</p>
      </main>
    );
  }

  const today = dateStringInTz(new Date(), tz);
  const { date: dateParam } = await searchParams;
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? (dateParam as string)
    : today;

  const monday = weekStartDate(ref);
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
  const weekEndStr = shiftDate(monday, 7);
  // bounds[i]..bounds[i+1] is day i's UTC window; bounds[7] closes the week.
  const bounds = [...days, weekEndStr].map((d) => zonedDayStart(d, tz));

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
      .gte("occurred_on", monday)
      .lt("occurred_on", weekEndStr),
  ]);
  const logs = (logData ?? []) as ActivityLog[];

  let week: WeekDay[] = days.map((date) => ({ date, summary: EMPTY }));
  let needsReconnect = !cred?.refresh_token;
  let loadError: string | null = null;

  const summarize = (events: Parameters<typeof reconstructDay>[0]) => {
    const now = new Date();
    return days.map((date, i) => {
      const dayLogs = logs.filter((l) => l.occurred_on === date);
      const items = reconstructDay(events, dayLogs, now, {
        start: bounds[i],
        end: bounds[i + 1],
      });
      return { date, summary: summarizeDay(items) };
    });
  };

  if (cred?.refresh_token) {
    try {
      const events = await listCalendarEvents(
        cred.refresh_token,
        bounds[0],
        bounds[7],
      );
      week = summarize(events);
    } catch (e) {
      if (e instanceof GoogleAuthExpiredError) needsReconnect = true;
      else loadError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  } else if (logs.length) {
    // No calendar access, but recorded done rows can still be tallied.
    week = summarize([]);
  }

  const rangeLabel = `${fmtDay(monday)} – ${fmtDay(days[6])}`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <TimezoneSync current={tz} resolved />
      <DashboardHeader email={user.email} />

      <div className="mt-6 flex justify-end">
        <Link
          href={`/?date=${ref}`}
          className="text-xs text-neutral-500 underline-offset-2 transition hover:text-neutral-300 hover:underline"
        >
          ← Day view
        </Link>
      </div>

      <nav className="mt-4 flex items-center justify-between">
        <Link
          href={`/week?date=${shiftDate(monday, -7)}`}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:text-neutral-200"
          aria-label="Previous week"
        >
          ‹ Prev week
        </Link>
        <p className="text-sm font-medium">{rangeLabel}</p>
        <Link
          href={`/week?date=${shiftDate(monday, 7)}`}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:text-neutral-200"
          aria-label="Next week"
        >
          Next week ›
        </Link>
      </nav>

      <section className="mt-8">
        {needsReconnect && (
          <div className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            Reconnect Google to reconstruct this week.{" "}
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

        <ul className="space-y-2">
          {week.map(({ date, summary }) => (
            <li key={date}>
              <Link
                href={`/?date=${date}`}
                className={`flex items-center gap-4 rounded-lg border bg-neutral-950 px-4 py-3 transition hover:border-neutral-700 ${
                  date === today ? "border-neutral-700" : "border-neutral-900"
                }`}
              >
                <div className="w-12 shrink-0">
                  <p className="text-xs text-neutral-500">{fmtWeekday(date)}</p>
                  <p className="text-sm font-medium tabular-nums">
                    {fmtDayNum(date)}
                  </p>
                </div>

                {summary.total === 0 ? (
                  <p className="flex-1 text-sm text-neutral-600">No events</p>
                ) : (
                  <>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.round(
                            (summary.done / summary.total) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="shrink-0 text-sm text-neutral-400 tabular-nums">
                      {summary.done}/{summary.total} done
                      {summary.missed > 0 && (
                        <span className="text-amber-400">
                          {" "}
                          · {summary.missed} missed
                        </span>
                      )}
                    </p>
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/** "Jul 6" for a YYYY-MM-DD string (noon-UTC avoids date rollover). */
function fmtDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function fmtWeekday(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

function fmtDayNum(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: "UTC",
  });
}
