import { GoogleSignIn } from "./google-signin";

/**
 * A SERVER component now, so it can read the query string.
 *
 * The sign-in round trip has two failure points that both land back here, and neither
 * said anything before: `/auth/callback` redirects to `?error=auth` when the code
 * exchange fails, and Supabase itself can bounce back with `?error=…&error_description=…`
 * when the provider rejects the request. Both used to render as a pristine login page,
 * which is indistinguishable from a fresh visit — you click, the browser goes away and
 * comes back, and nothing has changed or explained itself.
 *
 * Reading searchParams makes this dynamic rather than static. That is the correct trade:
 * a page whose content depends on the query string was never really static.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const { error, error_description: description } = await searchParams;

  const message =
    error === "auth"
      ? "Google signed you in, but we couldn't finish creating your session. Try again — if it keeps happening, the sign-in link may have expired or already been used."
      : error
        ? // Supabase's own error, passed straight through. Its description is written for
          // a person; the code alone ("server_error") is not.
          (description ?? error).replace(/\+/g, " ")
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="ds-card ds-card--elevated w-full max-w-md p-8">
        <div className="ds-card__body text-center">
          <h1 className="text-2xl font-semibold tracking-tight">GateSixty</h1>
          <p className="mt-3 text-sm text-[var(--text-color-kumo-subtle)]">
            Review what you actually did.
          </p>

          {message && (
            <div className="ds-banner ds-banner--danger mt-6 text-left">
              <div className="ds-banner__content">{message}</div>
            </div>
          )}

          {/* emphasis = the blue action surface. NOT the Cloudflare orange — that is a
              text-only token (--text-color-kumo-brand) and must never fill a button. */}
          <GoogleSignIn />
        </div>
      </div>
    </main>
  );
}
