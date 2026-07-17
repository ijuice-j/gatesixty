import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/user";
import { AppShell } from "../shell";
import { ZoomNav } from "../review-nav";
import { RefreshButton } from "../refresh-button";

/**
 * The shell lives HERE, not in each page — and that's what makes navigation feel fast.
 *
 * A `loading.tsx` renders into its nearest layout's slot. With the shell inside each page,
 * a loading state would have replaced the sidebar and header too: click a date and the whole
 * chrome blinks out. Hoisting the shell into a layout means only the CONTENT swaps for the
 * skeleton, so the sidebar, header and zoom control stay put and the app stops feeling like
 * it reloads on every click.
 *
 * The route group `(app)` keeps /login outside the shell without changing any URL.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser(); // cache()'d — the pages call this too, for free
  if (!user) redirect("/login");

  return (
    <AppShell
      email={user.email}
      title="Review"
      actions={
        <>
          <RefreshButton />
          <ZoomNav />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
