# Color System — cloudflare-dashboard

Extracted from `https://dash.cloudflare.com`. Every value on this page is transcribed from
`design-system/tokens.json` + `design-system/tokens/colors.css`; every count is from
`capture/facts.json`; every property/state mapping is from `capture/_classes.json` and the
captured post-render DOM. Nothing here is invented — where the data is silent, this doc says so.

**Target framework for consumption:** Tailwind CSS v4 + shadcn/ui.

---

## 0. Read this first — how the source is built (and what it means for you)

`capture/classification.json` classifies this target as **`utility-compiled`** (score 1.00), with
`token-driven` a close second (0.813). Concretely: 79% of observed classes are atomic utilities
(`utilityRatio: 0.79`), and Tailwind utilities — not hand-written component CSS — carry the values.

Two consequences you must internalize:

1. **The semantic token layer is real and is the contract.** Utilities are named after tokens
   (`bg-kumo-base`, `text-kumo-subtle`, `ring-kumo-focus`), and each compiles to a single
   `var(--color-kumo-*)` / `var(--text-color-kumo-*)` reference. So you can adopt the token layer
   verbatim and get the same result.
2. **`classification.json` marks `computedStyleMandatory: true`, so RESOLVED values win over the
   raw declaration text.** In `tokens/colors.css`, `var(--ref, <literal-fallback>)` pairs exist in
   **exactly one place — the `.theme-kumo` block** (lines 1288–1346). `:root` (light) and
   `[data-mode=dark]` store fully-resolved literals with no fallbacks at all. **Three of those kumo
   fallbacks are stale** — they disagree with the primitive they point at (see §11.1). The browser
   resolves `--ref` and never reads the fallback, so the fallback is a decoy. **Throughout this doc,
   "resolved" columns are the values that actually paint.** Use them.

---

## 1. Theme model

### 1.1 Selectors

`tokens/colors.css` defines the semantic layer under four theme selectors plus one un-scoped bucket:

| Bucket | Selector | Role | Semantic tokens defined |
|---|---|---|---|
| **light** | `:root` | Default theme. Ships on the bare document. | 54 (38 `--color-kumo-*` + 16 `--text-color-kumo-*`) |
| **dark** | `[data-mode=dark]` | Dark theme. Attribute on the root element. | 54 (full re-declaration) |
| **kumo** | `.theme-kumo` | Class-based twin of dark — **byte-identical to `[data-mode=dark]`** for all 54 tokens. | 54 |
| **fedramp** | `.theme-fedramp` | Compliance skin. **Partial override only — 3 tokens.** | 3 |
| **unknown** | (un-scoped `@theme` layer) | The **primitive scale**. Theme-invariant; not a theme. | 535 total entries |

`facts.json` reports `theme.dataTheme: true`, `theme.darkClass: true`, `theme.prefersColorScheme: false`,
`themeBlockCount: 3`. So: **theme is switched explicitly, never by `prefers-color-scheme`.** There is
no automatic OS-driven switch in the source. (Your rebuild is free to add one — see §10.4.)

The captured pages were all rendered in **light** mode (`<html lang="en-US" class="">`, no `data-mode`
attribute present, zero occurrences of `theme-kumo` / `theme-fedramp` in markup). Dark, kumo, and
fedramp values below come from the stylesheet, not from an observed render.

### 1.2 `[data-mode=dark]` and `.theme-kumo` are the same theme

Every one of the 54 semantic tokens has an identical value in the `dark` and `kumo` buckets. Treat
`.theme-kumo` as an alias selector for dark, not as a fifth palette. Do not build a separate
"kumo theme" — there is nothing in the data to distinguish it.

### 1.3 The fedramp skin is a 3-token patch, not a theme

`.theme-fedramp` overrides **only**:

| Token | fedramp value |
|---|---|
| `--color-kumo-base` | `#5b697c` |
| `--color-kumo-canvas` | `#5b697c` |
| `--color-kumo-hairline` | `#c8d4e5` |

Everything else inherits from whichever theme is underneath. Note that fedramp collapses `base` and
`canvas` to the same slate (`#5b697c`), erasing the panel-vs-page distinction that §3 relies on, and
it does **not** override any text token — so light-mode text (`--text-color-kumo-default` →
`oklch(20.5% 0 0)`, near-black) sits on a mid-slate `#5b697c`. That combination measures **3.20:1 —
below AA for normal text.** A companion `--fedramp-primary-text: #fff` primitive exists in the
un-scoped bucket and *would* fix it (**white on `#5b697c` = 5.59:1, AA**), but **no `.theme-fedramp`
rule assigns it to any text token.** This is an incomplete skin in the source. **If you port fedramp,
you must supply the text tokens yourself** — at minimum map `--text-color-kumo-default` and
`--text-color-kumo-strong` to `#fff`. (The one thing fedramp does get right: its hairline `#c8d4e5`
on `#5b697c` measures 3.73:1, clearing the 3:1 non-text bar comfortably.)

### 1.4 There is no `prefers-contrast` / high-contrast theme

The names *do* reveal an **inversion** concept, but it is a per-token facility, not a theme — see §6.

---

## 2. Token architecture — two layers, two namespaces

### 2.1 Layer 1 — primitives (un-scoped, theme-invariant)

535 entries in the un-scoped bucket. They are raw values, never themed, and you should **never
reference them from a component**. They exist so the semantic layer has something to point at.

| Primitive family | Count | Shape | Notes |
|---|---|---|---|
| `--color-<hue>-<step>` | 138 | `oklch(…)` | Tailwind v4's default OKLCH palette (neutral, gray, zinc, blue, red, green, emerald, yellow, amber, orange, purple, violet, indigo, teal, cyan, pink, rose). **This is what the semantic layer actually resolves to.** |
| `--color-kumo-neutral-<step>` | 8 | `oklch(… 0 0)` | Custom achromatic steps the stock Tailwind ramp lacks — the extra rungs that make the surface ladder work: `-50` `98.75%`, `-75` `98%`, `-125` `96.5%`, `-750` `32%`, `-925` `17%`, `-950` `15%`, `-975` `12%`, `-1000` `10%`. ⚠ Three further steps — `-25`, `-150`, `-800` — are **referenced by the semantic layer but never defined**. See §11.3. |
| `--cf-*` | 136 | hex | Legacy Cloudflare brand ramps: `blue` `cyan` `gold` `gray` `green` `indigo` `newGray` `newGreen` `orange` `pink` `red` `violet` (10 steps each, `-0` darkest → `-9` lightest), plus `--cf-black` / `--cf-white`, plus `--cf-sequential-0…13` (see §8). |
| `--color-cl1-*` | 36 | hex | A subset of `--cf-*` re-exported under a `cl1` (component-library-1) prefix. Pure aliases. |
| `--fedramp-*` | 5 | hex | `primary-background` `secondary-background` `hover-background` `active-background` `primary-text`. Only 3 reach the `.theme-fedramp` selector (§1.3). |

**The `--cf-*` and `--color-cl1-*` ramps are legacy.** No `--color-kumo-*` or `--text-color-kumo-*`
token resolves into them — the semantic layer targets the Tailwind OKLCH palette exclusively. Port
them only if you need the data-viz set (§8) or you are matching legacy Cloudflare marketing surfaces.

### 2.2 Layer 2 — semantic tokens (themed) — **this is the API**

54 tokens, split across two namespaces. **The namespace encodes the property, and this is
load-bearing:**

| Namespace | Count | Drives | Confirmed by |
|---|---|---|---|
| `--color-kumo-*` | 38 | `background-color`, `border-color`, ring/outline color, gradients, shadow color | `_classes.json`: `.bg-kumo-*`, `.border-kumo-*`, `.ring-kumo-*` |
| `--text-color-kumo-*` | 16 | `color` (foreground) only | `_classes.json`: `.text-kumo-*` |

Several role names exist in **both** namespaces with **different values** — `danger`, `warning`,
`success`, `info`, `brand`. `--color-kumo-danger` is the *fill*; `--text-color-kumo-danger` is the
*ink*. They are not interchangeable, and swapping them will silently destroy your contrast. This is
the single most important rule in this system:

