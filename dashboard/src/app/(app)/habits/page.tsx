import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/user";
import { HABIT_COLS, toHabit } from "@/lib/habits/rows";
import type { Habit } from "@/lib/habits/types";
import { HabitForm } from "../../habit-form";
import { HabitRow } from "../../habit-row";

// Written on every log, so never cached.
export const dynamic = "force-dynamic";

type Row = Habit & { archived_at: string | null };

export default async function HabitsPage() {
  const supabase = await createClient();
  const [user, { data }] = await Promise.all([
    getUser(), // cache()'d — the layout already asked
    supabase
      .from("habits")
      .select(`${HABIT_COLS}, archived_at`)
      .order("sort_order")
      .order("created_at"),
  ]);
  if (!user) redirect("/login");

  const all: Row[] = (data ?? []).map((r) => ({
    ...toHabit(r),
    archived_at: (r.archived_at as string | null) ?? null,
  }));
  const active = all.filter((h) => !h.archived_at);
  const archived = all.filter((h) => h.archived_at);

  return (
    <div className="w-full max-w-5xl px-6 py-6">
      <HabitForm />

      <section className="mt-8">
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
          Your habits
        </h2>

        {active.length === 0 ? (
          <div className="ds-card ds-card--bordered">
            <p className="text-base text-[var(--text-color-kumo-subtle)]">
              Nothing yet. Add one above — it&apos;ll show up on{" "}
              <Link href="/" className="text-[var(--text-color-kumo-info)] underline">
                your day
              </Link>{" "}
              to log.
            </p>
          </div>
        ) : (
          <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
            <ul className="divide-y divide-[var(--color-kumo-line)]">
              {active.map((h) => (
                <HabitRow key={h.id} habit={h} archived={false} />
              ))}
            </ul>
          </div>
        )}

        <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
          Logged on the day view, not here. A habit with no target is tracked and never
          scored.
        </p>
      </section>

      {archived.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
            Archived
          </h2>
          <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
            <ul className="divide-y divide-[var(--color-kumo-line)]">
              {archived.map((h) => (
                <HabitRow key={h.id} habit={h} archived />
              ))}
            </ul>
          </div>
          <p className="mt-3 text-sm text-[var(--text-color-kumo-inactive)]">
            Archived, not deleted — everything you logged is still there, and comes back
            with it.
          </p>
        </section>
      )}
    </div>
  );
}

