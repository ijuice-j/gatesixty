# Iconography

> **Provenance.** Every number on this page is OBSERVED — mined from
> `capture/icons-data.json` (deduped inline `<svg>` geometry) and rolled up into
> `capture/facts.json` (`icons.*`). Colour behaviour is transcribed from
> `capture/_classes.json` (class → declaration → token). Nothing here is estimated.
>
> **Classification caveat.** `capture/classification.json` ranks this target as
> **`utility-compiled`** (score 1.0) ahead of `token-driven` (0.813). Icon size and
> layout are therefore carried by *atomic utility classes and SVG attributes*, not by
> named icon tokens. Where a value has no token behind it, this doc says so and
> gives you the resolved value from the utility/attribute instead.

---

## 1. Observed inventory

| Fact | Value | Source |
| --- | --- | --- |
| Total inline `<svg>` uses | **476** | `facts.json → icons.totalSvgUses` |
| Unique glyphs (deduped by normalised geometry) | **62** | `icons.uniqueIcons` |
| Pages crawled | 8 | `usage.pages` |
| `<svg>` elements, deduped across the shell | 107 | `usage.elementTotalsDeduped.svg` |
| Flagged as **logos / illustrations — do NOT bundle as icons** | **39** | `icons.likelyLogosOrIllustrations` |

So the real, reusable **icon** surface is roughly **23 glyphs** (62 unique − 39
logo/illustration shapes). The 39 excluded shapes include the Cloudflare mark
(`viewBox="0 0 460 271.2"`), the sparkline chart surfaces (`0 0 93 32`), and the
third-party consent-manager glyphs (`0 0 402.577 402.577`, `0 -30 110 110`,
`0 0 444.531 444.531`). Treat those as **assets**, not as an icon set.

---

## 2. Size scale — OBSERVED

Sizes below are exactly `facts.json → icons.sizesByUse`. The px column is the
authoritative fact; the Tailwind column is the equivalent under the target's own
spacing unit (`--spacing: .25rem`, i.e. 4px — so `size-4` = 16px).

| px | Uses | Tailwind (`--spacing`=4px) | Role in the observed UI |
| --- | ---: | --- | --- |
| **12** | **196** | `size-3` | **The workhorse.** 176 of these are one single glyph — the sidebar menu-item caret (`icons[0]`, 8/8 pages). Also the 12px crossfade pair (18 uses). |
| **16** | 42 | `size-4` | Inline/leading icons in controls: search field, menu items, buttons. |
| **14** | 22 | `size-3.5` | Dense affordances — the row-level "pin" toggle (`aria-label="Pin"`). |
| **18** | 13 | `size-4.5` | Sidebar collapse trigger and peers inside `size-8.5` icon buttons. |
| **20** | 1 | `size-5` | Rare. Not an established step. |
| **24** | 4 | `size-6` | Rare; matches the one observed `w-6 h-6` square box (`usage.squareBoxes`). |
| **28** | 2 | `size-7` | Rare — avatar/tile-adjacent. |
| **48** | 9 | `size-12` | Large marks: 8 are the Cloudflare logo; 1 is a genuine 256-grid empty-state glyph. |
| ~~2~~ | 6 | — | **Artifact, not a size.** 6 uses on `0 0 24 24` stroke icons; the miner read a `stroke-width`-adjacent attribute. Ignore. |
| ~~93~~ | 5 | — | **Not an icon.** The Recharts sparkline `<svg class="recharts-surface" viewBox="0 0 93 32">`. Ignore. |

### The scale you should ship

Drop the two artifacts and the one-off 20px, and the observed set collapses to a
clean six-step scale:

```
xs  12px  size-3     carets, chevrons, dense inline affordances   ← dominant
sm  14px  size-3.5   row-hover affordances (pin, drag, kebab)
md  16px  size-4     DEFAULT — control-leading icons, menu items
lg  18px  size-4.5   icon-only buttons (size-8.5 = 34px hit area)
xl  24px  size-6     section headers, standalone tiles
2xl 48px  size-12    empty states, marks
```

