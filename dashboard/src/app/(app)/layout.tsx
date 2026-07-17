import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/user";

/**
 * The auth gate for every signed-in route. The route group `(app)` keeps /login outside
 * it without changing any URL.
 *
 * The shell is deliberately NOT here. Each section owns its own header title and actions,
 * so it lives one level down — see (review)/layout.tsx. Putting it here would force every
 * future section to wear Review's title and its Day/Week/Month zoom control.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser(); // cache()'d — the section layout and pages ask again, for free
  if (!user) redirect("/login");

  return <>{children}</>;
}
