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
    <main className="flex min-h-full flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">GateSixty</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Review what you actually did.
        </p>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-8 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>
    </main>
  );
}
