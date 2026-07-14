# Spacing, Sizing & Layout

Foundations for the **cloudflare-dashboard** design system (source: `https://dash.cloudflare.com`).

Everything below is traced to the deterministic mines. Each number carries a provenance flag:

| Flag | Meaning |
| --- | --- |
| **OBSERVED** | Read verbatim out of `facts.json`, `breakpoints-data.json`, or `computed-tokens.json`. |
| **DERIVED** | Computed from an OBSERVED token (e.g. `gap-2` → `calc(var(--spacing) * 2)` → `8px`), or counted from the captured post-render DOM (`capture/*.html`). Arithmetic only — nothing guessed. |
| **PRESCRIPTIVE** | Guidance we are adding. Not present in the capture. Clearly labelled where it appears. |

> ### Provenance note — read this first
>
> `classification.json` ranks this target **`utility-compiled`** (score `1.0`, ahead of `token-driven` at `0.813`) with
> `computedStyleMandatory: true`. The recommendation is explicit: *"Atomic/utility classes carry the values, not named
> tokens. The computed-style pass is the PRIMARY token source; mine utility usage for the scale."*
>
> Practical consequence: **there is no `tokens/spacing.css`, `tokens/elevation.css`, or `tokens/motion.css` in this run.**
> The emitter produced three token files — `tokens/colors.css`, `tokens/typography.css` and `tokens/index.css` — and it is
> `tokens/index.css` that carries the layout primitives, promoted to `:root`: `--spacing: .25rem`, the seven `--radius-*`
> steps, the thirteen `--container-*` steps, `--header-height`, `--sidebar-nav-width` and the three `--z-index-*` values.
> They are recorded there rather than in a per-concern file, and their *rationale* is this document.
>
> The source is not short of named custom properties: `facts.json → tokens.count` = **551**, spread over
> `tokens.groups` = `color: 249`, `cf: 136`, `text: 43`, `rdp: 16`, `code: 14`, `container: 13`, `tw: 13`, `font: 8`,
> `radius: 7`, … — and spacing *is* represented (`spacing: 1`, plus `radius: 7`, `container: 13`, `z: 3`,
> `header: 1`, `sidebar: 1`, `breakpoint: 1`). What the source lacks is a **named token per spacing step**: there is
> exactly *one* spacing token, `--spacing`, and every actual space in the product is a utility class computed from it
> (`calc(var(--spacing) * n)`). That is precisely what the `utility-compiled` verdict means — the *values* live in the
> class names, not in the token list.
>
> So the spacing/sizing layer in this document is reconstructed from three places, in priority order:
> 1. **`computed-tokens.json`** — the resolved Tailwind v4 theme vars the page actually computes (`--spacing`,
>    `--radius-*`, `--container-*`, `--header-height`, `--sidebar-nav-width`, `--z-index-*`). These are exact, and they
>    are the same values the emitter promoted into `tokens/index.css`.
> 2. **`facts.json → usage.spacing` / `usage.radius` / `usage.controlHeights`** — the utility-usage histogram, i.e. what
>    the product *actually reaches for*, with real counts.
> 3. **`breakpoints-data.json`** — the media/container-query mine.
>
> Where a value only exists as a utility class (never as a named var), we say so and give the DERIVED px.

---

## 1. The spacing scale

### 1.1 The base unit

**OBSERVED** — `computed-tokens.json`:

```
--spacing: .25rem      /* 4px @ 16px root */
```

This is the single generator for the whole spacing system. Every `p-*`, `m-*`, `gap-*`, `w-*`, `h-*`, `size-*`,
`space-*` and `inset-*` utility in the source resolves to `calc(var(--spacing) * n)`. Confirmed independently in
`_classes.json`, where even the *line-height* utilities are built from it:

```css
/* _classes.json — verbatim mapping, transcribed */
.text-xs\/4 { font-size: var(--text-xs); line-height: calc(var(--spacing) * 4); }  /* 16px */
.text-sm\/6 { font-size: var(--text-sm); line-height: calc(var(--spacing) * 6); }  /* 24px */
```

**Rule of the system: `n × 4px`.** Half-steps (`.5`) are legal and heavily used, giving an effective **2px sub-grid**.

### 1.2 Steps actually used (OBSERVED counts, DERIVED px)

Straight from `facts.json → usage.spacing` (the top-40 histogram; counts are raw occurrences across all **8** captured
pages). Steps are collapsed here across `p`/`m`/`gap` axes:

