import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActivityLog } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("activity_logs")
    .select(
      "gcal_event_id, title, done, occurred_on, planned_start, planned_end, color, ended_at",
    )
    .order("ended_at", { ascending: false })
    .limit(100);

  const logs = (data ?? []) as ActivityLog[];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:text-neutral-200">
            Sign out
          </button>
        </form>
      </header>

      <section className="mt-8">
        {error && (
          <p className="text-sm text-red-400">
            Failed to load activity: {error.message}
          </p>
        )}

        {!error && logs.length === 0 && (
          <p className="text-sm text-neutral-500">
            No completed events yet. Mark something done on the clock and it will
            show up here.
          </p>
        )}

        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={`${log.gcal_event_id}-${log.occurred_on}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-900 bg-neutral-950 px-4 py-3"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: log.color ?? "#7B81C9" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{log.title}</p>
                <p className="text-xs text-neutral-500">
                  {formatWindow(log.planned_start, log.planned_end)} ·{" "}
                  {log.occurred_on}
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Done
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function formatWindow(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const fmt = (s: string) =>
    new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}
