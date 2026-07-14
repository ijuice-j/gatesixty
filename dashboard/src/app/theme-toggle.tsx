"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ICON = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none" } as const;

/**
 * Light/dark switch. The resolved theme is only known on the client, so render a fixed-size
 * placeholder until mount — otherwise the server markup disagrees with the first client paint
 * and the button visibly flips icon on hydration.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return <span className="ds-btn ds-btn--ghost ds-btn--icon ds-btn--sm" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="ds-btn ds-btn--ghost ds-btn--icon ds-btn--sm"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        // moon
        <svg {...ICON} aria-hidden>
          <path
            d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // sun
        <svg {...ICON} aria-hidden>
          <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M8 1.5v1.25M8 13.25v1.25M14.5 8h-1.25M2.75 8H1.5M12.6 3.4l-.9.9M4.3 11.7l-.9.9M12.6 12.6l-.9-.9M4.3 4.3l-.9-.9"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
