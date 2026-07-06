import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth redirect target. Supabase sends the user back here with a `code`;
 * we exchange it for a session (stored in cookies) and land them on the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Persist the Google refresh token so we can mint Calendar access tokens
      // later: the session's provider_token expires in ~1h and Supabase never
      // refreshes it. Google only returns a refresh token because login asks for
      // access_type=offline + prompt=consent, so we get a fresh one each sign-in.
      const refreshToken = data.session?.provider_refresh_token;
      const userId = data.session?.user.id;
      if (refreshToken && userId) {
        await supabase.from("google_credentials").upsert(
          {
            user_id: userId,
            refresh_token: refreshToken,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
