"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
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
    if (error) setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="ds-card ds-card--elevated w-full max-w-sm">
        <div className="ds-card__body text-center">
          <h1 className="text-2xl font-semibold tracking-tight">GateSixty</h1>
          <p className="mt-2 text-sm text-[var(--text-color-kumo-subtle)]">
            Review what you actually did.
          </p>
          {/* emphasis = the blue action surface. NOT the Cloudflare orange — that is a
              text-only token (--text-color-kumo-brand) and must never fill a button. */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="ds-btn ds-btn--emphasis ds-btn--lg ds-btn--block mt-8"
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>
        </div>
      </div>
    </main>
  );
}