| Step | Token expression | px (DERIVED) | Where it shows up (OBSERVED classes + counts) |
| --- | --- | --- | --- |
| `0` | `calc(var(--spacing) * 0)` | **0** | `py-0` ×813, `p-0` ×253, `m-0` ×216, `pr-0` ×180, `mt-0` ×48, `gap-0` ×5 — resets, not rhythm |
| `0.5` | `calc(var(--spacing) * .5)` | **2** | `py-0.5` ×138, `px-0.5` ×11, `my-0.5` ×8 |
| `1` | `calc(var(--spacing) * 1)` | **4** | `gap-1` ×69, `px-1` ×34, `py-1` ×8, `pl-1` ×6 |
| `1.5` | `calc(var(--spacing) * 1.5)` | **6** | `px-1.5` ×136, `gap-1.5` ×75, `py-1.5` ×14 |
| `2` | `calc(var(--spacing) * 2)` | **8** | **`gap-2` ×1572** (the single most-used spacing utility in the entire capture), `py-2` ×24, `px-2` ×20, `pl-2` ×10 |
| `2.5` | `calc(var(--spacing) * 2.5)` | **10** | `gap-2.5` ×112, `py-2.5` ×15, `px-2.5` ×7 |
| `3` | `calc(var(--spacing) * 3)` | **12** | **`px-3` ×890** (the universal control inset), `gap-3` ×170, `my-3` ×32, `py-3` ×20, `mb-3` ×16 |
| `4` | `calc(var(--spacing) * 4)` | **16** | `gap-4` ×43, `px-4` ×34, `mt-4` ×28, `p-4` ×18, `mr-4` ×7 |
| `6` | `calc(var(--spacing) * 6)` | **24** | `px-6` ×8, `pb-6` ×8 |
| `7` | `calc(var(--spacing) * 7)` | **28** | `pl-7` ×176 — *single-purpose*: the sidebar sub-menu indent (see §6.3) |
| `8.5` | `calc(var(--spacing) * 8.5)` | **34** | `pr-8.5` ×18 — trailing room for a shortcut/affordance |

**Also present but below the facts.json top-40 cut** (DERIVED — counted directly from the captured DOM, all 8 pages):
`p-2` ×3 (8px), `py-4` ×1 (16px), `gap-5` ×2 (20px), `gap-6` ×5 (24px), `p-6` ×4 (24px), `px-8` (32px, responsive
only), `px-10` ×1 (40px), `p-16` ×2 / `py-16` ×1 (64px).

### 1.3 The canonical scale

Consolidating the above into the scale you should author against:

```
0 · 2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · 28 · 32 · 34 · 40 · 64   (px)
0 · .5 ·  1 ·  1.5 · 2 · 2.5 · 3 · 4 · 5 · 6 · 7 · 8 · 8.5 · 10 · 16  (steps)
```

**Read the shape of this data.** It is a *tight* scale. `gap-2` (8px) and `px-3` (12px) together account for **2,462**
of the ~5,000 spacing utilities mined. This dashboard is dense: 8px is the default gap between *anything* adjacent, and
12px is the default horizontal inset of *any* control. Do not import an airier rhythm (16/24 defaults) from another
design system — it will not look like Cloudflare.

### 1.4 Escape hatches (OBSERVED — do not clean these up silently)

Three off-scale arbitrary values survive in the source. They are optical corrections, not accidents:

| Class | Value | Count | Reading |
| --- | --- | --- | --- |
| `px-[11px]` | 11px | 24 | 12px inset minus a 1px border — keeps the *visual* inset at 12px on bordered controls. |
| `pl-[11px]` | 11px | 18 | Same correction, leading edge only. |
| `pt-[0.5px]` | 0.5px | 8 | Sub-pixel baseline nudge for icon/text optical centering. |

**PRESCRIPTIVE:** when you add a 1px border to a `px-3` control, use `px-[11px]` to hold the box the same size — that
is the pattern the source established.

---

## 2. Control heights

### 2.1 The real control heights

`facts.json → usage.controlHeights` is the mine that **already excludes square icon/avatar boxes**. This is the
authoritative set. (The values below are *counts*; the px are DERIVED from `--spacing: .25rem`.)

| Class | Height (DERIVED) | Uses (OBSERVED) | On `<button>` | On `<a>` | Role |
| --- | --- | --- | --- | --- | --- |
| `h-8` | **32px** | 24 | 16 | 8 | **Small / compact.** Toolbars, table actions, inline links-as-buttons. |
| `h-9` | **36px** | 32 | 26 | 6 | **Default.** The most-used interactive height in the product. |
| `h-10` | **40px** | 2 | 2 | — | **Large.** Rare; primary CTA / form submit. |

Source rows: `controlHeights = { "h-8": 24, "h-9": 32, "h-10": 2 }`, `controlHeightsByTag = { button: { h-8: 16, h-9: 26,
h-10: 2 }, a: { h-8: 8, h-9: 6 } }`.

**Three heights. That is the whole control ladder: 32 / 36 / 40.**

### 2.2 What was excluded, and why

- **Square boxes — excluded.** `facts.json → usage.squareBoxes = { "w-6 h-6": 2 }` and `usage.iconWidths = { "w-6": 2 }`.
  A `w-6 h-6` (**24px**) box is an icon/avatar frame, **not** a control height. Never quote 24px as a button size.
- **Raw `h-*` classes — includes non-controls.** `facts.json → usage.rawControlHeightClasses` is the *unfiltered* mine:
  `{ h-8: 33, h-9: 41, h-12: 44, h-14: 4, h-11: 7, h-10: 2 }`. The `h-11` (44px), `h-12` (48px) and `h-14` (56px) entries
  are **layout blocks and rows** (list rows, header slots), not controls — which is precisely why `controlHeights` drops
  them. Use `rawControlHeightClasses` for *row* sizing (§6.4), never for buttons.