> **Pick the token by the property you are setting, not by the role you are expressing.**
> Background/border/ring → `--color-kumo-*`. Text/icon → `--text-color-kumo-*`.

---

## 3. Family: Surfaces / backgrounds

Ten tokens. Resolved values, both themes:

| Token | light (resolved) | dark (resolved) | Role |
|---|---|---|---|
| `--color-kumo-canvas` | `oklch(98.75% 0 0)` | `oklch(10% 0 0)` | The page backdrop. Furthest back. |
| `--color-kumo-base` | `#fff` | `oklch(17% 0 0)` | The **panel/card** surface. The workhorse — content sits here. |
| `--color-kumo-elevated` | `oklch(98% 0 0)` | `oklch(12% 0 0)` | Popover/menu/dialog surface. |
| `--color-kumo-recessed` | `oklch(96.5% 0 0)` | `oklch(15% 0 0)` | Inset wells — code blocks, table headers, sunken tracks. |
| `--color-kumo-control` | `#fff` | `oklch(20.5% 0 0)` | Form-control field background (input, select). |
| `--color-kumo-overlay` | `oklch(98.75% 0 0)` | `oklch(26.9% 0 0)` | Hover wash on rows/menu items. Observed as `hover:bg-kumo-overlay`. |
| `--color-kumo-tint` | `oklch(97% 0 0)` | `oklch(26.9% 0 0)` | Subtle hover/selected wash. Observed as `hover:bg-kumo-tint`, `not-disabled:hover:bg-kumo-tint`, `aria-selected:hover:bg-kumo-tint`. |
| `--color-kumo-fill` | `oklch(92.2% 0 0)` | `oklch(26.9% 0 0)` | Neutral filled element — secondary button face, chip, skeleton, progress track. |
| `--color-kumo-fill-hover` | `oklch(96.5% 0 0)` | `oklch(26.9% 0 0)` ⚠ | Hover face for `fill`. **In dark this equals `fill` — the hover is a no-op. See §11.** |
| `--color-kumo-interact` | `oklch(87% 0 0)` | `oklch(37.1% 0 0)` | The most-contrasted neutral fill — pressed/active state, scrollbar thumb. |

### 3.1 The surface ladder (read this before choosing a surface)

Sorted by resolved OKLCH lightness. **The ladder does not run the same direction in both themes**,
so do not reason about these tokens as "lighter = more elevated":

**Light** (lightest → darkest): `base` 100 → `canvas`/`overlay` 98.75 → `elevated` 98 → `tint` 97 →
`recessed`/`fill-hover` 96.5 → `fill` 92.2 → `interact` 87

**Dark** (darkest → lightest): `canvas` 10 → `elevated` 12 → `recessed` 15 → `base` 17 →
`control` 20.5 → `overlay`/`tint`/`fill` 26.9 → `interact` 37.1

The one invariant that **does** hold in both themes, and the one you should design against:

> **`base` is always more prominent than `canvas`** (light: `#fff` on `98.75%`; dark: `17%` on `10%`).
> Panels lift off the page in both themes. Everything else — including whether `elevated` is lighter
> or darker than `canvas` — flips.

Two traps that follow directly:
- **`elevated` is *darker* than `canvas` in light mode** (98% vs 98.75%) and *lighter* in dark (12% vs 10%). The name describes intent, not lightness. Never hand-compute a "one step lighter" surface — use the token.
- **`overlay` in light (`98.75%`) is identical to `canvas`**, so a `hover:bg-kumo-overlay` row on a `canvas` background is invisible in light mode. It only reads on `base` (`#fff`). Only apply `overlay` to elements sitting on `base`.

---

## 4. Family: Text / foreground

Sixteen tokens, all in the `--text-color-kumo-*` namespace. Split into a neutral ink ramp, a link
color, brand ink, and intent ink.

### 4.1 Neutral ink ramp

| Token | light (resolved) | dark (resolved) | Role | Observed usage |
|---|---|---|---|---|
| `--text-color-kumo-strong` | `oklch(14.5% 0 0)` | `oklch(98.5% 0 0)` | Headings, emphasized values, hovered/focused text. | `text-kumo-strong` ×23, `focus-visible:text-kumo-strong` ×104, `hover:text-kumo-strong`, `active:text-kumo-strong`, `not-disabled:hover:text-kumo-strong` |
| `--text-color-kumo-default` | `oklch(20.5% 0 0)` | `oklch(97% 0 0)` | **Body text. The default.** | `text-kumo-default` ×114 — the single most-used color utility on the site. Also `hover:text-kumo-default`, `focus:text-kumo-default`, `aria-selected:text-kumo-default` |
| `--text-color-kumo-subtle` | `oklch(55.6% 0 0)` | `oklch(70.8% 0 0)` | Secondary/supporting text, captions, metadata. Also a **disabled** ink — the one to pick when the disabled label still has to be read (§9.1). | `text-kumo-subtle` ×23, `disabled:text-kumo-subtle` (observed on all 8 pages) |
| `--text-color-kumo-placeholder` | `oklch(70.8% 0 0)` | `oklch(55.6% 0 0)` | Input placeholder text only. | `:text-kumo-placeholder`, `kumo-input-placeholder` |
| `--text-color-kumo-inactive` | `oklch(87% 0 0)` | `oklch(43.9% 0 0)` | Deepest de-emphasis — decorative/inert glyphs, and the **disabled**-state ink used throughout the recipe layer. **Never for text a user must read (§9.1).** | `text-kumo-inactive` (observed on `members.html`) |
| `--text-color-kumo-inverse` | `oklch(97% 0 0)` | `oklch(20.5% 0 0)` | Ink for text sitting on an inverted surface (§6). | Defined; **not observed in captured markup.** |

Note the deliberate **crossover**: `subtle` (light `55.6%`) and `placeholder` (light `70.8%`) swap
values in dark mode (`70.8%` / `55.6%`). Placeholder is always one step weaker than subtle. That is
intentional, and it is why placeholder fails contrast in light mode (§9).

### 4.2 Link

| Token | light | dark | Notes |
|---|---|---|---|
| `--text-color-kumo-link` | `oklch(42.4% .199 265.638)` (blue-800) | `oklch(70.7% .165 254.624)` (blue-400) | Hyperlink ink. |
| `--text-color-kumo-info` | `oklch(42.4% .199 265.638)` | `oklch(70.7% .165 254.624)` | **Identical to `link` in both themes.** |

`link` and `info` are value-identical. Keep both names (they carry different intent and may diverge),
but do not expect a visual difference today. `link` is used with 760 raw `<a>` occurrences across
8 pages; `text-kumo-info` is also applied to link-like affordances (`text-kumo-info hover:ring-1 ring-inset`).

### 4.3 Brand ink — **the brand is two different colors, and this is not a bug**

| Token | light | dark | Namespace |
|---|---|---|---|
| `--color-kumo-brand` | `oklch(57.72% .2324 260)` — **blue** | `oklch(51.948% .2324 260)` — **blue** | fill |
| `--text-color-kumo-brand` | `#f6821f` — **Cloudflare orange** | `#f6821f` — **Cloudflare orange** | ink |

This is the most surprising fact in the palette and you must not "fix" it:

- **Brand as a *fill* (`--color-kumo-brand`) is blue.** Same hue (260) in both themes, dropped ~5.8
  points of lightness in dark. It is the accent for the active-tab indicator and the primary button.
- **Brand as *ink* (`--text-color-kumo-brand`) is the Cloudflare orange `#f6821f`** — the marketing
  brand color — and it is **theme-invariant** (identical hex in light, dark, and kumo). It is the
  only semantic token in the entire system that does not change between themes.

The orange is a logo/wordmark color, not a UI accent. See §9 for why you must never use it as
body-text ink on light surfaces.

### 4.4 Intent ink

