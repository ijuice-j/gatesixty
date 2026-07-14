# Fonts

Typefaces, role tokens, weights, and — most importantly — **what you are and are not allowed to ship**.

Target: `cloudflare-dashboard` (https://dash.cloudflare.com)
Classification: `utility-compiled` (per `capture/classification.json`) — atomic classes carry the values, so resolved/computed declarations are the primary truth, not named tokens.

---

## ⚠️ READ THIS FIRST — Licensing

**One face in this system is flagged DO-NOT-BUNDLE. It was intentionally not extracted, not copied, and must not be shipped.**

| Role | Source face (observed on target) | Ship this instead | License status (per pipeline `fontRoleMap`) | Bundle? |
|---|---|---|---|---|
| `heading` | Inter Variable | **Inter** | SIL OFL — open, safe to ship | ✅ Yes |
| `sans` | Inter Variable | **Inter** | SIL OFL — open, safe to ship | ✅ Yes |
| `mono` | **Paper Mono** | **JetBrains Mono** | **PROPRIETARY (Cloudflare) — DO NOT BUNDLE, ship the alt** | ❌ **NO** |

### What this means in practice

- **Paper Mono is off-limits.** No `.woff2`, no `@font-face`, no `/fonts/paper-mono-*` URL, no `local("Paper Mono")` fallback entry. It is Cloudflare's proprietary face. This design system ships **JetBrains Mono** in the `--font-mono` role and the recipes reference the role token, never the face name — so nothing downstream depends on Paper Mono existing.
- **Inter is open (SIL OFL) and safe to ship** — but ship it from its own canonical open distribution (Fontsource / Google Fonts / rsms.me), **not** by copying the target's `/fonts/inter-variable.woff2` binary. Same family, clean provenance.
- **No font binaries are included in this design system.** Not the proprietary one, not the open one. You install the open faces through your framework's normal font mechanism (below).

### Scope of these claims (important)

Flags are derived **only** from the captured `@font-face` declarations, their `src` URL hosts, and the pipeline's `fontRoleMap`. **No foundry, pricing, or license-terms claim is made from memory.** What the data actually shows:

- Every face is **self-hosted first-party** — `src` is a site-relative path (`/fonts/*.woff2`) on `dash.cloudflare.com`. There is **no** Typekit/Adobe Fonts, Google Fonts, or third-party CDN loader anywhere in the capture.
- Self-hosting is **not** evidence of a permissive license. A first-party `src` host tells you nothing about redistribution rights — which is exactly why Paper Mono is treated as **DO-NOT-BUNDLE** rather than "probably fine."
- The `PROPRIETARY (Cloudflare)` designation for Paper Mono comes from the pipeline's `fontRoleMap`, not from a license file (none was served or captured). **If you intend to use Paper Mono under an actual agreement, that requires a human license check.** The default posture is: don't.

> **Provenance warning:** the machine classifier output at `capture/font-license.json` reports `faceCount: 0`, `doNotBundle: []`, and `source: null` for all roles. **That empty result is an extractor miss, not a clean bill of health.** See [Data provenance](#data-provenance--known-gaps) at the bottom. Do not cite `font-license.json`'s empty `doNotBundle` as permission to bundle anything.

---

## The typefaces

Three distinct `@font-face` declarations were observed in the rendered DOM (repeated across three init stylesheets — `static/004-init`, `005-init`, `009-init` — hence 9 raw `font-display:swap` occurrences, 3 unique faces).

### 1. Inter Variable — *roles: sans, heading*

A **variable** font carrying the full weight axis, in upright and italic cuts.

| Property | Upright | Italic |
|---|---|---|
| `font-family` | `Inter Variable` | `Inter Variable` |
| `font-weight` | `100 900` (variable range) | `100 900` (variable range) |
| `font-style` | `normal` | `italic` |
| `font-display` | `swap` | `swap` |
| `font-named-instance` | `"Regular"` | `"Italic"` |
| `src` | `local(Inter Variable)`, `/fonts/inter-variable.woff2` | `local(Inter Variable)`, `/fonts/inter-variable-italic.woff2` |

This is the workhorse: body copy, UI labels, headings, table content, buttons — everything that isn't code.

### 2. Paper Mono — *role: mono* — 🚫 **DO NOT BUNDLE**

| Property | Value |
|---|---|
| `font-family` | `Paper Mono` |
| `font-weight` | `400` — **single weight only** |
| `font-style` | `normal` — no italic cut |
| `font-display` | `swap` |
| `src` | `/fonts/paper-mono-regular.woff2` format `woff2` |

**Design consequence that outlives the swap:** the mono face ships **one weight (400) and no italic**. Any `font-mono font-bold` or `font-mono italic` in the source would be *synthesized* by the browser (faux bold / faux oblique), not a real cut. Keep monospace at regular weight, upright. Our alternate (JetBrains Mono) *does* offer more weights — but stay at 400 to preserve the target's texture and to keep the two faces interchangeable.

### 3. Serif — *system only, no webfont*

`--font-serif` exists in the source and resolves to a pure system stack (`ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`). **No serif webfont is loaded.** Nothing to license, nothing to ship.

---

## Role tokens — the swap layer

The whole point of the role tokens is that **no component ever names a typeface**. Components say `var(--font-sans)`; the role token decides which face that is. Swapping the primary face is a one-block override, not a find-and-replace.

### As observed on the target

```css
/* Source stacks — Inter Variable and Paper Mono lead. Shown for reference; NOT what we ship. */
--font-sans:  "Inter Variable", ui-sans-serif, system-ui, sans-serif,
              "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
--font-mono:  "Paper Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
              "Liberation Mono", "Courier New", monospace;
--font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
```

### As shipped by this design system

Defined in [`tokens/typography.css`](../tokens/typography.css) — the proprietary face is gone, the open alternates lead:

```css
:root {
  /* heading active: Inter (open). */
  --font-heading: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  /* sans active: Inter (open). */
  --font-sans:    "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  /* mono active: JetBrains Mono (open) — replaces the DO-NOT-BUNDLE face. */
  --font-mono:    "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
```

Note the shape of every stack: **one leading family, then a system fallback chain.** That chain is what keeps the UI legible in the gap before the webfont lands (`font-display: swap` on every face) and if the webfont never lands at all.

### `--font-heading` is PRESCRIPTIVE

**`--font-heading` does not exist on the target.** It appears in no captured stylesheet. The source drives headings with `--font-sans` (Tailwind's default) and differentiates them by *size and weight only*, not by family.

We expose `--font-heading` as a **prescriptive convenience seam**: it is initialized to the exact same stack as `--font-sans`, so out of the box it is a no-op and the rendering matches the target. It exists so you can introduce a display face later by overriding one token, without touching a single component. If you don't need that, ignore it.

`--font-serif` is observed on the target but is **not currently defined** in our `tokens/typography.css`. If you use `.font-serif` / `font-serif`, define it (system stack above) or it will fall through to the browser default.

---

## How to swap the primary face

Override the role token. That is the entire procedure.

```css
/* Swap the sans/heading face system-wide. Nothing else changes — every
   component references var(--font-sans) / var(--font-heading), never a family name. */
:root {
  --font-sans:    "Public Sans", ui-sans-serif, system-ui, sans-serif;
  --font-heading: "Public Sans", ui-sans-serif, system-ui, sans-serif;
}
```

```css
/* Give headings their own display face while body stays on the sans face. */
:root {
  --font-heading: "Fraunces", Georgia, serif;
}
```

**Rules for a safe swap:**

1. **Keep the system fallback chain.** Lead with your family, keep `ui-sans-serif, system-ui, …` behind it.
2. **Match the weight axis.** If your replacement has no 450/550/650 (see below), the intermediate-weight utilities will snap to the nearest real weight and the type will look coarser.
3. **Quote multi-word family names** — `"Inter Variable"`, not `Inter Variable`, once you're outside the raw source.
4. **Never re-introduce Paper Mono** into `--font-mono`, including as a `local()` entry.

---

## Weights

Two tiers are in play: the named scale, and arbitrary intermediates.

### Named weight tokens

| Token | Value |
|---|---|
| `--font-weight-light` | `300` |
| `--font-weight-normal` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |

### Intermediate weights — and why they force a variable font

The target also uses **arbitrary, non-standard weights** that no static font ships:

```css
.font-\[450\]           { font-weight: 450; }  /* body text, one notch above regular */
.font-\[550\]           { font-weight: 550; }  /* between medium and semibold */
.font-\[650\]           { font-weight: 650; }  /* between semibold and bold */
.\[\&_b\]\:font-\[550\] b      { font-weight: 550; }  /* <b> tuned DOWN from 700 to 550 */
.\[\&_strong\]\:font-\[550\] strong { font-weight: 550; }
```

**This is the single most load-bearing typographic fact in the system.** Weights like 450/550/650 exist *only* on a variable font's continuous axis. Two consequences:

- **Ship the variable build of Inter** (`Inter Variable` / `InterVariable.woff2` — the OFL variable release), not a set of static Inter instances. With static instances, `font-weight: 550` rounds to the nearest available cut and the deliberately-tuned hierarchy collapses.
- The `[&_b]:font-[550]` / `[&_strong]:font-[550]` pattern shows the source **softening** default bold in prose — `<b>`/`<strong>` render at 550, not 700. Preserve that if you want the target's actual texture.

Also note `font-weight: 100` appears in the compiled CSS — well within Inter Variable's `100 900` range, but it will be a synthesized/clamped mess on a static face.

---

## Type scale usage

From `facts.json` (`usage.typeClassTotals`) — how the scale is *actually* used across 8 captured pages:

| Class | Uses |
|---|---|
| `text-sm` | 914 |
| `text-base` | 101 |
| `text-xs` | 29 |
| `text-xs/4` | 8 |
| `text-3xl` | 3 |
| `text-lg` | 3 |
| `text-xl` | 1 |
| `text-2xl` | 1 |

**`text-sm` is the default voice of this UI** — 914 uses against 101 for `text-base`. Links (`a > text-sm`: 632) and buttons (`button > text-sm`: 190) are overwhelmingly small text. Large sizes are rare and reserved for page titles (`h1 > text-3xl`: 3). This is a dense, information-first dashboard: when in doubt, `text-sm`.

Full size/leading/tracking values live in [`tokens/typography.css`](../tokens/typography.css); this doc covers faces and roles only.

---

## Using this in Tailwind CSS v4 + shadcn/ui

### 1. Install the open faces (never the proprietary one)

```bash
npm install @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

Both are OFL. Use the **Variable** packages — `@fontsource-variable/*`, not `@fontsource/*` — so the 450/550/650 weights resolve on a real axis.

### 2. Register the role tokens in `@theme`

In Tailwind v4, `--font-*` keys inside `@theme` **generate the matching `font-*` utilities automatically**. Declaring `--font-heading` gives you `font-heading` for free — no config file, no plugin.

```css
/* app/globals.css */
@import "tailwindcss";

/* OFL faces only. Paper Mono is intentionally absent. */
@import "@fontsource-variable/inter";
@import "@fontsource-variable/jetbrains-mono";

@theme {
  /* Role tokens -> generate font-sans / font-heading / font-mono / font-serif utilities. */
  --font-sans:    "Inter Variable", ui-sans-serif, system-ui, sans-serif,
                  "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-heading: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, Monaco,
                  Consolas, "Liberation Mono", "Courier New", monospace;
  --font-serif:   ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;

  /* Named weight scale, as observed. */
  --font-weight-light:    300;
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;
}

/* The target's softened prose bold — <b>/<strong> at 550, not 700. */
@layer base {
  b, strong { font-weight: 550; }
}
```

### 3. Or load via `next/font` (self-hosted, zero layout shift)

```ts
// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  axes: [],           // variable by default -> 450/550/650 work
  display: "swap",    // matches the target's font-display: swap
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],    // Paper Mono shipped ONE weight; hold the line at 400
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

`next/font` self-hosts the files at build time, so there is no third-party request at runtime — matching the target's first-party posture. Because it *emits* the `--font-sans` / `--font-mono` custom properties, point `@theme` at them:

```css
@theme {
  --font-sans:    var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono:    var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

### 4. Dark mode (`next-themes`)

**Fonts do not change across themes.** The role tokens are theme-invariant — only color tokens flip under `[data-mode=dark]` / `.dark`. Never redefine `--font-*` inside a theme block.

One optional refinement, since Inter is optically lighter on dark backgrounds:

```css
/* Optional: prevent Inter from looking heavy/smeared in dark mode. */
.dark { -webkit-font-smoothing: antialiased; }
```

### 5. Variants with `class-variance-authority`

Bind CVA to **role + scale utilities**, never to a family name:

```ts
import { cva } from "class-variance-authority";

export const text = cva("font-sans", {
  variants: {
    variant: {
      body:  "text-sm font-[450]",   // the dominant voice — 914 uses
      lead:  "text-base font-[450]",
      label: "text-sm font-[550]",
      code:  "font-mono text-xs font-normal",  // mono stays at 400 — no bold cut
      h1:    "font-heading text-3xl font-[650] tracking-tight",
      h2:    "font-heading text-2xl font-[650] tracking-tight",
      h3:    "font-heading text-lg font-semibold",
    },
    muted: { true: "text-[var(--text-color-kumo-subtle)]" },
  },
  defaultVariants: { variant: "body" },
});
```

### 6. shadcn/ui component mapping

shadcn/ui components inherit `font-sans` from `<body>`, so most need nothing. The ones that matter:

| shadcn/ui component | Font role | Note |
|---|---|---|
| `Button` | `font-sans` | Source pairs `h-8`/`h-9` with `text-sm` — see the button recipe |
| `Input`, `Label` | `font-sans` | `text-base` on inputs (prevents iOS zoom) |
| `Table` | `font-sans` | `text-sm`; `th` at `font-[550]` |
| `Badge` | `font-sans` | `text-xs` |
| `Code` / `pre` | `font-mono` | **400 only.** Never `font-bold` |
| `Command`, `DropdownMenu` | `font-sans` | `text-sm` |
| `kbd` | `font-mono` | Source uses `text-xs/4` |

Icons are **lucide-react** (`stroke` style, 16px default — the source's icon set is fill-dominant at 12–16px; size lucide to `size-4`/`size-3` to match).

---

## Accessibility

- **Never set a fixed `px` root font size.** The source's own `--html-font-size` varies (`16px`/`17px`) by context; downstream, use `rem` and let the user's browser preference win. Zoom to 200% must not clip.
- **`font-display: swap` on every face** (all 9 observed occurrences) — text is readable immediately in the fallback face and never invisible. Keep it. Don't switch to `block`/`optional`.
- **Match fallback metrics** to avoid a violent reflow on swap. Inter is close to `system-ui`; if you swap in a face with very different metrics, use `size-adjust`/`ascent-override` on a `@font-face` fallback, or `next/font`'s `adjustFontFallback`.
- **Minimum size.** `text-xs` is used sparingly (29 uses) and is at the floor of comfortable reading. Don't invent anything smaller, and never put body copy in it.
- **Weight is not the only signal.** The gap between `font-[450]` and `font-[550]` is subtle; don't let it be the *sole* carrier of meaning (e.g. read/unread). Pair it with color or an icon.
- **Don't synthesize.** Faux-bolding a single-weight mono face produces smeared, low-contrast glyphs. Use a real cut or stay at 400.
- **Respect `prefers-reduced-motion`** for any font-driven transition (the source ships 8 reduced-motion rules).

---

## Do / Don't

✅ **Do**
- Reference faces **only** through `var(--font-sans)` / `var(--font-heading)` / `var(--font-mono)`.
- Ship the **variable** builds so 450/550/650 resolve on a real axis.
- Keep the full system fallback chain behind your lead family.
- Default to `text-sm` — it is this UI's native register.
- Keep monospace at weight 400, upright.

❌ **Don't**
- **Don't bundle Paper Mono.** Not the file, not the `@font-face`, not a `local()` reference.
- Don't copy the target's `.woff2` binaries — install Inter from its own open distribution.
- Don't hardcode a family name in a component or recipe.
- Don't redefine `--font-*` inside a theme/dark block — fonts are theme-invariant.
- Don't substitute static Inter for Inter Variable and expect `font-[550]` to work.
- Don't add a serif webfont — the source loads none.
- Don't make foundry/price/licensing claims beyond what's documented here.

---

## Data provenance & known gaps

Honest accounting of where these facts came from, because one input is misleading:

| Claim | Source | Confidence |
|---|---|---|
| 3 distinct `@font-face` faces; families, weights, `src`, `font-display` | `@font-face` blocks in `capture/static/{004,005,009}-init.*.css` (post-render DOM) | **Exact** |
| `--font-sans` / `--font-mono` / `--font-serif` stacks | Compiled CSS in capture | **Exact** |
| Weight tokens 300–700; arbitrary 450/550/650 | Compiled CSS in capture | **Exact** |
| Type-scale usage counts | `facts.json` → `usage.typeClassTotals` | **Exact** |
| All faces self-hosted first-party; no Typekit/Google/CDN | `src` URLs are site-relative `/fonts/*.woff2` | **Exact** |
| Paper Mono = PROPRIETARY, DO-NOT-BUNDLE | Pipeline `fontRoleMap` | **Asserted by pipeline** — no license file captured; not derivable from the DOM |
| Inter = SIL OFL, safe to ship | Pipeline `fontRoleMap` | **Asserted by pipeline** |
| `--font-heading` | **Not present on target** | **PRESCRIPTIVE** — our addition, initialized to `--font-sans` |

⚠️ **Two upstream artifacts are wrong and should not be trusted for licensing decisions:**

1. **`capture/_fonts.json` is `[]`** and `facts.json` → `fonts.faceCount` is **`0`**, despite three real `@font-face` rules being present in the capture. The extractor appears to scan linked stylesheets and **misses faces declared in the init stylesheets / inline `<style>` blocks**. Everything in this doc's face table was recovered by reading the captured CSS directly.
2. **`capture/font-license.json` therefore reports `faceCount: 0`, `doNotBundle: []`, `source: null` for every role** — it faithfully classified an empty input. **Its empty `doNotBundle` list is a false negative, not clearance.** The DO-NOT-BUNDLE flag on Paper Mono stands on the `fontRoleMap` plus the direct DOM evidence that `Paper Mono` is a real, self-hosted, non-open face.

**Recommended fix upstream:** have the font extractor parse `@font-face` from *all* captured CSS (including `static/*-init.css` and inline `<style>`), then re-run `classify-fonts` so `font-license.json` independently flags Paper Mono instead of returning an empty set.