### 2.3 Control height ↔ type size pairing (OBSERVED)

`facts.json → usage.buttonHeightTypePairs`:

| Pair | Count | Type size (OBSERVED, `computed-tokens.json`) |
| --- | --- | --- |
| `h-8 \| text-sm` | 8 | `--text-sm: 13px` |
| `h-8 \| text-base` | 8 | `--text-base: 14px` |
| `h-9 \| text-base` | 8 | `--text-base: 14px` |
| `h-10 \| text-base` | 2 | `--text-base: 14px` |

Note the scale is **not** the Tailwind default: `--text-base` is **14px** and `--text-sm` is **13px** here. `text-base`
is the control label size at every height; `text-sm` (13px) appears only at `h-8`, for the densest toolbars.

### 2.4 Control padding & gap (DERIVED — counted from the captured DOM across all 8 pages)

Joining each `<button>`/`<a>` that carries a control height with its padding, gap, radius and type classes:

| Height | Padding-x | Internal gap | Radius | Type | Occurrences | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| `h-8` (32px) | `px-3` (12px) | `gap-2` (8px) | `rounded-lg` | `text-sm` | 8 | button |
| `h-8` (32px) | `px-3` (12px) | `gap-1.5` (6px) | `rounded-lg` | `text-base` | 8 | button |
| `h-8` (32px) | `px-3` (12px) | `gap-1.5` (6px) | `rounded-lg` | `text-base` | 8 | a |
| `h-9` (36px) | `px-3` (12px) | `gap-1.5` (6px) | `rounded-lg` | `text-base` | 8 | button |
| `h-9` (36px) | `px-3` (12px) | `gap-1.5` (6px) | `rounded-lg` | `text-base` | 6 | a |
| `h-10` (40px) | `px-4` (16px) | `gap-2` (8px) | `rounded-lg` | `text-base` | 2 | button |
| `h-9` (36px) | `p-0` (0) | — | — | — | 18 | button (icon-only / unstyled wrapper) |

**The rules that fall out of this:**

- **`px-3` (12px) is the inset for `h-8` and `h-9` alike.** The height changes; the horizontal padding does not. Only
  `h-10` steps up to `px-4` (16px).
- **`gap-1.5` (6px) is the default icon↔label gap** inside a control; `gap-2` (8px) is used at the extremes (`h-8 text-sm`
  and `h-10`).
- **`rounded-lg` (8px) on every single sized control.** No exceptions in the capture.
- `h-9 p-0` ×18 — icon-only buttons keep the 36px box and drop padding entirely (the icon centers itself).

**Additional height found in markup but *not* in `facts.json`'s control mine (DERIVED, flag before you adopt):**
`h-6.5` (**26px**) `px-2` `gap-1` `rounded-md` `text-xs` ×6, and `h-6` (24px) `px-2.5` `gap-1` `rounded-full` `text-xs`
×1. The first reads as an extra-compact filter/chip button, the second as a pill/badge-link. Because `controlHeights`
excluded them, treat them as **badge-family**, not button-family (see `usage.elementTotalsDeduped.badge = 17`).

### 2.5 Inputs (OBSERVED, thin)

`facts.json → usage.elementTotalsDeduped.input = 15` (71 raw). The only `<input>` in the capture that carries sizing
classes uses `h-full px-3 rounded-none text-base` ×4 — i.e. it **fills its wrapper** (the wrapper owns the height and the
radius; the input owns only the 12px inset). The remaining 32 inputs carry no sizing classes at all (checkboxes/hidden).

**PRESCRIPTIVE:** size inputs to the `h-8` / `h-9` ladder with `px-3`, matching buttons. The source does not contradict
this — it simply delegates the box to a wrapper. **`textarea`, `select`, `radio` and `switch` are in
`facts.json → usage.notObserved` — this design system has NO observed coverage for them.** Anything you build there is
PRESCRIPTIVE.

### 2.6 Icon sizes inside controls (OBSERVED)

`facts.json → icons`: **476** SVG uses, **62** unique icons, `dominantStyle: "fill"`.

| Size | Uses | Note |
| --- | --- | --- |
| **12px** | **196** | **The dominant icon size.** This is the in-control icon. |
| 16px | 42 | Secondary in-control size |
| 14px | 22 | |
| 18px | 13 | |
| 24px | 4 | Matches the `w-6 h-6` box |
| 28px / 20px | 2 / 1 | |
| 48px, 93px | 9, 5 | `likelyLogosOrIllustrations: 39` — empty states / brand marks, not UI icons |
| 2px | 6 | Decorative dots/rules |

A **12px icon** inside an `h-8`/`h-9` control with a **6px gap** is the house style. That is a very small icon relative to
a 36px control — it is deliberate, and it is what makes the dashboard read as dense-but-calm. Do not upsize to 16px by
reflex.

---

## 3. Radius

### 3.1 The radius tokens (OBSERVED — `computed-tokens.json`; `facts.json → tokens.groups.radius = 7`, all seven shipped in `tokens/index.css`)