**Default = 16px (`size-4`).** 42 of the 476 uses declare it explicitly, and 42
`<svg>`s ship `width="1em" height="1em"` — meaning they inherit the parent's
font-size and land on 16px whenever the parent sits at the base step.

---

## 3. Drawing style — OBSERVED

`facts.json → icons.styleSplit`: **fill 317 · stroke 35 · unknown 123** →
`dominantStyle: "fill"`.

Two distinct families coexist in the captured DOM:

### 3.1 Filled family (dominant — a 256-unit grid)

```html
<svg xmlns="http://www.w3.org/2000/svg"
     width="1em" height="1em"
     fill="currentColor"
     viewBox="0 0 256 256"
     class="size-4 shrink-0 text-kumo-subtle">
  <path d="…"/>
</svg>
```

- `viewBox="0 0 256 256"` on **every** filled glyph — a 256-unit design grid.
- Single `<path>` (`shapeCount: 1` on the overwhelming majority).
- `fill="currentColor"`, **no `stroke`**.
- Sized by `width`/`height` — either literal px (`12`, `16`, `24`) or `1em` +
  a `size-*` utility.

### 3.2 Stroked family (minority — a 24-unit grid)

Two stroke weights are observed, both on `viewBox="0 0 24 24"`:

```html
<!-- 1.5px — sidebar collapse trigger -->
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
     class="shrink-0" aria-hidden="true" focusable="false">…</svg>

<!-- 2px — row "pin" toggle, animated -->
<svg width="14" height="14" viewBox="0 0 24 24"
     fill="currentColor" fill-opacity="0"
     stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round"
     class="transition-[rotate,opacity] duration-100">…</svg>
```

| Property | Observed values |
| --- | --- |
| `stroke-width` | `1.5` (18px chrome icons) · `2` (14px toggles) · `1.75px` (`.link-external-icon`, from `_classes.json`) |
| `stroke-linecap` | `round` (always) |
| `stroke-linejoin` | `round` |
| `fill` | `none`, or `currentColor` + `fill-opacity="0"` so the fill can be animated in |

> The `fill-opacity="0"` + `fill="currentColor"` trick on the pin icon is a
> **fill-on-toggle** pattern: the glyph is stroked when off and animates to solid
> when pinned, with no icon swap.

**Rule:** filled/256-grid is the house style. Reach for stroke only for
toggle-able affordances that need an outline→solid state change, and match the
observed weights (1.5 at 18px, 2 at 14px).

---

## 4. Colour — `currentColor` + the text tokens

### 4.1 There are no `*-icon` colour tokens

Searched `tokens/colors.css`, `tokens.json`, and `_classes.json`: **no token or
utility contains `icon`** as a colour role. Icons do **not** get their own palette.
The only SVG-paint utility that exists anywhere in `_classes.json` is:

```css
/* _classes.json — the ONE svg paint utility in the whole stylesheet */
.fill-surface { fill: var(--color-surface); }
```

…and it is used for chart/decoration surfaces, not for icons.

### 4.2 The actual contract: icons inherit `color`

Every icon paints with `currentColor` (`fill="currentColor"` or
`stroke="currentColor"`). **Colour is set on the icon's `color`, or inherited from
its parent** — so an icon inside a button automatically tracks that button's text
colour through hover, disabled, and dark mode with zero extra CSS.

Icon colour therefore resolves through the **text tokens**, which are the ones
defined under both `:root` and `[data-mode=dark]` and switch themes automatically:

