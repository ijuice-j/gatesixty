"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Reports the browser's IANA timezone to the server via a cookie so day
 * boundaries are computed in the viewer's local time. The server renders with
 * `current` (UTC until the cookie exists); on a mismatch we set it and refresh
 * once. Renders nothing.
 */
export function TimezoneSync({ current }: { current: string }) {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== current) {
      document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  }, [current, router]);
  return null;
}