```
--radius-xs:   .125rem    /*  2px */
--radius-sm:   .25rem     /*  4px */
--radius-md:   .375rem    /*  6px */
--radius-lg:   .5rem      /*  8px */   ← THE DEFAULT
--radius-xl:   .75rem     /* 12px */
--radius-2xl:  1rem       /* 16px */
--radius-3xl:  1.5rem     /* 24px */
```

### 3.2 Which radius the data actually uses

`facts.json → usage.radius` (**1,179** radius utilities total):

| Class | Resolves to | Uses | Share (DERIVED) |
| --- | --- | --- | --- |
| **`rounded-lg`** | `var(--radius-lg)` = **8px** | **946** | **80.2%** |
| `rounded-full` | `9999px` (pill/circle) | 162 | 13.7% |
| `rounded` | 4px (Tailwind v4 bare alias — same value as `--radius-sm`; **DERIVED**, not a named token here) | 43 | 3.6% |
| `rounded-md` | `var(--radius-md)` = 6px | 21 | 1.8% |
| `rounded-none` | 0 | 4 | 0.3% |
| `rounded-sm` | `var(--radius-sm)` = 4px | 2 | 0.2% |
| `rounded-xl` | `var(--radius-xl)` = 12px | 1 | 0.1% |

### 3.3 The default radius, stated plainly

> **The default radius of this design system is `--radius-lg` = `0.5rem` = 8px.**

Four out of every five rounded corners in the entire capture are 8px. Buttons, links-as-buttons, cards, menu items,
sidebar rows — all `rounded-lg`. `rounded-full` is reserved for **pills and avatars** (badges: 17 deduped; the
`h-6 px-2.5 rounded-full text-xs` chip). `rounded-md` (6px) appears almost exclusively on the extra-compact `h-6.5`
control. `--radius-2xl` and `--radius-3xl` exist as tokens but are **never used** in the capture — do not reach for them.

Two legacy non-token radii survive in `_classes.json` (pre-Tailwind CSS still on the page): `.__react_component_tooltip
{ border-radius: 3px }` and `.skeleton-line { border-radius: 2px }`. **Do not reproduce these** — they are the old
tooltip library, not the system.

---

## 4. Breakpoints

### 4.1 Viewport breakpoints (OBSERVED — `breakpoints-data.json`, `remBasePx: 16`)

The source is compiled by Lightning CSS and emits **modern range syntax**, not `min-width`:

| Name (DERIVED — Tailwind v4 naming) | Mined condition (OBSERVED) | Value | px | Rules gated |
| --- | --- | --- | --- | --- |
| `sm` | `(width >= 40rem)` | `40rem` | **640** | 1 |
| `md` | `(width >= 48rem)` | `48rem` | **768** | 1 |
| `lg` | `(width >= 64rem)` | `64rem` | **1024** | 1 |
| `xl` | `(width >= 80rem)` | `80rem` | **1280** | 1 |
| `2xl` | `(width >= 96rem)` | `96rem` | **1536** | 1 |

`facts.json → breakpoints.minWidthScalePx = [640, 768, 1024, 1280, 1536]`. Every breakpoint is `>=` (mobile-first). There
are **no max-width and no range-bounded breakpoints** in the capture. `--breakpoint-2xl: 96rem` is confirmed as a named
var in `computed-tokens.json`.

One non-dimensional media query is mined and it matters:
`(prefers-reduced-motion: reduce)` — **8 rules gated**, the single most-gating query in the file. Honour it.

### 4.2 Container queries

`breakpoints-data.json → containerBreakpoints: []` and `containerNames: []` — **the CSS mine found zero `@container`
queries.**

**However** (DERIVED — counted in the captured DOM): the markup *does* use them. `@container` appears **14** times as a
containment root, with variants `@2xl:` ×6, `@4xl:` ×6, `@5xl:` ×19. The page-body wrapper is literally
`... @container px-6 md:px-8 lg:px-10 max-w-350 mx-auto w-full`, and content inside uses e.g. `@5xl:pb-8`.

> ⚠️ **Discrepancy, flagged.** The compiled `@container` rules were not picked up by the media-query mine (they live in
> the inline `<style>` blocks — `classification.json` reports `inlineStyleTags: 12`, `inlineStyleBytes: 158,494`). The
> *usage* is real; only the *mined rule list* is empty. Resolve the sizes from the container tokens below rather than
> from `breakpoints-data.json`.

Container sizes resolve against the `--container-*` scale (§5.2): `@2xl` = **42rem/672px**, `@4xl` = **56rem/896px**,
`@5xl` = **64rem/1024px** (all OBSERVED as tokens in `computed-tokens.json`; the mapping to the `@` variants is DERIVED).

**The layout idiom to copy:** page chrome responds to the **viewport** (`md:`/`lg:`/`xl:` on gutters and section gaps);
page *content* responds to its **container** (`@2xl`/`@4xl`/`@5xl`), so a card behaves the same whether or not the
sidebar is open. That is the whole point of the 260px collapsible sidebar.

### 4.3 What actually changes at each breakpoint (OBSERVED classes, DERIVED counts)

The responsive surface is small and almost entirely about **gutters and gaps**:

| Breakpoint | Observed responsive utilities |
| --- | --- |
| `sm` (640) | `sm:w-[340px]` ×8, `sm:right-8` ×8, `sm:bottom-8` ×8 (toast anchoring), `sm:flex` ×5, `sm:flex-row` ×4, `sm:justify-between` ×3, `sm:hidden` ×2, `sm:w-32` ×2 |
| `md` (768) | `md:px-3` ×8, `md:px-8` ×5, `md:gap-4` ×8, `md:gap-6` ×3, `md:p-8` ×3, `md:inline` ×8, `md:inline-flex` ×8, `md:[--page-body-track-gutter:32px]` ×1, `md:pb-8` ×1 |
| `lg` (1024) | `lg:px-10` ×8, `lg:px-4!` ×14, `lg:gap-8` ×3, `lg:py-10` ×2, `lg:py-9` ×1, `lg:pb-9` ×1 |
| `xl` (1280) | `xl:gap-6` ×8 |
| `2xl` (1536) | none observed — the token exists; no rule uses it. |

---

## 5. Containers, page widths & the app shell

### 5.1 App-shell dimensions (OBSERVED — `computed-tokens.json` + inline vars in the captured DOM)

```
--sidebar-nav-width: 260px      /* set on <html>, all 8 pages */
--sidebar-width:     16.25rem   /* = 260px — the same number in rem */
--header-height:     58px       /* top bar */
```

Derived viewport-fitting expressions, transcribed from `_classes.json` (these are the real ones, verbatim mapping):

```css
/* Full-height app region, minus the top bar, minus an optional preview banner */
.h-\[calc\(100vh-58px-var\(--preview-banner-height\,0px\)\)\]  { height: calc(100vh - 58px - var(--preview-banner-height, 0px)); }
.min-h-\[calc\(100dvh-58px-var\(--preview-banner-height\,0px\)\)\] { min-height: calc(100dvh - 58px - var(--preview-banner-height, 0px)); }
.h-\[calc\(100vh-98px-var\(--preview-banner-height\,0px\)\)\]  { height: calc(100vh - 98px  - var(--preview-banner-height, 0px)); } /* 58 + 40 */
.h-\[calc\(100vh-116px-var\(--preview-banner-height\,0px\)\)\] { height: calc(100vh - 116px - var(--preview-banner-height, 0px)); } /* 58 + 58 */
```

`--preview-banner-height` is a **runtime-injected** offset defaulting to `0px` — the shell is authored to absorb an
optional banner without any layout rewrite. Copy this pattern.

> ⚠️ **Inconsistency in the source, flagged.** `min-h-[calc(100vh-56px)]` also appears (×8) — **56px**, not 58px. The
> `--header-height` token says **58px** and 4 of the 5 calc utilities agree. Treat **58px** as correct and the 56px
> literal as a stale hard-code. Do not propagate it.

### 5.2 The container scale (OBSERVED — `computed-tokens.json`)

The full Tailwind v4 `--container-*` scale is present and computes on the page — all **13** of them
(`facts.json → tokens.groups.container = 13`), re-emitted at `:root` in `tokens/index.css`:

| Token | Value | px (DERIVED) |
| --- | --- | --- |
| `--container-3xs` | `16rem` | 256 |
| `--container-2xs` | `18rem` | 288 |
| `--container-xs` | `20rem` | 320 |
| `--container-sm` | `24rem` | 384 |
| `--container-md` | `28rem` | 448 |
| `--container-lg` | `32rem` | 512 |
| `--container-xl` | `36rem` | 576 |
| `--container-2xl` | `42rem` | 672 |
| `--container-3xl` | `48rem` | 768 |
| `--container-4xl` | `56rem` | 896 |
| `--container-5xl` | `64rem` | 1024 |
| `--container-6xl` | `72rem` | 1152 |
| `--container-7xl` | `80rem` | 1280 |

These serve **double duty**: as `max-w-*` values and as the `@container` query sizes (§4.2).

### 5.3 Page width (DERIVED — counted from the captured DOM)

`max-w-*` usage across all 8 pages:

| Class | Resolves to | Uses | Role |
| --- | --- | --- | --- |
| `max-w-(--sidebar-width)` | 260px | 8 | Sidebar clamp (once per page) |
| `max-w-full` | 100% | 7 | |
| **`max-w-350`** | `calc(var(--spacing) * 350)` = **1400px** | **6** | **The page content max width.** |
| `max-w-48` | 12rem / 192px | 5 | Truncating labels |
| `max-w-md` | `var(--container-md)` / 448px | 4 | Dialog / empty-state copy |
| `max-w-xs` | `var(--container-xs)` / 320px | 2 | Popover |
| `max-w-[1400px]` | 1400px | 1 | Same width, hard-coded |
| `max-w-2xl` | `var(--container-2xl)` / 672px | 1 | |
| `max-w-[1300px]` | 1300px | 1 | One-off |
| `max-w-140` | 35rem / 560px | 1 | |
| `max-w-prose` | `65ch` (OBSERVED in `_classes.json`) | — | Long-form text |

> **Page content is capped at 1400px and centred** (`max-w-350 mx-auto w-full`). Note the system expresses it as a
> **spacing multiple** (`350 × 4px`), not as an arbitrary value — though one stray `max-w-[1400px]` shows both spellings
> exist. Prefer `max-w-350`.