| Utility observed on icons | Token it resolves to | Use for |
| --- | --- | --- |
| `text-kumo-subtle` | `var(--text-color-kumo-subtle)` | **Default for chrome icons.** Sidebar trigger, tooltip triggers, secondary glyphs. |
| `text-kumo-default` | `var(--text-color-kumo-default)` | Hover/active state of a chrome icon. |
| `text-kumo-strong` | `var(--text-color-kumo-strong)` | Emphasis / selected. |
| `text-kumo-inactive` | `var(--text-color-kumo-inactive)` | Disabled. |
| `text-kumo-brand` | `var(--text-color-kumo-brand)` | Brand-marked affordances. |
| `text-kumo-danger` | `var(--text-color-kumo-danger)` | Destructive / error status. |
| `text-kumo-success` | `var(--text-color-kumo-success)` | Success status. |
| `text-kumo-warning` | `var(--text-color-kumo-warning)` | Warning status. |
| `text-kumo-info` | `var(--text-color-kumo-info)` | Informational status. |
| `text-kumo-link` | `var(--text-color-kumo-link)` | Inline-with-link icons (external-link glyph). |
| `text-kumo-placeholder` | `var(--text-color-kumo-placeholder)` | Icons inside empty inputs. |

The canonical chrome pair — lifted straight from the sidebar trigger's class list —
is `text-kumo-subtle hover:text-kumo-default`.

> ⚠️ **Observed but do not copy.** Some captured icons hardcode raw palette
> utilities instead — `text-neutral-500` (11), `text-neutral-600` (8),
> `text-neutral-400` (8), `text-muted` (8), `text-blue-500` (1), and one
> `text-neutral-600 dark:text-neutral-400` pair. These resolve to `--color-neutral-*`
> / `--text-color-muted`, which are **not theme-paired** — that's why the source has
> to hand-write a `dark:` variant. Use the `text-kumo-*` semantic tokens above; they
> flip on `[data-mode=dark]` by themselves.

### 4.3 Opacity is part of the colour system here

The source dims icons with **opacity**, not with a second colour token:

| Utility | Where | Meaning |
| --- | --- | --- |
| `opacity-40` → `group-hover/menu-button:opacity-100` | sidebar caret (176 uses) | Affordance is latent until the row is hovered. |
| `opacity-50` | consent/nav glyphs, pin toggle | Permanently de-emphasised. |
| `opacity-0` → `opacity-100` | 12px crossfade pair (18 uses) | Two stacked `absolute inset-0` icons swapping. |

---

## 5. Anatomy

### 5.1 Inline icon (inside a control)

```
[ button ]──gap-2──────────────────────────────────┐
│  <svg size-4 shrink-0 currentColor>  Label  <svg size-3 ml-auto opacity-40>
└───────────────────────────────────────────────────┘
   leading icon        text            trailing caret
```

- **`shrink-0` is mandatory** on every icon in a flex row — it appears on
  essentially every icon in the capture. Without it the glyph squashes when the
  label truncates.
- Gap between icon and label: **`gap-2`** (1572 uses — the single most common
  spacing utility in the whole app).
- Trailing carets use **`ml-auto`** to pin right.
- `pointer-events-none` appears on decorative icons inside interactive parents so
  they never steal the click target.

### 5.2 Icon-only button — OBSERVED (sidebar collapse trigger)

```
size-8.5 (34px hit area)  ·  rounded-lg  ·  18px glyph centred
```

Its exact class list from `home-overview.html`:

```
flex shrink-0 size-8.5 justify-center items-center rounded-lg
text-kumo-subtle hover:text-kumo-default
hover:bg-(--sidebar-active-bg)
focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kumo-brand
```

Note the traits that are **specific to this target** — preserve them:
- radius is **`rounded-lg`** (946 uses; `--radius-lg` = `.5rem`), not full;
- the focus ring is **inset** and painted with **`--color-kumo-brand`**;
- hover changes **text colour first**, background second.

### 5.3 Crossfade pair (copy/confirm style toggles)

```html
<span class="relative inline-flex size-3">
  <svg … class="absolute inset-0 transition-opacity duration-100 opacity-0">…</svg>
  <svg … class="absolute inset-0 transition-opacity duration-100 opacity-100">…</svg>
</span>
```

---

## 6. Motion on icons — OBSERVED

From the captured icon class lists. The two durations below are also the two most
common in the whole stylesheet — `facts.json → motion.durations` records
`.2s` = 67 rules and `.1s` = 41 rules (stylesheet-wide counts, not icon-scoped):