| Token | light (resolved) | dark (resolved) |
|---|---|---|
| `--text-color-kumo-danger` | `oklch(50.5% .213 27.518)` (red-700) | `oklch(70.4% .191 22.216)` (red-400) |
| `--text-color-kumo-warning` | `oklch(47.6% .114 61.907)` (yellow-800) | `oklch(85.2% .199 91.936)` (yellow-400) |
| `--text-color-kumo-success` | `oklch(43.2% .095 166.913)` (emerald-800) | `oklch(90.5% .093 164.15)` (emerald-200) |
| `--text-color-kumo-info` | `oklch(42.4% .199 265.638)` (blue-800) | `oklch(70.7% .165 254.624)` (blue-400) |

The pattern is consistent and worth naming: **light mode picks a dark, desaturated step (700–800);
dark mode picks a light step (200–400).** Ink always moves *away* from the surface.

---

## 5. Family: Borders, dividers, hairlines

| Token | light (resolved) | dark (resolved) | Role | Observed usage |
|---|---|---|---|---|
| `--color-kumo-line` | `oklch(14.5% 0 0 / .1)` — **10% black** | `oklch(32% 0 0)` — **opaque** | The default border/divider. | `border-kumo-line` ×27, `bg-kumo-line` ×22, `ring-kumo-line` ×10 |
| `--color-kumo-hairline` | `oklch(93.5% 0 0)` | `oklch(26.9% 0 0)` | A second, opaque divider. | `border-kumo-hairline`, `ring-kumo-hairline/70` |
| `--color-kumo-fill` | `oklch(92.2% 0 0)` | `oklch(26.9% 0 0)` | Doubles as a border on controls. | `border-kumo-fill`, `ring-kumo-fill` ×4 |
| `--color-kumo-tip-stroke` | `transparent` | `oklch(26.9% 0 0)` | Tooltip outline. **Deliberately transparent in light** — the tooltip is separated by shadow in light, by stroke in dark. |

**`line` vs `hairline` — pick `line`.** `line` is the observed default (59 combined uses vs a handful
for `hairline`), and it is the smarter token: in light it is a **10%-alpha black**, so it composites
correctly over *any* surface in the ladder instead of only looking right on one. Measured, the
composited `line` lands at **exactly 1.24:1 against its own backdrop on `base`, `canvas`, *and*
`elevated`** — the divider reads with identical weight everywhere, which is the whole point of making
it alpha. `hairline` is opaque `93.5%` — correct on `#fff` `base`, progressively wrong as the surface
underneath it darkens.

**`bg-kumo-line` (22 uses) is not a mistake.** It is `line` used as the *fill* of a 1px separator
`<div>`, which is the same visual result as a border. Both are legitimate.

**⚠ `line` is the one token whose alpha-vs-opaque nature flips.** Light is `oklch(14.5% 0 0 / .1)`
(alpha); dark is `oklch(32% 0 0)` (fully opaque). If you stack two `line` borders in light mode they
will **double up to ~19% and read darker**; in dark they will not. Avoid adjacent/overlapping
`line` borders, or collapse them.

---

## 6. The inversion / high-contrast concept

There is **no high-contrast theme**. But three token names encode an *inversion* facility — a way to
paint an element in the opposite polarity of the current theme:

| Token | light | dark | Namespace |
|---|---|---|---|
| `--color-kumo-contrast` | `oklch(12% 0 0)` — near-black | `oklch(98.5% 0 0)` — near-white | fill |
| `--text-color-kumo-inverse` | `oklch(97% 0 0)` — near-white | `oklch(20.5% 0 0)` — near-black | ink |
| `--color-kumo-badge-inverted` | `oklch(14.5% 0 0)` — near-black | `#fff` | fill |
| `--text-color-kumo-badge-inverted` | `#fff` | `#000` | ink |

`contrast` and `inverse` are **an intentional pair**: `contrast` is the *maximally opposite surface*,
`inverse` is the *ink that survives on it*. Use them together (`bg-kumo-contrast` + `text-kumo-inverse`)
for high-emphasis inverted chips, dark tooltips on light pages, or "new" callouts.

`badge-inverted` / `text-color-kumo-badge-inverted` is the same idea, scoped to badges, and it goes one
step further to pure `#fff`/`#000` — measuring **19.79:1** (light) and **21.00:1** (dark), the highest
contrast pairs in the system.

**Utilities for these exist in the compiled CSS (`.bg-kumo-contrast`, `.text-kumo-contrast`,
`.text-kumo-inverse`, and their `/opacity` variants) but none appear in the captured markup on any of
the 8 pages.** The tokens are real; the usage is unconfirmed. Treat the pairing guidance above as
**PRESCRIPTIVE** — it follows from the names and values, not from an observed component.

---

## 7. Status / intent families

### 7.1 The intent triplet pattern

Four intents exist — **`danger`, `warning`, `success`, `info`**. There is no `neutral` intent and no
`critical`/`fatal` tier; do not invent them. Each intent has a consistent **three-token triplet**:

| Slot | Token pattern | Property | Purpose |
|---|---|---|---|
| **Solid** | `--color-kumo-<intent>` | background | Saturated fill: status dot, alert bar, solid badge |
| **Tint** | `--color-kumo-<intent>-tint` | background | Washed fill: alert/callout body |
| **Ink** | `--text-color-kumo-<intent>` | color | Text + icon on the tint |

Solid + Tint + Ink, resolved:

| Intent | Slot | light | dark |
|---|---|---|---|
| **danger** | solid | `oklch(63.7% .237 25.331)` (red-500) | `oklch(57.7% .245 27.325)` (red-600) |
| | tint | `oklch(93.6% .032 17.717)` (red-100) | `oklch(39.6% .141 25.723)` (red-900) |
| | ink | `oklch(50.5% .213 27.518)` (red-700) | `oklch(70.4% .191 22.216)` (red-400) |
| **warning** | solid | `oklch(79.5% .184 86.047)` (yellow-500) | `oklch(85.2% .199 91.936)` (yellow-400) |
| | tint | `oklch(97.3% .071 103.193)` (yellow-100) | `oklch(55.4% .135 66.442)` (yellow-700) |
| | ink | `oklch(47.6% .114 61.907)` (yellow-800) | `oklch(85.2% .199 91.936)` (yellow-400) |
| **success** | solid | `oklch(59.6% .145 163.225)` (emerald-600) | `oklch(76.5% .177 163.223)` (emerald-400) |
| | tint | `oklch(95% .052 163.051)` (emerald-100) | `oklch(37.8% .077 168.94)` (emerald-900) |
| | ink | `oklch(43.2% .095 166.913)` (emerald-800) | `oklch(90.5% .093 164.15)` (emerald-200) |
| **info** | solid | `oklch(62.3% .214 259.815)` (blue-500) | `oklch(70.7% .165 254.624)` (blue-400) |
| | tint | `oklch(93.2% .032 255.585)` (blue-100) | `oklch(37.9% .146 265.522)` (blue-900) |
| | ink | `oklch(42.4% .199 265.638)` (blue-800) | `oklch(70.7% .165 254.624)` (blue-400) |

⚠ **In dark mode, `warning`'s solid and ink are the same value** (`oklch(85.2% .199 91.936)`), and so
are `info`'s. That is fine for `info`-on-surface, but it means **you must never put `text-kumo-warning`
on `bg-kumo-warning`** — it would be invisible (1:1). Intent ink belongs on the **tint**, never on the
**solid**. On a solid intent fill, use `--text-color-kumo-inverse` or literal white/black.

### 7.2 Banner backgrounds — a separate, alpha-composited family

Two tokens, and they are **not** the same as the intent tints:

| Token | light | dark |
|---|---|---|
| `--color-kumo-banner-info` | `oklch(93.2% .032 255.585 / .7)` — blue-100 @ **70% alpha** | `oklch(37.9% .146 265.522 / .5)` — blue-900 @ **50% alpha** |
| `--color-kumo-banner-warning` | `oklch(97.3% .071 103.193)` — yellow-100, **opaque** | `oklch(55.4% .135 66.442 / .5)` — yellow-700 @ **50% alpha** |