### 5.4 The page-body recipe (OBSERVED, verbatim class list from `home-overview.html`)

```html
<!-- The main content column, re-authored for clarity -->
<div class="flex flex-col md:gap-4 xl:gap-6 @container
            px-6 md:px-8 lg:px-10
            max-w-350 mx-auto w-full">
```

| Property | Base | `md` (768) | `lg` (1024) | `xl` (1280) |
| --- | --- | --- | --- | --- |
| **Page gutter** (`px`) | **24px** (`px-6`) | **32px** (`md:px-8`) | **40px** (`lg:px-10`) | — |
| **Section gap** (`gap`) | 0 | **16px** (`md:gap-4`) | — | **24px** (`xl:gap-6`) |
| Max width | 1400px, centred | | | |
| Containment | `@container` — children query the column, not the viewport | | | |

A second, grid-based body track uses a custom property for its gutter (OBSERVED):

```html
<div class="[--page-body-track-gutter:16px] md:[--page-body-track-gutter:32px]
            grid pt-8 pb-6 *:col-start-2">
```

→ **16px gutter, 32px from `md` up; 32px top / 24px bottom padding** (`pt-8` / `pb-6`).

Content grid inside the body (OBSERVED): `grid auto-rows-min grid-cols-6 gap-4` — a **6-column grid with a 16px gutter**.

### 5.5 Other fixed widths (OBSERVED)

| Class / var | Value | Uses | Role |
| --- | --- | --- | --- |
| `w-[calc(100%-2rem)]` | 100% − 32px | 8 | Mobile drawer/toast inset (16px each side) |
| `sm:w-[340px]` | 340px | 8 | Toast width from `sm` up |
| `h-[58px]` | 58px | 8 | Header, hard-coded alongside `--header-height` |
| `w-[720px]` | 720px | 1 | Wide dialog |
| `w-[160px]` | 160px | 1 | Menu |
| `--active-tab-width` / `--active-tab-height` | runtime px (e.g. `101.891px` / `32px`) | — | Measured at runtime by the tab indicator — **not** design tokens; do not hard-code |

### 5.6 Stacking (z-index) — OBSERVED

`computed-tokens.json` ships three named z-tokens (`facts.json → tokens.groups.z = 3`). There is no
`tokens/elevation.css` in this run — they are emitted at `:root` in `tokens/index.css`, and restated here:

```
--z-index-modal:  9999
--z-index-drawer: 99999
--z-index-toast:  1000000
```

Order is **modal < drawer < toast**. The legacy tooltip CSS (`_classes.json`) sits at `z-index: 999` — below all three.

---

## 6. Density patterns worth copying

### 6.1 The 8px gap default
`gap-2` (8px) is used **1,572** times — more than every other gap combined (`gap-3` 170, `gap-2.5` 112, `gap-1.5` 75,
`gap-1` 69, `gap-4` 43, `gap-6` 5, `gap-5` 2). **If you don't know what gap to use, it is 8px.**

### 6.2 The 12px control inset
`px-3` (12px) ×890. It is the horizontal padding of buttons (`h-8` *and* `h-9`), inputs, menu items and table cells alike.

### 6.3 The sidebar sub-menu indent
`pl-7` (**28px**) ×176, paired with an absolutely-positioned 1px rail at `left-[19px]` and rows using `gap-y-px`
(1px separators). The rail sits 19px in; the label starts at 28px — a **9px optical channel** between rail and text.
This is a specific, reproducible construction, not a magic number.

### 6.4 Row heights ≠ control heights
`min-h-8.5` (**34px**) is used **826** times — it is the sidebar/menu **row** minimum. Also observed: `min-h-12` (48px)
×8, `min-h-21` (84px) ×1, `min-h-0` ×72 (flex-shrink enabler). Rows are 34px; controls are 32/36/40px. Keep the two
ladders separate.

### 6.5 Zero-padding resets are load-bearing
`py-0` ×813, `p-0` ×253, `m-0` ×216, `pr-0` ×180. The source aggressively resets browser/legacy padding before applying
its own. Expect to do the same when dropping these recipes into an app with a global stylesheet.

---

## 7. Do / Don't

**Do**
- Generate every space from `--spacing` (`calc(var(--spacing) * n)`); use half-steps freely.
- Default to **8px gaps** and **12px control insets**.
- Use exactly **three** control heights: **32 / 36 / 40**.
- Use **`rounded-lg` (8px)** everywhere; `rounded-full` only for pills and avatars.
- Cap page content at **1400px**, centred, with **24 → 32 → 40px** responsive gutters.
- Put `@container` on the content column and let cards respond to *it*, not the viewport.
- Honour `prefers-reduced-motion` — it gates more rules (8) than any breakpoint (1 each).

**Don't**
- Don't size buttons from `rawControlHeightClasses` — `h-11`/`h-12`/`h-14` are rows and blocks, not controls.
- Don't call `w-6 h-6` (24px) a button size; it is an icon/avatar box.
- Don't use `--radius-2xl` / `--radius-3xl` — they exist as tokens but appear **zero** times in 1,179 uses.
- Don't reproduce the legacy `3px` tooltip radius or `2px` skeleton radius.
- Don't copy the stray `calc(100vh - 56px)` — the header is **58px**.
- Don't upsize icons by reflex: the dominant in-control icon is **12px** (196 of 476 uses).
- Don't invent `textarea` / `select` / `radio` / `switch` sizing and present it as observed — `facts.json` lists all four
  under `notObserved`.

