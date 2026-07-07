"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Reports the browser's IANA timezone to the server via a cookie so day
 * boundaries are computed in the viewer's local time. Renders nothing.
 *
 * `resolved` is whether the server already rendered with a valid timezone:
 *   - false (first load / invalid cookie): the server is showing a placeholder,
 *     so always write the cookie and refresh once to render the real day.
 *   - true (steady state): only write + refresh when the zone actually changed
 *     (e.g. the user travelled), so normal loads don't double-fetch.
 */
export function TimezoneSync({
  current,
  resolved,
}: {
  current: string;
  resolved: boolean;
}) {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    if (!resolved || tz !== current) {
      document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  }, [current, resolved, router]);
  return null;
}