Banners are alpha-composited so they can sit over any surface. Note the inconsistency in the source:
`banner-warning` is **opaque in light** but 50%-alpha in dark, while `banner-info` is alpha in both.
Reproduce as-is (the mined values are exact), but be aware `banner-warning` in light will not
composite over a colored surface the way the other three do.

**There is no `banner-danger` or `banner-success`.** Only info and warning exist. Do not fabricate the
missing two — if you need them, derive them and mark them as additions.

### 7.3 Badge palette — a **hue** family, not an intent family

Eight solid badge fills. These are *categorical colors* (label a thing), distinct from intent
(*communicate state*):

| Token | light (resolved) | dark (resolved) |
|---|---|---|
| `--color-kumo-badge-blue` | `oklch(54.6% .245 262.881)` (blue-600) | `oklch(48.8% .243 264.376)` (blue-700) |
| `--color-kumo-badge-green` | `oklch(59.6% .145 163.225)` (emerald-600) | `oklch(50.8% .118 165.612)` (emerald-700) |
| `--color-kumo-badge-red` | `oklch(57.7% .245 27.325)` (red-600) | `oklch(50.5% .213 27.518)` (red-700) |
| `--color-kumo-badge-purple` | `oklch(55.8% .288 302.321)` (purple-600) | `oklch(49.6% .265 301.924)` (purple-700) |
| `--color-kumo-badge-teal` | `oklch(54.9% .096 184.565)` (teal-650) | `oklch(51.1% .096 186.391)` (teal-700) |
| `--color-kumo-badge-neutral` | `oklch(55.6% 0 0)` (neutral-500) | `oklch(43.9% 0 0)` (neutral-600) |
| `--color-kumo-badge-orange` | `oklch(81.5% .197 76)` (orange-650) | `oklch(81.5% .197 76)` (orange-650) — **theme-invariant** |
| `--color-kumo-badge-inverted` | `oklch(14.5% 0 0)` | `#fff` |

The rule is mechanical: **light = the `-600` step, dark = the `-700` step** (one step darker in dark
mode, so the badge recedes against a dark surface). Two exceptions, both in the data: `badge-teal`
uses the custom `teal-650`/`teal-700`, and `badge-orange` is `orange-650` in **both** themes.

⚠ **The "subtle" badge variant is incomplete in the source.** Only **three** subtle inks exist —
`--text-color-kumo-badge-neutral-subtle`, `-orange-subtle`, `-teal-subtle`:

| Token | light | dark |
|---|---|---|
| `--text-color-kumo-badge-neutral-subtle` | `oklch(26.9% 0 0)` (neutral-800) | `oklch(92.2% 0 0)` (neutral-200) |
| `--text-color-kumo-badge-orange-subtle` | `oklch(47% .157 37.304)` (orange-800) | `oklch(90.1% .076 70.697)` (orange-200) |
| `--text-color-kumo-badge-teal-subtle` | `oklch(43.7% .078 188.216)` (teal-800) | `oklch(91% .096 180.426)` (teal-200) |

There is **no** `blue-subtle`, `green-subtle`, `red-subtle`, or `purple-subtle` ink, and there is **no
`--color-kumo-badge-*-subtle` background token at all** — yet `_classes.json` contains a compiled
utility `.bg-[var(--color-kumo-badge-orange-subtle)]` that references one. **That reference is
dangling** (§11). If you need a full subtle badge family, you must author the missing tokens; say so
in your changelog rather than pretending they were mined.

`facts.json` observes **136 raw / 17 deduped** badge elements across 8 pages, so badges are a real,
heavily-used component — but `usage.statusIntent` is `{}` (empty), meaning the extractor could not
attribute any badge to a specific intent. Which hue maps to which meaning is **not in the data**.

---

## 8. Data-visualization palette

`--cf-sequential-0` … `--cf-sequential-13` — a **14-color categorical set** in the primitive layer:

| # | Hex | | # | Hex |
|---|---|---|---|---|
| 0 | `#3E8EFF` | | 7 | `#423979` |
| 1 | `#104858` | | 8 | `#29A456` |
| 2 | `#E46E0A` | | 9 | `#870531` |
| 3 | `#6B1687` | | 10 | `#BA8700` |
| 4 | `#F8528A` | | 11 | `#134C28` |
| 5 | `#003E93` | | 12 | `#C768E6` |
| 6 | `#FD5548` | | 13 | `#880C02` |

**Status: present in the token layer, usage UNCONFIRMED.** `facts.json` reports
`charts.chartTokenCount: 0` and `charts.palette: []` — the chart extractor attributed **zero** tokens
to charts — while simultaneously reporting `markupSignals: { rechartsRoot: 10, svgChartHints: 35, canvas: 1 }`.
So charts *are* rendered (Recharts), but the extractor could not prove these tokens feed them.

Two honest caveats before you adopt this set:
- Despite the name, this is **not a sequential ramp** — it is a categorical/qualitative set (hues jump: blue, teal, orange, purple, pink…). Do not use it for an ordered scale.
- It is **theme-invariant hex** with no dark-mode variant. Several entries (`#104858`, `#003E93`, `#880C02`, `#134C28`) are very dark and will disappear against `--color-kumo-canvas` in dark mode (`oklch(10% 0 0)`).

**There is no themed chart token family in this design system.** If you need one, you are authoring it,
not porting it.

---

## 9. Accessibility & contrast

All ratios below are **computed from the resolved token values** (OKLCH → sRGB → WCAG 2.x relative
luminance). They are measurements, not estimates.

### 9.1 Ink on surfaces

| Ink | Theme | on `base` | on `canvas` | on `elevated` | Verdict |
|---|---|---|---|---|---|
| `text-kumo-strong` | light | **19.79** | 19.10 | 18.68 | AAA |
| | dark | **18.31** | 19.72 | 19.44 | AAA |
| `text-kumo-default` | light | **17.91** | 17.28 | 16.91 | AAA |
| | dark | **17.53** | 18.88 | 18.61 | AAA |
| `text-kumo-subtle` | light | **4.73** | 4.57 | 4.47 ⚠ | AA on base/canvas; **drops below 4.5 on `elevated`** |
| | dark | **7.37** | 7.94 | 7.83 | AAA |
| `text-kumo-link` / `-info` | light | **8.84** | 8.53 | 8.34 | AAA |
| | dark | **7.25** | 7.81 | 7.70 | AAA |
| `text-kumo-danger` | light | **6.42** | 6.19 | 6.06 | AA |
| | dark | **6.61** | 7.12 | 7.02 | AA / AAA |
| `text-kumo-success` | light | **7.58** | 7.31 | 7.15 | AAA |
| | dark | **14.93** | 16.08 | 15.85 | AAA |
| `text-kumo-warning` | light | **6.87** | 6.63 | 6.49 | AA |
| | dark | **12.19** | 13.13 | 12.94 | AAA |
| `text-kumo-placeholder` | light | **2.59** ❌ | 2.50 ❌ | 2.45 ❌ | **FAILS AA** |
| | dark | **4.04** ⚠ | 4.35 ⚠ | 4.29 ⚠ | Below AA (4.5); clears 3:1 only |
| `text-kumo-inactive` | light | **1.48** ❌ | 1.43 ❌ | 1.40 ❌ | **FAILS everything** |
| | dark | **2.45** ❌ | 2.64 ❌ | 2.60 ❌ | **FAILS everything** |
| `text-kumo-brand` (`#f6821f`) | light | **2.58** ❌ | 2.49 ❌ | 2.44 ❌ | **FAILS AA** |
| | dark | **7.40** | 7.97 | 7.86 | AAA |

**Four hard rules fall out of this table:**

1. **`--text-color-kumo-brand` (`#f6821f`) must never be used as readable text on a light surface.**
   2.58:1. It fails AA for normal text *and* the 3:1 bar for large text. It is a logo/decoration color
   in light mode. In dark mode it is fine (7.40:1). If you need brand-colored readable text in light,
   use `--text-color-kumo-link` or darken the orange — and record that as your addition.
