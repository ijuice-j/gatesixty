import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/user";
import { lastCalendarFetchAt } from "@/lib/google/calendar";
import { AppShell } from "../../shell";
import { ZoomNav } from "../../review-nav";
import { RefreshButton } from "../../refresh-button";

/**
 * The shell lives HERE, not in each page — and that's what makes navigation feel fast.
 *
 * A `loading.tsx` renders into its nearest layout's slot. With the shell inside each page,
 * a loading state would have replaced the sidebar and header too: click a date and the whole
 * chrome blinks out. Hoisting the shell into a layout means only the CONTENT swaps for the
 * skeleton, so the sidebar, header and zoom control stay put and the app stops feeling like
 * it reloads on every click.
 *
 * It sits in `(review)` rather than `(app)` because Day/Week/Month is a zoom on THIS section
 * alone: a sibling section rendered under `(app)` would otherwise inherit a zoom control
 * pointing at /, /week and /month. Route groups change no URLs — / /week /month are unmoved.
 *
 * The redirect repeats the one in `(app)/layout.tsx` on purpose: layouts can render
 * concurrently, so this must not assume the parent's guard has already run. getUser() is
 * cache()'d, so asking twice costs one query.
 */
export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [user, { data: cred }] = await Promise.all([
    getUser(),
    supabase.from("google_credentials").select("refresh_token").maybeSingle(),
  ]);
  if (!user) redirect("/login");

  // The freshness label belongs beside the button, and the button lives here — so the
  // token is read here too rather than threaded up from a page. Layouts and pages are
  // siblings; a page cannot hand props to this slot. One indexed maybeSingle(), in
  // parallel with the auth check, is the whole cost.
  const fetchedAt = cred?.refresh_token
    ? lastCalendarFetchAt(cred.refresh_token)
    : null;

  return (
    <AppShell
      email={user.email}
      title="Review"
      actions={
        <>
          <RefreshButton fetchedAt={fetchedAt} />
          <ZoomNav />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
