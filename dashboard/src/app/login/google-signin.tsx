"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * The button, and the only thing on this page that needs to be a client component.
 *
 * It reports its own failure. `signInWithOAuth` returning an error used to just reset the
 * label, so a misconfigured provider or an unreachable Supabase looked identical to "I
 * didn't click it properly" — the button visibly did nothing and there was nowhere to
 * look. Whatever goes wrong here, it says so.
 */
export function GoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // Same read-only Calendar scope the mobile app uses — the dashboard
          // needs it to reconstruct "not done" from past calendar events.
          scopes: "https://www.googleapis.com/auth/calendar.readonly",
          // access_type=offline + prompt=consent so Google issues a refresh
          // token we can use for the Calendar API later.
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // No else: on success the browser is already navigating to Google, and clearing
      // `loading` would flash the idle label over a page that's leaving.
    } catch (e) {
      // A thrown error here is the client never reaching Supabase at all — bad URL, bad
      // key, DNS, offline. Distinct from the returned `error` above, and far more likely
      // to be the thing that has someone staring at a dead button.
      setError(
        e instanceof Error
          ? `Couldn't reach Supabase: ${e.message}`
          : "Couldn't reach Supabase.",
      );
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="ds-banner ds-banner--danger mt-6 text-left">
          <div className="ds-banner__content">{error}</div>
        </div>
      )}
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="ds-btn ds-btn--emphasis ds-btn--lg ds-btn--block mt-8"
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
    </>
  );
}