2. **`--text-color-kumo-inactive` is not *readable* text — but it **is** the disabled token.**
   1.48:1 light / 2.45:1 dark: it fails every threshold, so **never use it for text a user must read** —
   no body copy, captions, metadata, or merely de-emphasized-but-live labels. **However, WCAG 1.4.3 (and
   1.4.11) explicitly exempt disabled/inactive UI components and their labels from the contrast
   minimums**, and that exemption is exactly this token's job — §4.1 calls it "deepest de-emphasis,
   decorative/inert glyphs." The recipe layer binds disabled state to it throughout
   (`design-system/components/data-display.css` for disabled rows and the em-dash empty cell, plus
   `badges-status.css`, `navigation.css`, `tabs-segmented.css` in the same folder, and
   `design-system/foundations/iconography.md` for disabled icons and icon buttons). **That is not a
   violation.** The
   captured markup also shows the alternative — `disabled:text-kumo-subtle`, observed on all 8 pages —
   which clears AA. **The rule of thumb:** if the disabled label still carries information the user has
   to read (a greyed-out option's name), use `--text-color-kumo-subtle`; if it is inert chrome (a greyed
   icon, an em-dash placeholder), use `--text-color-kumo-inactive`.
3. **`--text-color-kumo-placeholder` fails AA in both themes** (2.59 light / 4.04 dark). WCAG treats
   placeholder text as text. **Never encode required information in a placeholder** — always ship a
   real `<label>`. (The source does: `facts.json` shows 4 `label > text-base` occurrences.)
4. **`text-kumo-subtle` on `elevated` is 4.47:1 — a hair under AA.** Inside popovers/menus/dialogs
   (which use `elevated`), promote secondary text to `text-kumo-default`.

### 9.2 Intent ink on its own tint (the alert/callout pairing)

| Pairing | light | dark |
|---|---|---|
| `text-kumo-danger` on `bg-kumo-danger-tint` | **5.26** AA | **3.48** ⚠ large-text only |
| `text-kumo-warning` on `bg-kumo-warning-tint` | **6.40** AA | **3.14** ⚠ large-text only |
| `text-kumo-info` on `bg-kumo-info-tint` | **7.25** AAA | **3.94** ⚠ large-text only |
| `text-kumo-success` on `bg-kumo-success-tint` | **6.68** AA | **7.56** AAA |

**The intent triplets are AA-clean in light mode but three of four fall below 4.5:1 in dark mode.**
`danger` (3.48), `warning` (3.14) and `info` (3.94) on their tints clear only the 3:1 large-text /
non-text bar. If your alert body copy is normal-size (`text-sm` = 13px — and `text-sm` is by far the
dominant type class, 914 uses), **you are below AA in dark mode.** Mitigations, in order of preference:

- Render alert body copy in `--text-color-kumo-default` and reserve the intent ink for the title/icon.
- Or darken the `-tint` backgrounds in dark mode (a deviation — document it).
- Do not simply bump the font size to 18px to squeak past "large text."

### 9.3 Non-text contrast (WCAG 1.4.11 — 3:1)

| Element | light | dark |
|---|---|---|
| `--color-kumo-focus` vs `base` | **19.67** ✅ | **15.80** ✅ |
| `--color-kumo-brand` vs `base` | **4.53** ✅ | **3.31** ✅ (thin margin) |
| `--color-kumo-line` vs `base` | **1.24** ❌ (composited) | **1.51** ❌ |
| `--color-kumo-hairline` vs `base` | **1.21** ❌ | **1.27** ❌ |
| `--color-kumo-fill` vs `base` | **1.26** ❌ | **1.27** ❌ |
| `--color-kumo-interact` vs `base` | **1.48** ❌ | **1.84** ❌ |

**This is expected and mostly fine**, but the boundary matters:

- Dividers, card outlines, and table rules are **decorative** — WCAG 1.4.11 does not apply. `line` /
  `hairline` at ~1.2–1.5:1 are legitimate.
- But **1.4.11 *does* apply to the visible boundary of a control** (input, checkbox, unfilled button).
  `--color-kumo-fill` at **1.26:1** is **not** a compliant control border on its own. The source
  compensates by relying on the **focus ring** for the interactive affordance. If you outline a
  resting input with `border-kumo-fill` and nothing else, **that input's boundary is not perceivable**
  to low-vision users. Pair it with a label + adequate fill contrast, or use a stronger border.
- **`--color-kumo-focus` is excellent** (19.67 / 15.80). It is the accessibility backbone of this
  system. Never remove it (§10.3).
- `--color-kumo-brand` as a non-text indicator in dark mode is **3.31:1** — it clears 3:1 by 0.31.
  Do not thin the 2px active-tab bar or shrink it further.

### 9.4 Focus is the load-bearing accessibility mechanism

From the captured markup, focus is expressed with **three** distinct rings, and they compose:

| Utility | Token | Observed |
|---|---|---|
| `focus:ring-kumo-focus/50` | `--color-kumo-focus` @ 50% | ×10 |
| `focus-within:ring-kumo-focus/50` | `--color-kumo-focus` @ 50% | ✓ |
| `not-disabled:hover:ring-kumo-focus/25` | `--color-kumo-focus` @ 25% | ✓ (hover pre-echo of focus) |
| `focus-visible:ring-2 focus-visible:ring-kumo-brand` | `--color-kumo-brand` | ×11 |
| `has-[input[aria-invalid=true]]:ring-kumo-danger` | `--color-kumo-danger` | ×4 |

The model: **`focus` (neutral, max contrast) for the generic focus/hover ring; `brand` (blue) for the
keyboard `:focus-visible` ring; `danger` for the invalid ring.** Note `--color-kumo-focus` **inverts**
(light `oklch(15% 0 0)` near-black / dark `oklch(93.5% 0 0)` near-white) so the ring is always maximally
contrasted against its own theme. Reproduce all three; they are the reason this UI is keyboard-usable.

---

## 10. Usage rules

### 10.1 The decision table — which token for which property