| Pattern | Transition | Duration |
| --- | --- | --- |
| Sidebar caret (rotate + reveal) | `transition-[transform,rotate,opacity]` | **200ms** |
| Pin toggle (outline → solid) | `transition-[rotate,opacity]` | **100ms** |
| Crossfade pair | `transition-opacity` | **100ms** |

Easing tokens available: `--ease-out`, `--ease-in`, `--ease-in-out`.
`motion.prefersReducedMotionRules` = **41** — the source already ships reduced-motion
guards. Honour them: never animate an icon's *position* without a
`prefers-reduced-motion: reduce` escape hatch. Opacity/colour fades are fine to keep.

---

## 7. Accessibility

| Case | Markup |
| --- | --- |
| **Decorative** (a visible text label sits next to it) | `aria-hidden="true" focusable="false"` — and, as seen in the capture, optionally `role="presentation"`. |
| **Icon-only control** | The label lives on the **button**, not the SVG: `<button aria-label="Collapse sidebar">`. Observed labels: `Collapse sidebar`, `Quick search...`, `Notifications`, `User menu`, `Actions`, `Pin`, `Back`, `Close`, `Manage tags`. |
| **Meaningful standalone graphic** | `role="img"` + an accessible name (the Cloudflare mark uses `role="img"`). |
| **Status icon** | Never rely on hue alone — `--text-color-kumo-danger` / `-success` / `-warning` must be paired with text or an `aria-label`. Failure/success is a state, not a colour. |

Additional rules:
- `focusable="false"` matters — without it, IE/legacy AT put SVGs in the tab order.
- Icon-only buttons must clear a **24×24 CSS-px minimum target**; the observed
  `size-8.5` (34px) button around an 18px glyph clears it comfortably. A bare 12px
  or 14px glyph is **not** a legal hit target on its own — wrap it.
- The `opacity-40`-until-hover caret pattern must never be the *only* signal that a
  row is expandable — keep `aria-expanded` on the control.
- Icons sized with `width="1em"` scale with user font-size settings. Prefer them.

---

## 8. Role → open icon set mapping

The mine deduped glyphs by **geometry hash**, so it recovers shapes, not names —
roles below are read off the captured markup (`aria-label`, placement, class list).
The 256-unit grid + single-path + `fill="currentColor"` signature of the filled
family matches the **Phosphor** icon convention exactly; the 24-unit stroked,
round-capped family matches the **Lucide** convention.

**Recommendation:** ship **`lucide-react`** (it is shadcn/ui's default, MIT, and its
24-grid / round-cap geometry is already present in this app). Where you want the
house *filled* look, use `@phosphor-icons/react` with `weight="fill"` — that is a
1:1 match for the 256-grid family and the dominant style here.

| Role | Observed evidence | Size | lucide-react | @phosphor-icons/react (weight="fill") |
| --- | --- | --- | --- | --- |
| **Nav caret / disclosure** | 176 uses, 8/8 pages, `ml-auto opacity-40`, `rotate-90` variant for expanded | 12 | `ChevronRight` | `CaretRight` |
| **Chevron (menu/select)** | 12px trailing, `shrink-0` | 12 | `ChevronDown` | `CaretDown` |
| **Search** | inside `aria-label="Quick search..."` button | 16 | `Search` | `MagnifyingGlass` |
| **Close / dismiss** | `aria-label="Close"` | 16 | `X` | `X` |
| **Sidebar collapse** | `data-testid="classic-sidebar-nav-trigger"`, stroke 1.5 | 18 | `PanelLeftClose` | `SidebarSimple` |
| **Notifications** | `aria-label="Notifications"` | 16 | `Bell` | `Bell` |
| **User menu** | `aria-label="User menu"` | 16–20 | `User` / avatar | `User` |
| **Overflow / actions** | `aria-label="Actions"` | 16 | `MoreHorizontal` | `DotsThree` |
| **Pin (toggle)** | `aria-label="Pin"`, stroke 2, fill-on-toggle | 14 | `Pin` / `PinOff` | `PushPin` |
| **Back** | `aria-label="Back"` | 16 | `ArrowLeft` | `ArrowLeft` |
| **External link** | `.link-external-icon { stroke-width: 1.75px }` | 12–14 | `ExternalLink` | `ArrowSquareOut` |
| **Status: success** | `--text-color-kumo-success` | 16 | `CheckCircle2` | `CheckCircle` |
| **Status: warning** | `--text-color-kumo-warning` | 16 | `AlertTriangle` | `Warning` |
| **Status: danger** | `--text-color-kumo-danger` | 16 | `AlertCircle` | `XCircle` |
| **Status: info** | `--text-color-kumo-info` | 16 | `Info` | `Info` |
| **Copy → copied** | crossfade pair, 12px, `duration-100` | 12 | `Copy` → `Check` | `Copy` → `Check` |
| **Empty state** | 1 genuine 256-grid glyph at 48px | 48 | any, at `size-12` | any, at `size-12` |

