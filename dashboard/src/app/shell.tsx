"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

// The recipe's .ds-sidebar__icon is a 16x16 *span*. An <svg> with no width/height inside it
// falls back to its intrinsic 300x150 and overflows the box, so size every glyph explicitly.
const ICON = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none" } as const;

// Day / Week / Month is a ZOOM level, not a destination — it lives in the header as a
// segmented control (see review-nav.tsx). The rail is for actual places.
const NAV = [
  {
    href: "/",
    match: ["/", "/week", "/month"],
    label: "Review",
    icon: (
      <svg {...ICON} aria-hidden>
        <path d="M2.5 12.5V9.5M6.5 12.5V5.5M10.5 12.5V7.5M14 12.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/habits",
    match: ["/habits"],
    label: "Habits",
    icon: (
      <svg {...ICON} aria-hidden>
        <path d="M3 8.5L6.25 11.75L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/categories",
    match: ["/categories"],
    label: "Categories",
    icon: (
      <svg {...ICON} aria-hidden>
        <circle cx="5.75" cy="5.75" r="2.75" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="10.25" cy="10.25" r="2.75" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
];

/**
 * The Cloudflare-dashboard app shell: a fixed sidebar rail beside a sticky 58px header over
 * the canvas. `--sidebar-nav-width` defaults to the COLLAPSED icon rail, so the expanded
 * width has to be opted into explicitly.
 */
export function AppShell({
  email,
  title,
  actions,
  children,
}: {
  email?: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div
      className="ds-app-shell"
      style={{ ["--sidebar-nav-width" as string]: "var(--sidebar-width)" }}
    >
      <aside className="ds-sidebar">
        <div className="ds-sidebar__container flex h-full flex-col">
          <div className="ds-sidebar__header flex h-[var(--header-height)] items-center px-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="ds-sidebar__icon !opacity-100 text-[var(--text-color-kumo-brand)]">
                <svg {...ICON} aria-hidden>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 4.75V8l2.25 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-base font-semibold tracking-tight">GateSixty</span>
            </Link>
          </div>

          <nav className="ds-sidebar__nav flex-1 px-2 py-3">
            <div className="ds-sidebar__group">
              <div className="ds-sidebar__group-label px-2 pb-1">
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-color-kumo-subtle)]">
                  Activity
                </span>
              </div>
              <ul className="ds-sidebar__menu flex flex-col gap-0.5">
                {NAV.map((item) => {
                  const active = item.match.includes(pathname);
                  return (
                    <li key={item.href} className="ds-sidebar__menu-item">
                      <Link
                        href={item.href}
                        data-active={active || undefined}
                        aria-current={active ? "page" : undefined}
                        className="ds-sidebar__menu-button flex h-8 items-center gap-2 rounded-md px-2 text-base"
                      >
                        <span className="ds-sidebar__icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          <div className="ds-sidebar__footer border-t border-[var(--color-kumo-line)] p-3">
            <p
              className="truncate text-sm text-[var(--text-color-kumo-subtle)]"
              title={email}
            >
              {email}
            </p>
            <form action="/auth/signout" method="post" className="mt-2">
              <button className="ds-btn ds-btn--ghost ds-btn--sm w-full justify-start" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="ds-app-shell__column">
        <header className="ds-app-header flex h-[var(--header-height)] items-center justify-between gap-4 border-b border-[var(--color-kumo-line)] bg-[var(--color-kumo-base)] px-6">
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </header>

        <main className="ds-app-shell__main">{children}</main>
      </div>
    </div>
  );
}
