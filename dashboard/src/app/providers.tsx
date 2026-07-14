"use client";

import { ThemeProvider } from "next-themes";

/**
 * The token layer themes off `[data-mode=dark]` on <html> — NOT a `.dark` class (bare `.dark`
 * occurs zero times in the extracted CSS), so next-themes has to write that attribute.
 *
 * `value` pins the attribute values: without it next-themes would write `data-mode="light"`
 * for light, which is harmless (light is the unprefixed `:root` default), but being explicit
 * keeps the contract obvious to the next reader.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-mode"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      value={{ light: "light", dark: "dark" }}
    >
      {children}
    </ThemeProvider>
  );
}
