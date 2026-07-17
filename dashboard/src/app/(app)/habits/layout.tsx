import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/user";
import { AppShell } from "../../shell";

/**
 * Habits gets the shell but NOT the zoom control — Day/Week/Month is a zoom on Review,
 * and this section has nothing to zoom. That separation is the entire reason the shell
 * moved down into a per-section layout instead of sitting in `(app)`.
 *
 * The redirect repeats `(app)/layout.tsx`'s guard because layouts can render
 * concurrently; getUser() is cache()'d, so asking twice costs one query.
 */
export default async function HabitsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <AppShell email={user.email} title="Habits">
      {children}
    </AppShell>
  );
}
