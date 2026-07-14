# cloudflare-dashboard design system

A faithful, **cloudflare-dashboard–inspired** design system, extracted from the rendered
UI at `https://dash.cloudflare.com` and re-authored as a clean, importable CSS package.

> **Not affiliated with, endorsed by, or sponsored by Cloudflare.** Cloudflare and the
> Cloudflare Dashboard are trademarks of their respective owner. This package is a
> **design reference**: the token *values* and component *anatomy* were mined
> deterministically from the public, rendered DOM so that the system can be studied,
> compared and reused. No source stylesheet is redistributed — every recipe here is
> re-authored from a property→token map, not copied. No proprietary font files are
> bundled (see [Fonts](#fonts)).

---

## Philosophy

Four traits define this system. If you change nothing else, keep these — they are what
make a UI read as "dashboard" rather than "marketing site".

1. **Dense, px-anchored type.** The bottom of the type scale is re-pinned to hard pixels:
   `text-sm` is **13px** and `text-base` is **14px** (not Tailwind's 14/16). `text-sm` is
   the workhorse — **914** of the 1,060 type-class uses across the captured pages. Body
   text also defaults to **weight 300** with `-0.01em` tracking. The result is a lot of
   legible information per screen.
2. **One radius, everywhere.** `rounded-lg` (8px) appears **946** times; `rounded-md`
   only **21**. Cards, buttons, fields, menus and popovers all share it. `rounded-full`
   (**162**) is reserved for pills, dots and avatars.
3. **Hairlines, not borders.** Controls and cards are drawn with a 1px *ring*
   (`box-shadow`) in `--color-kumo-line`, so the outline never participates in layout.
   Surfaces are separated by tone (`canvas` → `base` → `elevated`), not by heavy strokes.
4. **Achromatic focus.** `--color-kumo-focus` is **neutral** — near-black in light, near-
   white in dark. Focus rings are not brand-tinted. This is deliberate and easy to get
   wrong when you wire up shadcn's `--color-ring`.

One more trap worth stating up front: **the action color is blue, not orange.**
`--color-kumo-brand` is `oklch(57.72% .2324 260)`. The famous Cloudflare orange
(`#f6821f`) exists only as a *text* token, `--text-color-kumo-brand`. Do not fill a
button with it.

---

## Folder structure

```
design-system/
├── index.css              ← the ONE file your app imports
├── components.css         ← @imports all component recipes
├── tokens.json            ← machine-readable token map { color, typography }
│
├── tokens/
│   ├── index.css          ← token entry point + primitives + Tailwind/shadcn bridge
│   ├── colors.css         ← semantic color tokens, per theme  (value-exact)
│   └── typography.css     ← --font-sans / --font-mono / --font-heading role tokens
│
├── components/            ← 8 recipe files, each with a companion doc
│   ├── buttons.css            + buttons.md
│   ├── forms.css              + forms.md
│   ├── menus-dropdowns.css    + menus-dropdowns.md
│   ├── tabs-segmented.css     + tabs-segmented.md
│   ├── badges-status.css      + badges-status.md
│   ├── data-display.css       + data-display.md
│   ├── navigation.css         + navigation.md
│   └── feedback-overlays.css  + feedback-overlays.md
│
└── foundations/           ← the "why" behind the tokens
    ├── colors.md
    ├── typography.md
    ├── fonts.md
    ├── spacing-layout.md
    ├── elevation-motion.md
    └── iconography.md
```

There is **no** `tokens/spacing.css`, `tokens/elevation.css` or `tokens/motion.css`. The
target compiles those to utility classes rather than to named tokens (its classification
verdict is `utility-compiled`, score 1.0, ahead of `token-driven` at 0.813), so the
spacing / radius / type / motion / z-index primitives live in a documented `:root` block
inside `tokens/index.css` instead. Their rationale is in
[`foundations/spacing-layout.md`](./foundations/spacing-layout.md) and
[`foundations/elevation-motion.md`](./foundations/elevation-motion.md).

---

## Adopting it: Tailwind CSS v4 + shadcn/ui

### 1. Import

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/index.css";   /* MUST come after tailwindcss */
```

Order is load-bearing. The token layer redeclares Tailwind theme names (`--spacing`,
`--radius-*`, `--text-*`, `--font-sans`) at an **unlayered** `:root`, which outranks
Tailwind's `@layer theme` defaults — but only if it is parsed second. Get this backwards
and you silently keep Tailwind's 16px `text-base` instead of the target's 14px.

### 2. Delete the palette `npx shadcn init` generated

In your `globals.css`, remove:

* the `:root { --background: …; --foreground: …; … }` and `.dark { … }` OKLCH palette, and
* the `@theme inline { --color-background: var(--background); … }` block, and
* the four `--radius-sm/-md/-lg/-xl: calc(var(--radius) ± Npx)` lines.

`tokens/index.css` supplies all of it. The radius lines matter more than they look: they
**inline** a `calc()` into every `rounded-*` utility, so they would shadow the real radius
ramp rather than losing to it.

### 3. Point the `dark:` variant at the theme selector

This system themes off `[data-mode=dark]`, not `.dark`. Configure `next-themes` to write
that attribute:

```tsx
// app/providers.tsx
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

and teach Tailwind's `dark:` variant the same selector:

```css
/* globals.css, after the imports */
@custom-variant dark (&:where([data-mode="dark"], [data-mode="dark"] *));
```

If you depend on third-party components that hard-code `.dark`, have `next-themes` write
**both** (`attribute={["class", "data-mode"]}`) and keep the default `.dark` variant too:

```css
@custom-variant dark (&:where(.dark, .dark *, [data-mode="dark"], [data-mode="dark"] *));
```

### 4. Use the tokens

Because the bridge is `@theme inline`, every stock shadcn component is themed with zero
edits — `bg-background`, `text-muted-foreground`, `border-border`, `bg-sidebar-accent`
all resolve to the extracted tokens and flip with the theme selector at runtime.

For the traits shadcn doesn't model, reach for the recipes. They are scoped under `.ds`,
so put it on your app root once:

```tsx
<body className="ds">…</body>
```

```tsx
<div className="ds-card ds-card--bordered">
  <span className="ds-badge ds-badge--success">Active</span>
</div>
```

### 5. Map the recipes onto `class-variance-authority`

The recipes are plain classes, which makes them a drop-in `cva` base. Rebuilding
shadcn's `<Button>` on the real button anatomy:

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva("ds-btn", {
  variants: {
    variant: {
      emphasis:  "ds-btn--emphasis",     // the blue primary action
      secondary: "ds-btn--secondary",    // base surface + hairline ring (default)
      ghost:     "ds-btn--ghost",
      outline:   "ds-btn--outline",
    },
    size: {
      xs:   "ds-btn--xs",
      sm:   "ds-btn--sm",    // h-8  → 32px
      md:   "ds-btn--md",    // h-9  → 36px, the default
      lg:   "ds-btn--lg",    // h-10 → 40px
      icon: "ds-btn--icon",  // square
    },
  },
  defaultVariants: { variant: "secondary", size: "md" },
});

export function Button({
  className, variant, size, asChild = false, ...props
}: React.ComponentProps<"button"> &
   VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

`h-9` is the house control height (**32** deduped uses vs **24** for `h-8` and **2** for
`h-10`), which is why `md` is the default. Check each component's `.md` for its exact
variant and size list before writing the `cva` map — don't guess from this snippet.

Note what is **missing** from that list: the target ships **no destructive/danger button
variant** and no link-button variant. Danger is expressed through *badges*, *banners* and
*dialog copy* (`--color-kumo-danger`, `.ds-badge--danger`), never as a red button fill. If
your app needs `<Button variant="destructive">`, you are adding to the system, not
reproducing it — say so, and build it from `--color-kumo-danger` + the shared
`--ds-btn-*` geometry so it at least stays consistent.

Icons: use **`lucide-react`**. The target ships **62** unique icons across **476** uses,
predominantly **fill**-style, and its dominant icon size is **12px** (196 uses), then
16px (42) and 14px (22) — noticeably smaller than lucide's 24px default. Set it globally:

```tsx
<LucideIcon size={12} strokeWidth={2} />        // or className="size-3"
```

See [`foundations/iconography.md`](./foundations/iconography.md).

### Bridge reference

What `tokens/index.css` maps each shadcn name onto:

| shadcn token | extracted token | note |
| --- | --- | --- |
| `--color-background` | `--color-kumo-canvas` | the page behind the cards |
| `--color-foreground` | `--text-color-kumo-default` | |
| `--color-card` / `-foreground` | `--color-kumo-base` / `--text-color-kumo-default` | |
| `--color-popover` / `-foreground` | `--color-kumo-base` / `--text-color-kumo-default` | menus share the base surface; `--color-kumo-elevated` is the raised variant |
| `--color-primary` | `--color-kumo-brand` | **blue**, not orange |
| `--color-primary-foreground` | `--color-white` | the emphasis label is white in both themes |
| `--color-secondary` | `--color-kumo-tint` | approximation — see below |
| `--color-accent` / `-foreground` | `--color-kumo-tint` / `--text-color-kumo-strong` | the hover fill |
| `--color-muted` / `-foreground` | `--color-kumo-recessed` / `--text-color-kumo-subtle` | |
| `--color-border`, `--color-input` | `--color-kumo-line` | |
| `--color-ring` | `--color-kumo-focus` | **neutral**, not brand |
| `--color-destructive` | `--color-kumo-danger` | |
| `--color-sidebar*` | `--color-kumo-base` / `-tint` / `-line` / `-focus` / `-brand` | matches the expanded rail |
| `--radius` | `--radius-lg` | 8px, the house radius |

**The one honest approximation:** the target's secondary button is `--color-kumo-base`
plus a `--color-kumo-line` hairline — no fill. shadcn's `secondary` variant paints a fill
and draws no border, so mapping it to `base` would render an invisible button on a card.
It is mapped to `--color-kumo-tint` instead. For exact parity, use `.ds-btn--secondary`.

---

## Theming

Themes switch by selector. **Never** hand-write a per-theme value — read the var and let
the cascade do it.

| Selector | Theme |
| --- | --- |
| `:root` | light (default) |
| `[data-mode=dark]` | dark |
| `.theme-kumo` | the dark-equivalent "kumo" surface set |
| `.theme-fedramp` | FedRAMP overrides — only 3 tokens (`base`, `canvas`, `hairline`) |

```css
/* ✅ do — one declaration, correct in every theme */
.thing { background: var(--color-kumo-base); color: var(--text-color-kumo-default); }

/* ❌ don't — breaks the moment someone toggles the theme */
.thing { background: #fff; }
[data-mode=dark] .thing { background: #171717; }
```

Themes nest, so you can invert a subtree — a light popover over a dark app:

```html
<body data-mode="dark">
  <div class="ds">                       <!-- dark -->
    <div class="ds-card">…</div>
    <aside data-mode="light">            <!-- light island -->
      <div class="ds-card">…</div>
    </aside>
  </div>
</body>
```

Alpha variants come from `color-mix`, not from extra tokens — this is how the recipes
build the 25%/50% focus rings:

```css
box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--color-kumo-focus) 50%, transparent);
```

**Coverage:** 59 semantic tokens (38 `--color-kumo-*`, 16 `--text-color-kumo-*`, 3 `--tw-*`,
2 `--lightningcss-*`) across 4 themes. Full semantics in
[`foundations/colors.md`](./foundations/colors.md).

---

## Fonts

**No font files are bundled and no `@font-face` rule is redistributed** — the capture
found **0** font faces (the target loads its faces out of band). Typography is therefore
expressed as three **role tokens**, currently pointed at open-licensed look-alikes:

```css
/* tokens/typography.css */
:root {
  --font-heading: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-sans:    "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
```

To swap in a different face — including the target's own, if you have licensed it —
**lead the stack**; never touch the recipes:

```css
/* app/globals.css, after the design-system import */
:root {
  --font-sans: "Your Licensed Sans", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Your Licensed Mono", "JetBrains Mono", ui-monospace, monospace;
}
```

With `next/font`, hand it the CSS variable and alias it:

```tsx
import { Inter } from "next/font/google";
const sans = Inter({ subsets: ["latin"], variable: "--app-sans" });
// <html className={sans.variable}>  →  :root { --font-sans: var(--app-sans), ui-sans-serif, sans-serif; }
```

Every recipe reads `var(--font-sans)` / `var(--font-mono)`, so one line re-types the whole
system. Licensing rules and the full role map:
[`foundations/fonts.md`](./foundations/fonts.md).

---

## Token-naming primer (`namingStrategy = preserve`)

Token names are the **target's own names, verbatim**. Nothing was renamed, re-cased or
re-bucketed. That is a deliberate trade: the names are less pretty than a greenfield
system's, but they are *verifiable* — you can diff any token against the live site.

Read a name in three parts:

```
--color-kumo-base            --text-color-kumo-subtle
  │      │    │                 │         │     │
  │      │    └─ role           │         │     └─ role
  │      └────── namespace      │         └─────── namespace
  └───────────── property       └───────────────── property (text color)
```

* **`--color-kumo-*`** — a **background / fill / line** color. 38 tokens.
* **`--text-color-kumo-*`** — a **foreground** color. 16 tokens. These are a *separate
  family*, not a `-foreground` suffix: `--color-kumo-brand` (blue fill) and
  `--text-color-kumo-brand` (orange ink) are unrelated values. This is the single
  easiest mistake to make in this system.
* **`kumo`** — the internal name of the target's token namespace. It carries no meaning
  beyond "this is a semantic token, not a raw palette step". Keep it.

Roles, in rough order of use:

| Group | Tokens |
| --- | --- |
| Surfaces | `canvas` (page) → `base` (card) → `elevated` (raised) → `overlay`, `recessed` (sunken), `control` |
| Lines | `line` (the hairline — 54 uses in the recipes), `hairline` |
| Interaction | `fill`, `fill-hover`, `tint`, `interact`, `focus` (neutral!) |
| Brand | `brand`, `brand-hover` |
| Status | `success`, `warning`, `danger`, `info`, each with a flat `*-tint` pair |
| Badges | `badge-{blue,green,red,orange,purple,teal,neutral,inverted}` + `*-subtle` inks |
| Shadow | `shadow-drop`, `shadow-edge` — colors, composed into shadows by the recipes |

Primitive ramps (`--color-neutral-*`, `--cf-blue-*`, …) are **not** part of the public
contract. Compose with the semantic tokens; reach for a primitive only for data-viz
series colors, where the `--cf-*` ramp is the intended source.

Recipe classes follow BEM under the `.ds` scope: `.ds-card`, `.ds-card__title`,
`.ds-card--bordered`. Recipe-internal variables are prefixed `--ds-*` (e.g. `--ds-btn-h`)
and are **tuning knobs, not tokens** — override them on an instance to retheme one
element without forking the CSS:

```css
.my-tall-button { --ds-btn-h: 44px; }
```

---

## Component coverage

Grounded in what the capture actually observed across **8** pages (analytics, api-tokens,
audit-log, billing, home-overview, members, notifications, workers-and-pages):

| Family | Status | Observed (deduped) |
| --- | --- | --- |
| Buttons | observed | 88 |
| Links | observed | 137 |
| Icons (svg) | observed | 107 unique nodes / 62 unique icons |
| Dialogs & drawers | observed | 25 |
| Tooltips | observed | 27 |
| Badges | observed | 17 |
| Inputs | observed | 15 |
| Menus | observed | 11 |
| Tabs | observed | 10 |
| Checkboxes | observed | 9 |
| Tables | observed | 2 |
| **Textarea, Select, Radio, Switch** | **PRESCRIPTIVE** | **0 — never rendered on any captured page** |

The four prescriptive families are extrapolated from the observed input/checkbox anatomy
(same `--ds-field-*` geometry, same hairline ring, same focus treatment). They are
plausible and internally consistent, but they are **not** verified against the target. Do
not cite them as "how Cloudflare does it".

**Motion** is fast and restrained: the default transition is **100ms** (vs Tailwind's
150ms), observed durations cluster at 200ms, the dominant easing is plain `ease`, and
there are only **2** custom keyframe animations. The target ships **8**
`prefers-reduced-motion` rules — the recipes honor it too. **Breakpoints** are stock
Tailwind: 640 / 768 / 1024 / 1280 / 1536px.

---

## Usage guidelines

The tokens and component docs tell you *what each piece is*. They do not tell you **when to
reach for which** — that is the job of the usage guidelines. Built from the observed
frequencies in `capture/facts.json` (not from taste), they answer the questions that come up
while you build: which type class for this role, which control-height rung, which button
variant, when a Toast beats a Banner, and how a page is composed. Every rule is tagged
`OBSERVED` (backed by a count), `DERIVED` (follows from the tokens/classes), or
`PRESCRIPTIVE` (honest best practice where the capture is silent) — so you always know which
rules are mined truth and which are proposals. Start with the **Golden rules** and the
**decision cheat-sheet**, then drill into the six section docs (typography, colour
semantics, spacing & layout, component choice, interaction states, page patterns).

→ **[`foundations/usage-guidelines.md`](foundations/usage-guidelines.md)**

---

## Caveats

* **Classification is `utility-compiled`, not `token-driven`.** Atomic classes carry most
  values in the source, so resolved *computed* styles — not raw declarations — are the
  authority behind these recipes. A handful of properties are therefore
  best-reconstruction rather than a token lookup; each is flagged in its recipe's
  comments.
* **`--shadow-xs` is not an extracted token.** The recipes reference it with an inline
  Tailwind-default fallback. Define it yourself if you want a different drop.
* **The primitive ramps are already authorable.** `tokens/colors.css` emits the full
  `--cf-*` ramps and the Tailwind scale (`--spacing`, `--radius-*`, `--text-*`, `--z-index-*`,
  `--ease-*`) at `:root`; its only top-level selectors are `:root`, `[data-mode=dark]`,
  `.theme-fedramp` and `.theme-kumo`. `tokens/index.css` re-states the handful the recipes
  name without a fallback and maps the shadcn contract onto the kumo tokens. Nothing needs
  promoting. Do not re-declare a *theming* token at `:root` in `index.css` — it is imported
  after `colors.css` at equal specificity and would override both themes.
* Static capture only — no hover/focus states were captured live. Interaction states in
  the recipes come from the class→declaration map, which encodes them explicitly.