> ⚠️ **PRESCRIPTIVE rows.** The status quartet (success / warning / danger / info)
> and *copy → copied* are **inferred, not observed as named glyphs** — the mine
> returns hashes, and `usage.statusIntent` is empty (`{}`). The *tokens* they use
> are real and observed; the glyph choices are our recommendation. Everything above
> the status block is grounded in captured `aria-label`s and class lists.

> ⚠️ `.link-external-icon` is **defined in the stylesheet but never used** in the
> captured DOM. Its `stroke-width: 1.75px` is real; its usage is prescriptive.

---

## 9. CSS recipes

Author under the `.ds` scope (enforced downstream by `scope-components.js`).
These reference token vars only — no literals.

```css
/* =============================================================================
 * Iconography — recipes
 * Colour flows through `currentColor`; there are no *-icon colour tokens in this
 * system by design. Set `color` on the icon (or let it inherit) and the glyph
 * follows — including across [data-mode=dark].
 * ========================================================================== */

/* Base: every icon. `1em` sizing means the glyph tracks the parent's font-size
   unless a .ds-icon--* size modifier overrides it. */
.ds .ds-icon {
  display: inline-block;
  flex-shrink: 0;              /* observed on ~every icon in a flex row */
  width: 1em;
  height: 1em;
  color: inherit;              /* -> currentColor does the rest */
  vertical-align: middle;
}

/* Paint. Filled is the house style (317 fill vs 35 stroke uses). */
.ds .ds-icon--filled { fill: currentColor; stroke: none; }

.ds .ds-icon--stroked {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;       /* observed on all stroked glyphs */
  stroke-linejoin: round;
  stroke-width: 1.5;           /* observed default weight (24-unit grid) */
}
/* Heavier weight, observed on the 14px toggle affordances. */
.ds .ds-icon--stroked-strong { stroke-width: 2; }

/* --- Size steps (OBSERVED, from icons.sizesByUse) ------------------------- */
/* Multiples of the spacing unit (--spacing = .25rem = 4px). */
.ds .ds-icon--xs  { width: calc(var(--spacing) * 3);   height: calc(var(--spacing) * 3);   } /* 12 — dominant */
.ds .ds-icon--sm  { width: calc(var(--spacing) * 3.5); height: calc(var(--spacing) * 3.5); } /* 14 */
.ds .ds-icon--md  { width: calc(var(--spacing) * 4);   height: calc(var(--spacing) * 4);   } /* 16 — DEFAULT */
.ds .ds-icon--lg  { width: calc(var(--spacing) * 4.5); height: calc(var(--spacing) * 4.5); } /* 18 */
.ds .ds-icon--xl  { width: calc(var(--spacing) * 6);   height: calc(var(--spacing) * 6);   } /* 24 */
.ds .ds-icon--2xl { width: calc(var(--spacing) * 12);  height: calc(var(--spacing) * 12);  } /* 48 — empty states */

/* --- Colour roles --------------------------------------------------------- */
/* Semantic text tokens; they re-resolve under [data-mode=dark] automatically. */
.ds .ds-icon--subtle   { color: var(--text-color-kumo-subtle); }    /* default chrome */
.ds .ds-icon--default  { color: var(--text-color-kumo-default); }
.ds .ds-icon--strong   { color: var(--text-color-kumo-strong); }
.ds .ds-icon--disabled { color: var(--text-color-kumo-inactive); }
.ds .ds-icon--brand    { color: var(--text-color-kumo-brand); }
.ds .ds-icon--success  { color: var(--text-color-kumo-success); }
.ds .ds-icon--warning  { color: var(--text-color-kumo-warning); }
.ds .ds-icon--danger   { color: var(--text-color-kumo-danger); }
.ds .ds-icon--info     { color: var(--text-color-kumo-info); }

/* --- Icon-only button (transcribed from the sidebar collapse trigger) ------ */
.ds .ds-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  inline-size: calc(var(--spacing) * 8.5);   /* 34px — observed size-8.5 */
  block-size:  calc(var(--spacing) * 8.5);
  border-radius: var(--radius-lg);           /* rounded-lg dominates (946 uses) */
  color: var(--text-color-kumo-subtle);
  background: transparent;
  cursor: default;                           /* the source really does use default */
  transition: color 200ms var(--ease-out), background-color 200ms var(--ease-out);
}
.ds .ds-icon-button:hover  { color: var(--text-color-kumo-default); }
.ds .ds-icon-button:focus  { outline: none; }
.ds .ds-icon-button:focus-visible {
  /* Observed: ring-2, ring-INSET, painted with the brand token. */
  box-shadow: inset 0 0 0 2px var(--color-kumo-brand);
}
.ds .ds-icon-button[disabled] { color: var(--text-color-kumo-inactive); }

/* --- Decorative icon inside an interactive parent -------------------------- */
.ds .ds-icon--decorative { pointer-events: none; }

/* --- Latent disclosure caret (the 176-use sidebar pattern) ----------------- */
.ds .ds-icon-caret {
  margin-inline-start: auto;                 /* ml-auto */
  opacity: .4;                               /* opacity-40 */
  transition: transform 200ms var(--ease-out),
              rotate    200ms var(--ease-out),
              opacity   200ms var(--ease-out);
}
.ds .ds-nav-item:hover .ds-icon-caret { opacity: 1; }
.ds .ds-nav-item[aria-expanded="true"] .ds-icon-caret { rotate: 90deg; }

@media (prefers-reduced-motion: reduce) {
  .ds .ds-icon-caret,
  .ds .ds-icon-button { transition-duration: 1ms; }
}
```

