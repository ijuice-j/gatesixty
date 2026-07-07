/** Shared dashboard header: title, signed-in email, and sign-out. */
export function DashboardHeader({ email }: { email?: string }) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-neutral-500">{email}</p>
      </div>
      <form action="/auth/signout" method="post">
        <button className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:text-neutral-200">
          Sign out
        </button>
      </form>
    </header>
  );
}
