import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Inter is the target's real face (SIL OFL, so it ships as-is). Its mono is Paper Mono —
// proprietary to Cloudflare and never bundled; JetBrains Mono is the open stand-in.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
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