> **Pipeline note.** `--radius-lg`, `--spacing`, and `--ease-*` are theme-independent
> scale tokens and are emitted at **`:root`** in `tokens/colors.css`, so the `var()`
> references above resolve as-is — no promotion step is required. The `--color-kumo-*` /
> `--text-color-kumo-*` tokens used for icon colour are also defined on `:root`
> + `[data-mode=dark]` and need no change.

---

## 10. Using this in Tailwind CSS v4 + shadcn/ui

### 10.1 Register the icon scale in `@theme`

Tailwind v4 needs no config file. The `size-*` utilities you need (`size-3`,
`size-3.5`, `size-4`, `size-4.5`, `size-6`, `size-12`) all fall out of `--spacing`
for free. Just map the colour roles so `text-*` utilities speak the token language:

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tokens/colors.css";

@custom-variant dark (&:where(.dark, .dark *));   /* next-themes writes .dark */

@theme inline {
  --spacing: .25rem;                              /* icon steps derive from this */

  /* Icon colour roles == text roles. No separate icon palette by design. */
  --color-icon:          var(--text-color-kumo-subtle);   /* default chrome icon */
  --color-icon-strong:   var(--text-color-kumo-default);
  --color-icon-brand:    var(--text-color-kumo-brand);
  --color-icon-success:  var(--text-color-kumo-success);
  --color-icon-warning:  var(--text-color-kumo-warning);
  --color-icon-danger:   var(--text-color-kumo-danger);
  --color-icon-info:     var(--text-color-kumo-info);
  --color-icon-disabled: var(--text-color-kumo-inactive);
}
```

> These `--color-icon-*` aliases are **ours**, introduced only so Tailwind emits
> `text-icon`, `text-icon-danger`, … utilities. They are thin pointers at the real,
> observed tokens — no new values are invented. The source itself has **no**
> `*-icon` colour token (§4.1).
>
> Because every alias resolves to a `:root` / `[data-mode=dark]` pair, **dark mode
> needs zero `dark:` variants on icons.** Bridge next-themes' `.dark` class to the
> source's attribute once:
>
> ```css
> :root:has(.dark), .dark { color-scheme: dark; }
> .dark { /* re-point at the dark token block */ }
> ```
> …or simply configure next-themes with `attribute="data-mode"` and `value={{ dark: "dark" }}`
> so it writes `data-mode="dark"` — which the tokens already target natively. **Prefer this.**

```tsx
// app/providers.tsx — makes [data-mode=dark] the switch, matching tokens/colors.css
<ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### 10.2 A sized `<Icon>` with class-variance-authority