| I am setting… | Use | Never use |
|---|---|---|
| Page background | `--color-kumo-canvas` | a `--text-color-*` token |
| Card / panel / sidebar background | `--color-kumo-base` | `--color-kumo-elevated` (it's for popovers) |
| Popover / dropdown / dialog background | `--color-kumo-elevated` | `--color-kumo-overlay` (that's a hover wash) |
| Input / select background | `--color-kumo-control` | `--color-kumo-base` (breaks in dark: 20.5% vs 17%) |
| Inset well / code block / table head | `--color-kumo-recessed` | — |
| Row / menu-item hover | `--color-kumo-tint` (or `--color-kumo-overlay` **on `base` only**) | `--color-kumo-fill` (too strong) |
| Secondary button / chip / skeleton face | `--color-kumo-fill` → hover `--color-kumo-fill-hover` ⚠(§11) | — |
| Pressed / active fill | `--color-kumo-interact` | — |
| Body text | `--text-color-kumo-default` | `--color-kumo-*` anything |
| Heading / hovered text | `--text-color-kumo-strong` | — |
| Secondary / de-emphasized text a user must **read** | `--text-color-kumo-subtle` | `--text-color-kumo-inactive` (1.48:1 — §9.1) |
| **Disabled** control text, inert glyphs, em-dash placeholders | `--text-color-kumo-inactive` (WCAG 1.4.3 exempts disabled components — §9.1); `--text-color-kumo-subtle` if the disabled label still has to be read | — |
| Placeholder | `--text-color-kumo-placeholder` | anything load-bearing |
| Link | `--text-color-kumo-link` | `--text-color-kumo-brand` (2.58:1 in light — §9.1) |
| Border / divider / rule | `--color-kumo-line` | `--color-kumo-hairline` unless you need opaque |
| Focus ring (generic) | `--color-kumo-focus` @ 50% | — |
| Focus ring (`:focus-visible`) | `--color-kumo-brand` | — |
| Invalid ring | `--color-kumo-danger` | — |
| Primary button face | `--color-kumo-brand` (via the emphasis vars, §10.2) | — |
| Primary button label | **literal white** (the source uses `!text-white`) | `--text-color-kumo-inverse` (it's dark in dark mode — 20.5%) |
| Alert/callout body | bg `--color-kumo-<intent>-tint` + ink `--text-color-kumo-<intent>` ⚠ dark: §9.2 | ink on the **solid** — invisible (§7.1) |
| Status dot / solid badge | `--color-kumo-<intent>` or `--color-kumo-badge-<hue>` | — |
| Shadow color | `--color-kumo-shadow-drop` / `-shadow-edge` | a neutral primitive |
| Anything, ever | a **semantic** token | a **primitive** (`--color-blue-600`, `--cf-orange-5`) |

### 10.2 Derived tokens — the primary button

The primary ("emphasis") button does **not** flat-fill with `--color-kumo-brand`. It composes four
**derived** values, mined verbatim from the rendered DOM, all `color-mix`ed from the brand token:

```css
/* Observed on the emphasis button, inline on the element.
   All four derive from --color-kumo-brand, so they re-theme for free. */
--kumo-button-emphasis-bg:             color-mix(in oklch, var(--color-kumo-brand), white 30%);
--kumo-button-emphasis-ring:           color-mix(in oklch, var(--color-kumo-brand), black 10%);
--kumo-button-emphasis-gradient-start: color-mix(in oklch, var(--color-kumo-brand), white 15%);
--kumo-button-emphasis-gradient-end:   var(--color-kumo-brand);
```

Assembled: a `bg-(--kumo-button-emphasis-bg)` base + a `ring-(--kumo-button-emphasis-ring)` + an
absolutely-positioned inner layer running `bg-linear-to-b` from `…-gradient-start` to `…-gradient-end`,
which on hover swaps its `from` to `…-emphasis-bg` (flattening the gradient). The label is `!text-white`.

**These four are not in `tokens/colors.css`** — they are element-scoped custom properties in the DOM.
The mined token file does not carry them. They are recorded here so your button recipe can reproduce
the real thing; add them to your `@theme` layer yourself.

### 10.3 Do / Don't

**Do**
- Reference `var(--color-kumo-*)` / `var(--text-color-kumo-*)` and let the theme selector do the work. Never write a per-theme value into a component.
- Choose the token by **property** (`--color-*` = bg/border/ring, `--text-color-*` = ink). §2.2.
- Put intent ink on the intent **tint**, never on the intent **solid**. §7.1.
- Keep all three focus rings (`focus` / `focus-visible`+brand / invalid+danger). §9.4.
- Prefer `--color-kumo-line` over `--color-kumo-hairline` for dividers — it's alpha and composites on any surface. §5.
- Trust the **resolved** value, not the `var()` fallback literal. §0, §11.
- Use `--color-kumo-contrast` + `--text-color-kumo-inverse` **as a pair** for inverted surfaces. §6.

**Don't**
- ❌ Don't use `--text-color-kumo-brand` (`#f6821f`) as readable text on light surfaces — **2.58:1**. §9.1.
- ❌ Don't use `--text-color-kumo-inactive` for any text a user must **read** — **1.48:1 / 2.45:1.** Use `--text-color-kumo-subtle` for live de-emphasized text. It *is* the right token for **disabled** controls and inert glyphs (WCAG 1.4.3 exempts them, and every recipe uses it there). §9.1.
- ❌ Don't assume "elevated" means "lighter." It's *darker* than `canvas` in light mode. §3.1.
- ❌ Don't apply `hover:bg-kumo-overlay` to anything sitting on `canvas` — in light mode `overlay` and `canvas` are the same value and the hover vanishes. §3.1.
- ❌ Don't rely on `--color-kumo-fill-hover` in dark mode — it resolves to the same value as `fill`. §11.
- ❌ Don't stack two `--color-kumo-line` borders in light mode — it's a 10%-alpha black and they'll double to ~19%. §5.
- ❌ Don't reach into primitives (`--color-neutral-800`, `--cf-blue-5`, `--color-cl1-*`). They're theme-invariant; a component that touches one will not re-theme.
- ❌ Don't build a separate "kumo theme." `.theme-kumo` is byte-identical to `[data-mode=dark]`. §1.2.
- ❌ Don't invent `banner-danger`, `banner-success`, or the missing `badge-*-subtle` tokens and present them as mined. They don't exist. §7.2, §7.3.

---

## 11. ⚠ Data anomalies in the source (verified, reproduce with care)

These are **defects in the upstream stylesheet**, found by resolving every `var()` chain against the
primitive definitions. Listed so you don't faithfully reproduce a bug — or "fix" something that isn't one.

### 11.1 Three stale `var()` fallback literals — all of them in `.theme-kumo`

**First, where fallbacks can even exist.** `tokens/colors.css` has four theme blocks: `:root` (lines
9–637, light), `[data-mode=dark]` (639–1279), `.theme-fedramp` (1281–1286), and `.theme-kumo`
(1288–1346). **Every `var(--ref, <literal>)` pair in the file lives in the `.theme-kumo` block.** The
light and dark blocks store fully-resolved literals and contain no fallbacks at all; fedramp is three
plain hex values. So **the stale-fallback hazard exists only under `.theme-kumo`** — no row below can
be attributed to "light" or "dark", and there is nothing to misread in those two blocks.

The browser resolves `--ref` and never reads `<literal>`. In **three** cases the literal disagrees with
the primitive it points at — so reading the fallback gives you the wrong color:

| Token (all `.theme-kumo`) | Line | Points at | Fallback literal says | Primitive **actually** is |
|---|---|---|---|---|
| `--color-kumo-badge-purple` | 1295 | `--color-purple-700` | `oklch(50.8% .118 165.612)` — **an emerald!** | `oklch(49.6% .265 301.924)` |
| `--color-kumo-control` | 1305 | `--color-neutral-900` | `oklch(21% .006 285.885)` — chromatic | `oklch(20.5% 0 0)` — achromatic |
| `--color-kumo-fill-hover` | 1310 | `--color-neutral-800` | `oklch(37.1% 0 0)` — that is neutral-**700** | `oklch(26.9% 0 0)` |

`badge-purple` is the loudest, and its origin is one line away. Compare the row it was copy-pasted
**from**, whose fallback is correct:

| Token | Line | Points at | Fallback literal | Primitive |
|---|---|---|---|---|
| `--color-kumo-badge-green` | 1291 | `--color-emerald-700` | `oklch(50.8% .118 165.612)` ✅ agrees | `oklch(50.8% .118 165.612)` |

The purple fallback is byte-identical to the green one — someone duplicated the `badge-green`
declaration and re-pointed the `var()` but not the literal. Anyone who reads `colors.css` naively and
takes the fallback will ship a **green "purple" badge**. **The `var()` reference is authoritative; the
computed value confirms purple** (`oklch(49.6% .265 301.924)`, §7.3).

### 11.2 `--color-kumo-fill-hover` is a no-op in dark mode

This one is real, and it is visible in the resolved values — no `var()` reading required. Under
`[data-mode=dark]`, `--color-kumo-fill` is `oklch(26.9% 0 0)` (`colors.css:944`) and
`--color-kumo-fill-hover` is **also** `oklch(26.9% 0 0)` (`colors.css:945`). Two plain literals,
identical. So in dark mode, **hovering a `fill` surface produces no visual change.** A genuine upstream
bug.

The `.theme-kumo` declaration at `colors.css:1310` is where the lost intent is legible:

```css
--color-kumo-fill-hover: var(--color-neutral-800, oklch(37.1% 0 0));
```

It *points* at `--color-neutral-800` (`26.9%` — the same value as `fill`, hence the no-op), but its
stale fallback carries `37.1%`, which is `--color-neutral-700`'s value. Someone meant `-700` and wired
`-800`. Recommended fix (a deviation — document it): point dark/kumo `fill-hover` at
`--color-neutral-700` (`oklch(37.1% 0 0)`), which matches the light-mode delta.

### 11.3 Seven dangling references — tokens used but never defined

Seven custom properties are referenced but defined nowhere. (Confirmed against `facts.json` →
`tokens.names`, 551 entries: not one of the seven is present.) They split into **two mechanically
different groups**, and the difference changes what you do about them.

**(a) Three phantom *primitives*, referenced as `var()` fallback targets by other tokens inside
`.theme-kumo`.** These are token-to-token references inside `tokens/colors.css` itself — no compiled
utility is involved. Each has **exactly one call site**, so each falls through to a single, unambiguous
literal:

| Phantom primitive | Sole call site | Consequence |
|---|---|---|
| `--color-kumo-neutral-25` | `--color-kumo-contrast` (kumo, `colors.css:1273`) | Falls through to `oklch(98.5% 0 0)`. Single call site — unambiguous. |
| `--color-kumo-neutral-150` | `--color-kumo-focus` (kumo, `colors.css:1280`) | Falls through to `oklch(93.5% 0 0)`. Single call site — unambiguous. |
| `--color-kumo-neutral-800` | `--color-kumo-tint` (kumo, `colors.css:1292`) | Falls through to `oklch(26.9% 0 0)`. Single call site — unambiguous. |

⚠ Do not confuse the phantom `--color-kumo-neutral-800` with **`--color-neutral-800`** — a real,
defined Tailwind primitive that **five** kumo tokens point at: `fill` (`colors.css:1278`), `fill-hover`
(1279), `hairline` (1281), `overlay` (1286) and `tip-stroke` (1294). Same number, different namespace,
opposite existence.

One caveat on the value: the real `--color-neutral-800` is `oklch(26.9% 0 0)`, and four of those five
carry that literal as their inline fallback — but **`--color-kumo-fill-hover` does not**. Its fallback is
`oklch(37.1% 0 0)` (§11.1, §11.2), so `26.9%` describes the *resolved* color of all five call sites but
**not** the text you will read at all five. Resolve the `var()`; do not trust the fallbacks.

**(b) Four phantom *tokens*, referenced from the utility/markup layer.** These have no fallback to fall
through to, so they resolve to **nothing**:

| Dangling ref | Referenced by | Consequence |
|---|---|---|
| `--color-kumo-subtle` | compiled utility `.bg-[radial-gradient(var(--color-kumo-subtle)_1px,transparent_1px)]` in `_classes.json` | **Resolves to nothing.** The dot grid has no color. |
| `--color-kumo-badge-orange-subtle` | compiled utility `.bg-[var(--color-kumo-badge-orange-subtle)]` in `_classes.json` | **Resolves to nothing.** Only the `--text-color-*` twin exists (§7.3). |
| `--color-kumo-ring` | the class `ring-kumo-ring` in captured markup (`capture/billing.html`) — **not** compiled into `_classes.json` | Tailwind never generated the utility, because the token does not exist. The class is inert — it emits no declaration at all. |
| `--text-color-kumo-disabled` | the class `disabled:text-kumo-disabled` in captured markup (4 of 8 pages) — **not** compiled into `_classes.json` | Inert, same reason. The element keeps its inherited color. Use `disabled:text-kumo-subtle`, or `--text-color-kumo-inactive` for genuinely inert content (§9.1). |

Note the asymmetry inside group (b): Tailwind emits arbitrary-value utilities like `bg-[var(…)]` without
checking that the variable exists, so those two *do* get compiled and then paint nothing; the two bare
class names are never compiled in the first place. Neither paints. **`facts.json` carries no per-class
usage counts for any of these four**, so treat any "N uses" figure for them as unsourced — the presence
claims above come from `_classes.json` and the captured HTML.

**Recommended port:** define **all three** group-(a) primitives. Each has exactly one call site and one
unambiguous value, so there is nothing to guess and nothing to silently change:

```css
--color-kumo-neutral-25:  oklch(98.5% 0 0);  /* → --color-kumo-contrast (kumo) */
--color-kumo-neutral-150: oklch(93.5% 0 0);  /* → --color-kumo-focus    (kumo) */
--color-kumo-neutral-800: oklch(26.9% 0 0);  /* → --color-kumo-tint     (kumo) */
```

Then **drop or author** the four group-(b) refs. Do not ship utilities — or class names — that resolve
to nothing.

### 11.4 Tokens defined but never consumed

`--color-kumo-shadow-drop`, `--color-kumo-shadow-edge`, and `--color-kumo-tip-shadow` are defined in
all themes but **no class in `_classes.json` references them** — they are presumably consumed by an
elevation layer that was not captured (`tokens/elevation.css` does **not exist** in this run; only
`colors.css` and `typography.css` were emitted). Their values are exact and usable:

| Token | light | dark |
|---|---|---|
| `--color-kumo-shadow-drop` | `oklch(0% 0 0 / .08)` | `oklch(0% 0 0 / .3)` |
| `--color-kumo-shadow-edge` | `oklch(0% 0 0 / .12)` | `oklch(100% 0 0 / .1)` — **white**, not black |
| `--color-kumo-tip-shadow` | `oklch(92.8% .006 264.531)` (gray-200) | `transparent` |

Note `shadow-edge` flips from a 12% **black** edge in light to a 10% **white** edge in dark — the
classic "dark-mode elevation is a highlight, not a shadow" technique. And `tip-shadow`/`tip-stroke`
are **mutually exclusive**: light gets a shadow + transparent stroke; dark gets a stroke + transparent
shadow. Reproduce both.

---

## 12. Core palette — the 16 tokens that carry the UI

If you port nothing else, port these.

| Token | light (resolved) | dark (resolved) | Role |
|---|---|---|---|
| `--color-kumo-canvas` | `oklch(98.75% 0 0)` | `oklch(10% 0 0)` | Page background |
| `--color-kumo-base` | `#fff` | `oklch(17% 0 0)` | Card / panel surface |
| `--color-kumo-elevated` | `oklch(98% 0 0)` | `oklch(12% 0 0)` | Popover / dialog surface |
| `--color-kumo-control` | `#fff` | `oklch(20.5% 0 0)` | Input field surface |
| `--color-kumo-tint` | `oklch(97% 0 0)` | `oklch(26.9% 0 0)` | Hover wash |
| `--color-kumo-fill` | `oklch(92.2% 0 0)` | `oklch(26.9% 0 0)` | Neutral filled element |
| `--color-kumo-line` | `oklch(14.5% 0 0 / .1)` | `oklch(32% 0 0)` | Border / divider |
| `--color-kumo-focus` | `oklch(15% 0 0)` | `oklch(93.5% 0 0)` | Focus ring (inverts) |
| `--color-kumo-brand` | `oklch(57.72% .2324 260)` | `oklch(51.948% .2324 260)` | Brand **fill** (blue) |
| `--text-color-kumo-default` | `oklch(20.5% 0 0)` | `oklch(97% 0 0)` | Body text |
| `--text-color-kumo-strong` | `oklch(14.5% 0 0)` | `oklch(98.5% 0 0)` | Headings / hover |
| `--text-color-kumo-subtle` | `oklch(55.6% 0 0)` | `oklch(70.8% 0 0)` | Secondary + disabled text |
| `--text-color-kumo-link` | `oklch(42.4% .199 265.638)` | `oklch(70.7% .165 254.624)` | Links |
| `--text-color-kumo-brand` | `#f6821f` | `#f6821f` | Brand **ink** (orange, theme-invariant) |
| `--color-kumo-danger` | `oklch(63.7% .237 25.331)` | `oklch(57.7% .245 27.325)` | Danger fill |
| `--text-color-kumo-danger` | `oklch(50.5% .213 27.518)` | `oklch(70.4% .191 22.216)` | Danger ink |

---

## 13. Using this in Tailwind CSS v4 + shadcn/ui

### 13.1 Bridge the theme selector

The source switches on `[data-mode=dark]`. shadcn/ui + `next-themes` switch on `.dark`. Emit **both**
so the ported tokens work under either, and teach Tailwind's `dark:` variant about them:

```css
/* app/globals.css */
@import "tailwindcss";

/* Make `dark:` respond to .dark (next-themes) AND [data-mode=dark] (source parity). */
@custom-variant dark (&:where(.dark, .dark *, [data-mode="dark"], [data-mode="dark"] *));
```

```tsx
// app/layout.tsx — next-themes writes class="dark" on <html>
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
```

`enableSystem={false}` matches the source (`facts.json`: `prefersColorScheme: false` — the dashboard
never auto-switches). Flip it to `true` only as a deliberate improvement.

### 13.2 Token layer — paste the semantic layer, resolved

Import `tokens/colors.css` **but** apply the §11 corrections first (define the three missing
`--color-kumo-neutral-*` primitives; fix dark `fill-hover`). Then register the semantic tokens with
Tailwind so utilities generate:

```css
/* Expose the semantic tokens to Tailwind v4's utility generator.
   @theme inline = "these are already-themed vars, don't snapshot their values". */
@theme inline {
  /* surfaces → bg-*, border-*, ring-* */
  --color-canvas:    var(--color-kumo-canvas);
  --color-base:      var(--color-kumo-base);
  --color-elevated:  var(--color-kumo-elevated);
  --color-recessed:  var(--color-kumo-recessed);
  --color-control:   var(--color-kumo-control);
  --color-tint:      var(--color-kumo-tint);
  --color-fill:      var(--color-kumo-fill);
  --color-line:      var(--color-kumo-line);
  --color-focus:     var(--color-kumo-focus);
  --color-brand:     var(--color-kumo-brand);

  /* --- shadcn/ui's required names, mapped onto kumo roles --- */
  --color-background:         var(--color-kumo-canvas);
  --color-foreground:         var(--text-color-kumo-default);
  --color-card:               var(--color-kumo-base);
  --color-card-foreground:    var(--text-color-kumo-default);
  --color-popover:            var(--color-kumo-elevated);   /* §3: elevated = popover surface */
  --color-popover-foreground: var(--text-color-kumo-default);
  --color-primary:            var(--color-kumo-brand);
  --color-primary-foreground: #fff;                          /* §10.1: source uses literal !text-white */
  --color-secondary:          var(--color-kumo-fill);
  --color-secondary-foreground: var(--text-color-kumo-default);
  --color-muted:              var(--color-kumo-tint);
  --color-muted-foreground:   var(--text-color-kumo-subtle);
  --color-accent:             var(--color-kumo-tint);
  --color-accent-foreground:  var(--text-color-kumo-strong);
  --color-destructive:        var(--color-kumo-danger);
  --color-destructive-foreground: #fff;
  --color-border:             var(--color-kumo-line);
  --color-input:              var(--color-kumo-fill);
  --color-ring:               var(--color-kumo-focus);       /* §9.4 */

  /* radius: the source's dominant radius is rounded-lg (946 uses) = 0.5rem */
  --radius: 0.5rem;
}
```

⚠ `--color-primary-foreground: #fff` is a **literal**, not a token, and that is correct — see §10.1.
`--text-color-kumo-inverse` resolves to a *dark* gray in dark mode and would be unreadable on the blue
brand fill.

### 13.3 Variants with class-variance-authority

Map the intent triplets (§7.1) directly onto `cva` variants. Note the **ink-on-tint** pairing:

```ts
// components/ui/alert.tsx
import { cva } from "class-variance-authority";

export const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      intent: {
        // bg = the -tint, text = the --text-color-* ink. NEVER ink-on-solid (§7.1).
        danger:  "bg-kumo-danger-tint  text-kumo-danger  border-kumo-danger/20",
        warning: "bg-kumo-warning-tint text-kumo-warning border-kumo-warning/20",
        success: "bg-kumo-success-tint text-kumo-success border-kumo-success/20",
        info:    "bg-kumo-info-tint    text-kumo-info    border-kumo-info/20",
      },
    },
    defaultVariants: { intent: "info" },
  }
);
```

⚠ **Dark-mode caveat (§9.2):** `danger` (3.48:1), `warning` (3.14:1) and `info` (3.94:1) fall below AA
on their tints in dark mode at `text-sm`. Either render the body copy in `text-kumo-default` and use the
intent ink only on the title/icon, or darken the tints in dark. Do not ship this as-is if you need AA.

Badges are a **hue** family, not an intent family (§7.3) — model them separately:

```ts
export const badgeVariants = cva("inline-flex items-center rounded-full px-1.5 py-0.5 text-xs", {
  variants: {
    // Solid fills. Light = -600 step, dark = -700 step — the token handles it.
    tone: {
      blue: "bg-kumo-badge-blue text-white",
      green: "bg-kumo-badge-green text-white",
      red: "bg-kumo-badge-red text-white",
      purple: "bg-kumo-badge-purple text-white",
      teal: "bg-kumo-badge-teal text-white",
      neutral: "bg-kumo-badge-neutral text-white",
      orange: "bg-kumo-badge-orange text-kumo-badge-orange-subtle",
      inverted: "bg-kumo-badge-inverted text-kumo-badge-inverted", // 19.79:1 / 21.00:1 — §6
    },
  },
  defaultVariants: { tone: "neutral" },
});
```

Only `neutral`, `orange`, and `teal` have a *subtle* ink token upstream (§7.3). A full subtle variant
requires tokens you author yourself — mark them as additions.

### 13.4 Focus, everywhere

Bake the three-ring model (§9.4) into your shared button/input base class:

```ts
const focusRing = [
  "focus:outline-none focus:ring-kumo-focus/50",
  "focus-visible:ring-2 focus-visible:ring-kumo-brand",
  "aria-invalid:ring-kumo-danger",
  "not-disabled:hover:ring-kumo-focus/25",
].join(" ");
```

### 13.5 Icons

`lucide-react`. `facts.json` observes **62 unique icons / 476 SVG uses**, `dominantStyle: "fill"`, with
**12px the dominant size** (196 uses), then 16px (42), 14px (22), 18px (13). Color icons with the **ink**
namespace — `text-kumo-subtle`, `text-kumo-default` — never with `--color-kumo-*`. Lucide is
stroke-based while this source is fill-dominant, so expect a slightly lighter optical weight; compensate
with `strokeWidth={2}` at 12–14px rather than switching icon libraries.

### 13.6 Component scoping

Recipes in this design system are authored under a `.ds` root (enforced downstream by
`scope-components.js`). The token layer itself is **not** scoped — `:root` / `[data-mode=dark]` /
`.dark` must stay at the document level so tokens cascade into portalled content (shadcn dialogs,
popovers, and toasts render outside your React tree via Radix portals). **If you scope the tokens to
`.ds`, every portal loses its colors.**

---

## 14. Provenance

| Claim class | Source |
|---|---|
| Token names, per-theme raw values | `design-system/tokens.json`, `design-system/tokens/colors.css` |
| Resolved values | `var()` chains resolved against the un-scoped primitive bucket; cross-checked against `capture/computed-tokens.json` |
| Property/state → token mapping | `capture/_classes.json` (900 selectors) |
| Utility usage counts, element counts, icon/type/radius stats | `capture/facts.json` (8 pages) |
| Emphasis-button derived vars | element-scoped custom properties in `capture/home-overview.html` |
| Contrast ratios | computed OKLCH → sRGB → WCAG 2.x relative luminance, from resolved values |
| Build classification | `capture/classification.json` (`utility-compiled`, `computedStyleMandatory: true`) |

**Not covered by this run:** `tokens/elevation.css`, `tokens/spacing.css`, and `tokens/motion.css` were
**not emitted** — only `colors.css` and `typography.css` exist. Shadow *colors* are documented above
(§11.4), but shadow *geometry* (offsets, blur, spread) is out of scope for this file and unmined. The
`typography` map in `tokens.json` is empty (`0 entries`) and `capture/_fonts.json` is empty
(`faceCount: 0`) — flagged for the typography/fonts docs, not this one.