---

## 8. Accessibility notes

- **Touch targets.** The system's controls are **32–40px** tall. `h-8` (32px) and `h-9` (36px) are **below the WCAG 2.2
  §2.5.8 Target Size (Minimum) 24×24 CSS-px floor for *width* only if they are also narrow** — height is fine, but an
  icon-only `h-9 p-0` button is a **36×36** box (passes 24×24) while nothing guarantees width on text buttons. Verify
  width. None of the observed controls reach the **44×44** of WCAG 2.1 §2.5.5 (AAA) or Apple's HIG. **PRESCRIPTIVE:** if
  you ship this on touch, add a `::after` hit-area expander rather than changing the visual height — the density is the
  design.
- **`h-6.5` (26px) and `h-6` (24px)** chips sit exactly at / just above the 24px AA floor. Do not shrink them further,
  and do not put two of them adjacent without spacing — §2.5.8 is satisfied only if targets don't overlap.
- **Zoom / reflow (WCAG §1.4.10).** All breakpoints are **rem**-based (`40/48/64/80/96rem`), so they respond to the
  user's root font size. Keep them in rem. The page gutters (24/32/40px) leave room at 400% zoom.
- **Reduced motion.** `prefers-reduced-motion: reduce` gates **8 rules** in the source — the single largest gated block.
  Any spacing-driven animation (drawer slide, sidebar collapse) must be neutralised under it.
- **Focus rings need room.** With `gap-2` (8px) between adjacent controls, a 2px ring + 2px offset consumes half the gap.
  Prefer `outline` (which doesn't affect layout) over inset shadows that could be clipped by a tight `p-0` wrapper.
- **Don't rely on the 1px sidebar rail alone** (§6.3, `gap-y-px`) to convey hierarchy — it is decorative; the `pl-7`
  indent plus proper `aria-level` / nested `<ul>` semantics carry the meaning.

---

## 9. Using this in Tailwind CSS v4 + shadcn/ui

### 9.1 Theme layer

Because the source *is* Tailwind v4, this maps 1:1. Every primitive below **already ships** in this package as
`tokens/index.css` (which also `@import`s `tokens/colors.css` and `tokens/typography.css`), so importing that file is
enough. The `@theme` block below is the same set restated inline, for when you want them in your own theme layer rather
than as an unlayered `:root` import — no config file needed either way.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* ── Spacing base (§1.1) — everything derives from this ───────────────── */
  --spacing: 0.25rem;                /* 4px */

  /* ── Radius (§3.1) — these ARE the Tailwind v4 defaults; restated for clarity */
  --radius-xs:  0.125rem;            /*  2px */
  --radius-sm:  0.25rem;             /*  4px */
  --radius-md:  0.375rem;            /*  6px */
  --radius-lg:  0.5rem;              /*  8px  ← system default */
  --radius-xl:  0.75rem;             /* 12px */

  /* ── Breakpoints (§4.1) — Tailwind v4 defaults; confirmed by the mine ──── */
  --breakpoint-sm:  40rem;           /*  640px */
  --breakpoint-md:  48rem;           /*  768px */
  --breakpoint-lg:  64rem;           /* 1024px */
  --breakpoint-xl:  80rem;           /* 1280px */
  --breakpoint-2xl: 96rem;           /* 1536px */

  /* ── App shell (§5.1) — target-specific, add these ─────────────────────── */
  --header-height:     58px;
  --sidebar-nav-width: 260px;
  --sidebar-width:     16.25rem;     /* 260px */

  /* ── Stacking (§5.6) ───────────────────────────────────────────────────── */
  --z-index-modal:  9999;
  --z-index-drawer: 99999;
  --z-index-toast:  1000000;
}

/* Runtime-injected banner offset — default 0 so the shell math always works (§5.1) */
:root { --preview-banner-height: 0px; }
```

`--container-*` (§5.2) needs no declaration — Tailwind v4 ships exactly these values, and they power both `max-w-*` and
`@container` sizes.

**shadcn/ui radius:** shadcn's `components.json` / CSS expects a single `--radius`. Set it to the system default:

```css
:root { --radius: 0.5rem; }   /* 8px — matches --radius-lg (§3.3) */
```

That makes shadcn's `rounded-md`/`rounded-lg`/`rounded-xl` helpers hang off the right base without touching each
component.

### 9.2 Control sizing via `class-variance-authority`

Transcribe §2.4 directly into the `size` variant of the shadcn `Button`. Note that `px-3` does **not** change between
`sm` and `default`, and every size is `rounded-lg`.

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base: radius (§3.3), the icon↔label gap (§2.4), and lucide icon sizing (§2.6)
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg gap-1.5 " +
    "font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3", // 12px — the dominant icon size
  {
    variants: {
      size: {
        /* §2.4 — h-8 / px-3 / gap-2 / text-sm(13px): densest toolbar control */
        sm:      "h-8  px-3 gap-2   text-sm",
        /* §2.4 — h-9 / px-3 / gap-1.5 / text-base(14px): THE default (32 of 58 sized controls) */
        default: "h-9  px-3 gap-1.5 text-base",
        /* §2.4 — h-10 / px-4 / gap-2: rare, primary CTA only (2 uses in the whole capture) */
        lg:      "h-10 px-4 gap-2   text-base",
        /* §2.4 — icon-only keeps the 36px box and drops padding entirely */
        icon:    "h-9  w-9  p-0",
      },
    },
    defaultVariants: { size: "default" },
  }
);
```