```tsx
// components/ui/icon.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const iconVariants = cva(
  // `shrink-0` is non-negotiable — observed on effectively every icon here.
  "shrink-0",
  {
    variants: {
      // Sizes are OBSERVED (facts.json → icons.sizesByUse).
      size: {
        xs:  "size-3",     // 12px — 196 uses, the dominant step (carets)
        sm:  "size-3.5",   // 14px — row affordances
        md:  "size-4",     // 16px — DEFAULT
        lg:  "size-4.5",   // 18px — inside size-8.5 icon buttons
        xl:  "size-6",     // 24px
        "2xl": "size-12",  // 48px — empty states
      },
      // Colour flows through currentColor into fill/stroke.
      tone: {
        subtle:   "text-icon",
        strong:   "text-icon-strong",
        brand:    "text-icon-brand",
        success:  "text-icon-success",
        warning:  "text-icon-warning",
        danger:   "text-icon-danger",
        info:     "text-icon-info",
        disabled: "text-icon-disabled",
        inherit:  "text-current",   // inherit the button/menu-item's colour
      },
      decorative: { true: "pointer-events-none", false: "" },
    },
    defaultVariants: { size: "md", tone: "inherit", decorative: true },
  }
);

export interface IconProps
  extends React.SVGAttributes<SVGElement>,
    VariantProps<typeof iconVariants> {
  as: LucideIcon;
  /** Omit for decorative icons; required for standalone meaningful ones. */
  label?: string;
}

export function Icon({ as: Glyph, size, tone, decorative, label, className, ...props }: IconProps) {
  return (
    <Glyph
      className={cn(iconVariants({ size, tone, decorative }), className)}
      // Matches the observed stroked family: 24-grid, round caps, 1.5 weight.
      strokeWidth={1.5}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
      {...props}
    />
  );
}
```

### 10.3 Usage — the four patterns the source actually uses

```tsx
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Search, ChevronRight, PanelLeftClose, CircleCheck } from "lucide-react";

/* 1. Leading icon in a control — gap-2 is the house gap (1572 uses). */
<Button variant="outline" className="gap-2">
  <Icon as={Search} size="md" />
  Quick search…
</Button>

/* 2. Icon-only button — label on the BUTTON, 18px glyph, 34px target, inset brand ring. */
<Button
  size="icon"
  variant="ghost"
  aria-label="Collapse sidebar"
  className="size-8.5 rounded-lg text-kumo-subtle hover:text-kumo-default
             focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kumo-brand"
>
  <Icon as={PanelLeftClose} size="lg" />
</Button>

/* 3. Latent disclosure caret — 12px, opacity-40 until row hover, 200ms. */
<a className="group/menu-button flex w-full items-center gap-2 rounded-lg px-3">
  <span className="truncate">Workers &amp; Pages</span>
  <Icon
    as={ChevronRight}
    size="xs"
    className="ml-auto opacity-40 transition-[transform,rotate,opacity] duration-200
               group-hover/menu-button:opacity-100
               group-aria-expanded:rotate-90"
  />
</a>

/* 4. Status icon — NEVER colour-only; pair with text. */
<p className="flex items-center gap-2 text-sm">
  <Icon as={CircleCheck} size="md" tone="success" />
  Deployment succeeded
</p>
```

