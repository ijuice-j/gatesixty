import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

// Self-hosted, not next/font/google. That variant fetches from Google AT BUILD TIME, so the
// build fails outright whenever fonts.googleapis.com is unreachable — a network dependency in
// a step that should be deterministic. Both faces are SIL OFL, so vendoring the latin subsets
// is free and legal.
//
// Inter is the target's real face. Cloudflare's mono is Paper Mono, which is proprietary and
// is never bundled; JetBrains Mono is the open stand-in.
const inter = localFont({
  src: "../fonts/Inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../fonts/JetBrainsMono-latin.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GateSixty",
  description: "Review what you actually did.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes writes `data-mode` on <html> — the selector the token layer keys off (NOT a
    // .dark class). suppressHydrationWarning is required: the theme script sets that attribute
    // before React hydrates, so the server markup necessarily differs.
    // `ds` on the body scopes the component recipes.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="ds min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