> **Deliberate divergence from stock shadcn.** Upstream ships `h-9 / h-8 / h-10 / size-9` with `px-4 / px-3 / px-6` and
> `[&_svg]:size-4`. The **heights already match** — but you must override the **padding** (`lg` is `px-4`, not `px-6`)
> and the **icon size** (`size-3` = 12px, not `size-4` = 16px). Those two edits are what make it read as Cloudflare.

For the extra-compact chip (§2.4, badge-family — `h-6.5 px-2 gap-1 rounded-md text-xs`), extend `Badge` rather than
`Button`:

```tsx
const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 h-6 gap-1 text-xs", {
  variants: {
    size: {
      default: "rounded-full px-2.5 h-6",   // 24px pill (§2.4)
      chip:    "rounded-md   px-2  h-6.5",  // 26px interactive filter chip (§2.4)
    },
  },
});
```

`h-6.5` works out of the box in Tailwind v4 — arbitrary fractional steps are multiplied against `--spacing`.

### 9.3 App shell

```tsx
// app/(dashboard)/layout.tsx
export default function Layout({ children, sidebar }: { children: React.ReactNode; sidebar: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height)-var(--preview-banner-height))]">
      <aside className="w-(--sidebar-width) max-w-(--sidebar-width) shrink-0">{sidebar}</aside>

      {/* §5.4 — the page-body recipe, verbatim */}
      <main className="flex flex-col md:gap-4 xl:gap-6 @container
                       px-6 md:px-8 lg:px-10
                       max-w-350 mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
```

- `@container` requires **no plugin** in Tailwind v4 — container queries are core. Use `@2xl:` / `@4xl:` / `@5xl:` on
  descendants (§4.2).
- `w-(--sidebar-width)` is Tailwind v4's CSS-var shorthand — exactly what the source uses (`max-w-(--sidebar-width)`).
- Pair with shadcn's `Sidebar` primitive, but **override its `--sidebar-width` from `16rem` to `16.25rem` (260px)** —
  shadcn's default is 4px narrower than Cloudflare's.

### 9.4 Dark mode

Spacing and radius are **theme-invariant** — nothing in this document changes between light and dark. Wire dark mode once
in `next-themes` (`attribute="class"` → `.dark`) for the colour layer; the layout layer needs no per-theme handling.
Note the source itself switches on `[data-mode=dark]`, but for a shadcn target use the `.dark` class convention and let
`tokens/colors.css` do the work.

### 9.5 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* The source gates 8 rules here — the largest gated block in the stylesheet (§4.1) */
  *, ::before, ::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
                         transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

Tailwind's `motion-reduce:` variant covers the per-component cases — the source uses exactly that
(`motion-reduce:transition-none` on the sidebar collapse).

---

## Appendix — source map

| Claim family | File | Key |
| --- | --- | --- |
| Base unit, radius scale, container scale, shell vars, z-index | `capture/computed-tokens.json` | `--spacing`, `--radius-*`, `--container-*`, `--header-height`, `--sidebar-nav-width`, `--z-index-*` |
| The same primitives, as emitted by this package | `design-system/tokens/index.css` | the `:root` primitive block |
| Named-token census (551 total; `spacing: 1`, `radius: 7`, `container: 13`, `z: 3`) | `capture/facts.json` | `tokens.count`, `tokens.groups` |
| Spacing usage histogram | `capture/facts.json` | `usage.spacing` |
| Control heights (icon boxes excluded) | `capture/facts.json` | `usage.controlHeights`, `usage.controlHeightsByTag`, `usage.buttonHeightTypePairs` |
| Raw `h-*` (includes non-controls) | `capture/facts.json` | `usage.rawControlHeightClasses` |
| Square icon/avatar boxes | `capture/facts.json` | `usage.squareBoxes`, `usage.iconWidths` |
| Radius usage | `capture/facts.json` | `usage.radius` |
| Icon sizes | `capture/facts.json` | `icons.sizesByUse` |
| Breakpoints | `capture/breakpoints-data.json`, `capture/facts.json` | `breakpoints`, `minWidthScalePx`, `rawMediaQueries` |
| Not-observed components | `capture/facts.json` | `usage.notObserved` |
| Legacy radii, viewport calcs, `max-w-prose` | `capture/_classes.json` | selector→decl map |
| Utility-compiled verdict | `capture/classification.json` | `verdict`, `recommendation` |
| Control padding/gap joins, page-body recipe, `max-w-*`, `@container` usage | `capture/*.html` (8 pages) | post-render DOM — **DERIVED** |