### 10.4 If you want the filled house style

```tsx
// The filled family is the dominant one (317 vs 35). Phosphor's 256-grid geometry
// is a 1:1 match for what was captured.
import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react";

<CaretRight weight="fill" className="size-3 shrink-0 opacity-40" />
<MagnifyingGlass weight="regular" className="size-4 shrink-0 text-icon" />
```

Phosphor already emits `width="1em" height="1em" fill="currentColor"
viewBox="0 0 256 256"` — exactly the attribute set observed in the capture. Set
`<IconContext.Provider value={{ weight: "fill", size: "1em" }}>` at the app root and
let `size-*` utilities do the sizing.

---

## 11. Do / Don't

**Do**
- Default to **16px (`size-4`)**; use **12px** for carets and dense trailing glyphs.
- Put `shrink-0` on every icon inside a flex row.
- Let colour arrive via `currentColor` — set `color` on the parent control.
- Use the `--text-color-kumo-*` tokens; they flip themes on their own.
- Give icon-only buttons a **34px (`size-8.5`) `rounded-lg`** hit area and an `aria-label`.
- Use **`opacity`** (40 / 50 / 0→100) to de-emphasise, exactly as the source does.
- Keep icon transitions at **200ms** (movement) / **100ms** (crossfade), and respect
  `prefers-reduced-motion`.

**Don't**
- Don't hardcode `fill="#…"` or `stroke="#…"` — it breaks dark mode instantly.
- Don't invent an icon-specific colour palette; there isn't one, and there shouldn't be.
- Don't use raw palette utilities (`text-neutral-500`, `text-muted`) on icons — they
  aren't theme-paired and force you to hand-write `dark:` variants.
- Don't mix stroke weights on one screen: 1.5 at 18px, 2 at 14px, 1.75 for external-link.
- Don't ship the 39 logo/illustration SVGs as icons — they are assets with their own
  licensing and viewBoxes (`icons.likelyLogosOrIllustrations`).
- Don't ship 2px or 93px as icon sizes — those are mining artifacts (§2).
- Don't make a bare 12/14px glyph the click target; wrap it in a ≥24px control.
- Don't signal status with hue alone.

---

## 12. Gaps & prescriptive callouts

| Item | Status |
| --- | --- |
| Icon size scale (12/14/16/18/24/48) | **OBSERVED** — `facts.json → icons.sizesByUse` |
| Fill-dominant style, 256-unit grid | **OBSERVED** — `icons.styleSplit`, `icons[].viewBoxes` |
| Stroke weights 1.5 / 2 / 1.75 | **OBSERVED** — captured SVG attrs + `_classes.json` |
| `currentColor` contract | **OBSERVED** — every captured icon |
| `text-kumo-*` colour roles | **OBSERVED** — `_classes.json` class→token map |
| Icon-only button (34px / `rounded-lg` / inset brand ring) | **OBSERVED** — sidebar trigger |
| Caret/search/close/pin/collapse/back/actions roles | **OBSERVED** — via `aria-label` + placement |
| **Specific glyph *names*** | **PRESCRIPTIVE** — the mine hashes geometry, not names. Lucide/Phosphor names in §8 are our mapping. |
| **Status icon glyphs** | **PRESCRIPTIVE** — `usage.statusIntent` is `{}`; the *tokens* are real, the glyphs are our pick. |
| **`.link-external-icon`** | Defined in CSS, **never used** in the captured DOM. Weight is real; usage is prescriptive. |
| **`--color-icon-*` Tailwind aliases** | **OURS** — thin aliases over observed tokens so Tailwind emits `text-icon-*`. The source has no icon-scoped colour token. |
| Icon animation library / sprite sheet | **NOT OBSERVED** — all icons are inline `<svg>`; no `<use>`/sprite, no icon font (`fonts.faceCount` = 0). |
