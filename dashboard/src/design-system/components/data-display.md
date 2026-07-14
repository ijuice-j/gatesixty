# Data Display — cloudflare-dashboard

Tables · Cards/Panels/Surfaces · Lists · Code & Log blocks · Steppers · Avatars · Progress · Skeletons

Recipes: [`data-display.css`](./data-display.css) — every rule is scoped under `.ds` and references `var(--token)` only.

---

## 0. Provenance & honesty ledger

This target was classified **`utility-compiled`** (`classification.json`: utility ratio 0.79, verdict `utility-compiled`, `computedStyleMandatory: true`). Atomic Tailwind classes carry the values; the named `--color-kumo-*` / `--text-color-kumo-*` tokens are the *semantic* layer those utilities resolve to. Where a raw declaration and a token disagree, **the token wins** in these recipes and the discrepancy is called out below.

| Family | Status | Evidence |
|---|---|---|
| **Table** | ✅ **Observed** | `elementTotalsDeduped.table = 2`. `members.html` is the canonical instance (full Tailwind anatomy); `analytics.html` has a second, hash-classed table. |
| **Card / Panel / Surface** | ✅ **Observed** | The `shadow-xs ring ring-kumo-line bg-kumo-base rounded-lg p-4` recipe appears 4×; `ring-kumo-line` is used 45×. Tagged `data-surface-color="primary"`. |
| **List** | ✅ **Observed** | `home-overview.html`: `<ul role="list" class="divide-y divide-border …">` with `role="listitem"` rows. |
| **Skeleton** | ✅ **Observed** | `.skeleton-line` + `.skeleton-line:after` — the **only named CSS component** in `_classes.json`. 8 instances on `workers-and-pages`. |
| **Progress** | ✅ **Observed** | A track/indicator pair on `workers-and-pages` (`h-2` track + `#f6821f` fill, `width: 0%`). |
| **Inline code / mono text** | ✅ **Observed** | `font-mono text-sm text-neutral-500 truncate` and `font-mono text-xs tabular-nums truncate text-kumo-subtle` (audit-log). `<kbd>` at `text-xs/4`, 8 uses. |
| **Code block / Log viewer chrome** | ⚠️ **PRESCRIPTIVE** | **Zero** `<pre>` and **zero** `<code>` elements exist in any captured page. The block recipes are a faithful extension of the surface system — not observed components. |
| **ANSI / terminal palette** | ❌ **ABSENT** | There is **no** ansi/terminal/console token family in `tokens/colors.css`, and no terminal surface in any page. See §6 for a *prescriptive* mapping built only from tokens that exist. |
| **Avatar** | ⚠️ **PRESCRIPTIVE** | **No avatar component exists.** `img` deduped = 4, all vendor logos/illustrations. The `size-4/size-5 rounded-full` circles in the capture are **loading placeholders**, not avatars. |
| **Stepper** | ⚠️ **PRESCRIPTIVE** | **Zero** `aria-current="step"` and zero stepper markup across all 8 pages. |

The kumo design system names its components via `data-kumo-component`. The **complete** observed set is: `Sidebar`, `Button`, `LinkButton`, `Tabs`, `Select`, `Breadcrumbs`, `Popover`, `Dialog`. **No data-display family is a named kumo component** — tables, cards and lists are all ad-hoc utility compositions, and `.skeleton-line` is the lone CSS-level component.

### Warnings carried over from the source

1. **Token packaging.** `tokens/colors.css` emits the Tailwind base scale (`--text-*`, `--radius-*`, `--spacing`, `--font-weight-*`, `--leading-*`) at **`:root`** — no promotion step is needed. Recipes that depend on the base scale still use `var(--x, <exact-value-from-tokens>)` so they also degrade correctly when imported standalone without the token layer. The semantic `--color-kumo-*` / `--text-color-kumo-*` tokens are on `:root` / `[data-mode=dark]` and are referenced with no fallback.
2. **The skeleton is not theme-aware in the source.** `.skeleton-line` fills with a literal `#f3f4f6` and shimmers with `#00000014`. Both stay light in dark mode. Re-authored on `--color-kumo-fill` / `--color-kumo-shadow-edge`.
3. **The list divider is not theme-aware in the source.** `divide-border` → `--color-border: #d9d9d9`, a legacy `cl1` token with a single value. Re-authored on `--color-kumo-line`.
4. **The progress bar has no `role="progressbar"`** and no `aria-value*` in the source — it is invisible to assistive tech. Our recipe fixes this (§7).
5. **Sortable table headers have no `aria-sort`** in the source, despite shipping a real sort `<button>` inside each `<th>`. Our recipe fixes this (§3).

---

## 1. Foundations these recipes rely on

| Trait | Value | How we know |
|---|---|---|
| **House radius** | `--radius-lg` = `.5rem` | `rounded-lg` used **946×** vs `rounded-md` 21×, `rounded-sm` 2×, `rounded-xl` 1×. Pills/dots use `rounded-full` (162×). |
| **Elevation** | a hairline **ring**, not a border | The card recipe is `ring ring-kumo-line` + `shadow-xs`. `ring-kumo-line` appears 45×. |
| **Shadow tokens** | `--color-kumo-shadow-drop`, `--color-kumo-shadow-edge` | Two theme-aware shadow *colours*. Light drop = 8% black; dark drop = 30% black. Dark `edge` flips to 10% **white** — dark-mode elevation is a light rim, not a darker shadow. |
| **Focus ring** | 2px `--color-kumo-brand` on `:focus-visible` | `focus-visible:ring-2` + `focus-visible:ring-kumo-brand` — **80×**. Plain `:focus` gets `--color-kumo-focus` @ 50% (80×). `focus-visible:ring-inset` 19×. |
| **Accents** | `--color-kumo-brand` (blue) = focus/selection · `--text-color-kumo-brand` (`#f6821f`) = Cloudflare orange | The progress indicator fills with `#f6821f`, which is `--text-color-kumo-brand`'s value in **every** theme. |
| **Type scale** | `--text-base` = **14px**, `--text-sm` = 13px, `--text-xs` = 12px, `--text-lg` = 16px | Note `text-base` is 14px, not 16px. `text-sm` dominates (914 uses); `th` pairs with `text-sm` (7×). |
| **Row rhythm** | header **44px** (`h-11`), body row / list row **48px** (`h-12`) | Confirmed by an inline `height: 48px` on an `h-12` list row. |
| **Cell padding** | `p-3` (12px) default · `px-4` (16px) in the data grid | `[&_td]:p-3` on the base `<table>`; `lg:px-4!` on grid cells. |
| **Spacing unit** | `--spacing` = `.25rem` | `gap-2` (8px) is the house gap — 1572 uses. |
| **Motion** | `--default-transition-duration` = `.1s`, `--ease-in-out` = `cubic-bezier(.4,0,.2,1)` | Progress uses `duration-300`; shimmer 1.5s. **8** `prefers-reduced-motion` rules — honour them. |

### Surface ladder

| Token | Role |
|---|---|
| `--color-kumo-canvas` | Page background, *behind* everything |
| `--color-kumo-base` | Default card / table / panel surface |
| `--color-kumo-elevated` | A card resting on another card |
| `--color-kumo-overlay` | Floating layers — menus, popovers |
| `--color-kumo-recessed` | An inset well — code, logs, empty states |
| `--color-kumo-control` | Form-control surface |
| `--color-kumo-line` | Hairline ring/divider **(theme-aware — prefer this)** |
| `--color-kumo-hairline` | Alternate hairline (slightly stronger in light) |
| `--color-kumo-fill` | Neutral fill — skeletons, progress tracks, cell borders |
| `--color-kumo-fill-hover` | **The universal hover fill** — rows, list items, cards |

---

## 2. Card / Panel / Surface

### Anatomy

```
.ds-card                        ← bg-kumo-base · rounded-lg · hairline ring · shadow-xs · p-4 · overflow-hidden
├── .ds-card__header            ← flex row, space-between, gap-2
│   ├── .ds-card__title         ← text-lg / semibold / --text-color-kumo-strong
│   └── (actions slot)
├── .ds-card__description       ← text-sm / --text-color-kumo-subtle / text-wrap: pretty
├── .ds-card__body              ← text-base / --text-color-kumo-default
│   └── .ds-card__metric        ← text-3xl / semibold / tabular-nums   (stat cards)
└── .ds-card__footer            ← border-top hairline, gap-2
```

### Variants

| Class | Effect | Status |
|---|---|---|
| *(base)* `.ds-card` | ring + `shadow-xs`, `p-4` | **Observed** (4×) |
| `.ds-card--bordered` | 1px border instead of ring, `p-6`, no shadow | **Observed** |
| `.ds-card--elevated` | `--color-kumo-elevated` + `--ds-shadow-md` | Extension |
| `.ds-card--recessed` | `--color-kumo-recessed`, ring only | Extension |
| `.ds-card--info` / `--success` / `--warning` / `--danger` | Status-tinted fill via the `*-tint` tokens | Extension of observed tokens |
| `.ds-card--interactive` | hover → `--color-kumo-fill-hover`; `:focus-within` → brand ring | Extension |

**Elevation ladder** — `.ds-elevation-0` (ring only) → `-1` (ring + `shadow-xs`, the card default) → `-2` (popover) → `-3` (dialog). All four are built from the same two shadow tokens, so dark mode automatically swaps the dark drop for a light rim.

### States

| State | Treatment |
|---|---|
| Rest | ring `--color-kumo-line` + `shadow-xs` |
| Hover *(interactive only)* | background → `--color-kumo-fill-hover` |
| Focus-within *(interactive only)* | 2px `--color-kumo-brand` ring |
| Loading | swap the body for `.ds-skeleton` lines; keep the card's box so layout doesn't jump |
| Empty | centred stack, `p-16`, `--text-color-kumo-subtle` copy (matches the observed empty state) |

### Clickable cards

Do **not** put `onClick` on the card `<div>`. Wrap the title in an `<a class="ds-card__link">` — the `::after { inset: 0 }` stretches its hit area over the whole card while keeping exactly one link in the a11y tree. This is the same technique the target uses on table rows.

---

## 3. Table

Two treatments ship in the source. Pick deliberately.

### (a) `.ds-table` — the plain table

The defaults carried on the `<table>` element itself:

```
[&_td]:border-b  [&_td]:border-kumo-fill  [&_tr:last-child_td]:border-b-0
[&_td]:p-3
[&_th]:border-b  [&_th]:border-kumo-fill  [&_th]:p-3
[&_th]:font-semibold  [&_th]:text-base  [&_th]:bg-kumo-base
isolate  text-base  text-left  text-kumo-default  w-full
```

Rows are separated by a hairline in `--color-kumo-fill`; the last row's border is removed. Use with `.ds-table--compact` for the `p-3` density.

### (b) `.ds-table--grid` — the interactive data grid *(the interesting one)*

This is the pattern that gives Cloudflare's tables their look. **Rows do not paint their own background.** Instead:

```
<div class="ds-table-panel">                    ← hairline ring + rounded-lg
  <div class="ds-table-scroll">                 ← overflow-x: auto
    <table class="ds-table ds-table--grid">
      <thead>
        <tr>
          <th>                                  ← h-11 (44px) · text-sm · font-medium · subtle · transparent bg
            <button class="ds-table__sort">…</button>
      <tbody>
        <tr class="ds-table__row">              ← the hover "group"; position: relative
          <td>                                  ← h-12 (48px) · position: relative · z-index: 0 · overflow: clip
            <div class="ds-table__row-surface"></div>   ← ABSOLUTE surface layer, z-index: -10
            <a class="ds-table__row-link">…</a>          ← stretched link, ::after inset-0 at -z-10
```

Why the layer exists:
- **One hover band.** `:hover` on the `<tr>` repaints every cell's surface layer at once, so the row lights up as a single continuous band even though `<td>`s can't carry a shared background reliably across borders.
- **Rounded tbody corners.** The **first** row's first/last cell rounds its top corners (`border-start-start-radius` / `border-start-end-radius`) and grows its side borders 1px outward (`left: -1px` / `right: -1px`) so they kiss the panel ring. The tbody reads as a rounded card.
- **Full-row click target.** The row link's `::after` covers the row at `z-index: -10` — above the surface layer, below any real controls in other cells. The whole row is clickable, but the buttons in the last column still work.

### Sizes / density

| | Header | Body row | Inline padding |
|---|---|---|---|
| Default (grid) | `44px` (`h-11`) | `48px` (`h-12`) | `16px` (`px-4`) |
| `.ds-table--compact` | auto | auto | `12px` (`p-3`) |

### All states

| State | Selector | Treatment |
|---|---|---|
| **Header rest** | `th` | `--text-color-kumo-subtle`, `text-sm`, `font-medium`, transparent bg |
| **Header sticky** | `.ds-table--sticky thead th` | `position: sticky; top: 0` on `--color-kumo-base` |
| **Header sortable, rest** | `.ds-table__sort` | caret hidden (`opacity: 0`) |
| **Header sortable, hover/focus** | `:hover`, `:focus-visible` | caret revealed; label → `--text-color-kumo-default` |
| **Header sorted** | `th[aria-sort="ascending"\|"descending"]` | caret pinned visible; label → default colour |
| **Row rest** | `.ds-table__row-surface` | `--color-kumo-base` + `border-top` `--color-kumo-line` |
| **Row hover** | `tr:hover` | surface → **`--color-kumo-fill-hover`** |
| **Row selected** | `tr[aria-selected="true"]` | surface → `--color-kumo-brand` @ **10%** |
| **Row selected + hover** | | `--color-kumo-brand` @ **20%** (keeps the two states distinguishable) |
| **Row focus-within** | `tr:focus-within` | hover fill + inset 2px `--color-kumo-brand` ring |
| **Row disabled** | `tr[aria-disabled="true"]` | `--text-color-kumo-inactive`, `pointer-events: none` |
| **Zebra** | `.ds-table--zebra` | `--color-kumo-tint` on even rows — **PRESCRIPTIVE, opt-in** |
| **Cell empty** | `.ds-table__cell--empty` | the `—` em-dash placeholder in `--text-color-kumo-inactive` (observed) |
| **Loading** | `.ds-skeleton-row` | keeps the 48px row height while skeleton lines fill the cells |
| **Empty table** | `.ds-table__empty` | `p-16`, centred, subtle (the observed empty-state padding) |

> **Zebra striping is not part of this design language.** No `odd:`/`even:` utility appears anywhere in the capture — the target separates rows with hairlines. `.ds-table--zebra` exists only as an escape hatch, and must **never** be combined with `.ds-table--grid` (the surface layers already own the row background; you'd get two competing fills).

### Cell helpers

`.ds-table__cell--numeric` (right-aligned + `tabular-nums`) · `.ds-table__cell--shrink` (the observed `w-px` "shrink to content" idiom) · `.ds-table__cell--muted` · `.ds-table__cell--empty`.

---

## 4. List

The flat, hairline-divided alternative to a table — used for feeds and resource lists.

```
<ul class="ds-list" role="list">                   ← divider between items
  <li class="ds-list__item" role="listitem">       ← grid: auto 1fr auto · min-height 48px · gap-2
    <span class="ds-list__media">   …              ← avatar / icon / status dot
    <div  class="ds-list__content"> …              ← min-width: 0  ← REQUIRED for truncation
      <div class="ds-list__title">  …
      <div class="ds-list__meta">   …
    <div  class="ds-list__trailing">…              ← justify-self: end
```

The observed grid template is literally `auto 1fr auto` at `height: 48px`. `min-width: 0` on the content column is what lets `text-overflow: ellipsis` work inside a grid track — omit it and long titles will blow out the row.

**Variants:** `.ds-list__item--interactive` (hover fill + `rounded-lg`). **States:** hover → `--color-kumo-fill-hover`; `[aria-selected="true"]` → brand @ 10%; `[aria-disabled="true"]` → inactive + no pointer events.

---

## 5. Code, log & keyboard

**Observed:** inline mono text only — `font-mono text-sm text-neutral-500 truncate` (resource IDs on `workers-and-pages`) and `font-mono text-xs tabular-nums truncate text-kumo-subtle` (timestamps in `audit-log`). The `tabular-nums` pairing is deliberate: it makes the timestamp gutter rigid so the log body starts at the same x on every line.

**Prescriptive:** `.ds-code-block` and `.ds-log` chrome. No `<pre>`/`<code>` element exists in the capture, so these are built from the surface system: a `--color-kumo-recessed` well + hairline ring + `--radius-lg`.

| Class | Purpose |
|---|---|
| `.ds-code` | Inline code — recessed fill, `--radius-sm`, hairline |
| `.ds-code-block` | Block viewer — recessed, `--radius-lg`, `overflow-x: auto`, `tab-size: 2` |
| `.ds-code-block__toolbar` | Language label + copy button, divided by a hairline |
| `.ds-log` | Log viewer well |
| `.ds-log__row` | `auto auto 1fr` grid — time · level · message; hairline-divided; hover fill |
| `.ds-log__time` | subtle + `tabular-nums` **(observed treatment)** |
| `.ds-log__level--debug\|info\|warn\|error\|success` | Severity, mapped onto `--text-color-kumo-{subtle,info,warning,danger,success}` |
| `.ds-log__row--error` / `--warning` | Whole-row tint at 10% of the status colour |
| `.ds-kbd` | `<kbd>` — note the target keeps it in the **sans** stack at `text-xs`, not mono |

---

## 6. ANSI / terminal palette — **ABSENT**

**This target has no ANSI or terminal colour tokens.** There is no `--*-ansi-*`, `--*-terminal-*` or `--*-console-*` name in `tokens/colors.css`, `_classes.json` or `computed-tokens.json`, and no terminal surface renders on any of the 8 captured pages. Anyone claiming an observed ANSI mapping for this design system would be fabricating it.

If you need to render ANSI output, the mapping below is **PRESCRIPTIVE**. It invents no colours: every slot points at a `--cf-*` ramp token that **does** exist in the token layer (the Cloudflare brand ramp, 0 = darkest → 9 = lightest). Opt in by adding `.ds-ansi` to the container.

| ANSI | SGR | Normal → token | Bright | SGR | Bright → token |
|---|---|---|---|---|---|
| Black | 30 | `--cf-gray-0` | Bright black | 90 | `--cf-gray-4` |
| Red | 31 | `--cf-red-5` | Bright red | 91 | `--cf-red-6` |
| Green | 32 | `--cf-green-5` | Bright green | 92 | `--cf-green-6` |
| Yellow | 33 | `--cf-gold-5` | Bright yellow | 93 | `--cf-gold-6` |
| Blue | 34 | `--cf-blue-5` | Bright blue | 94 | `--cf-blue-6` |
| Magenta | 35 | `--cf-violet-5` | Bright magenta | 95 | `--cf-violet-6` |
| Cyan | 36 | `--cf-cyan-5` | Bright cyan | 96 | `--cf-cyan-6` |
| White | 37 | `--cf-gray-8` | Bright white | 97 | `--cf-gray-9` |

Background slots (40–47 / 100–107) reuse the same values. The `.ds-ansi` block indirects each slot through a `--ds-ansi-*` alias, so you can retarget the whole palette in one place (e.g. lighten the ramp step in dark mode) without touching the `.ds-ansi-fg-*` classes.

⚠️ The `--cf-*` ramps are **single-value**, not theme-aware. On a light background, `--cf-gray-0` (near-black) is correct for ANSI black; on a dark terminal you'll want to flip black/white. Terminals conventionally paint on a dark ground — consider always pairing `.ds-ansi` with `.ds-log` on `--color-kumo-contrast` regardless of theme.

---

## 7. Progress

**Observed** on `workers-and-pages`:

```html
<div class="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
  <div class="h-full bg-[#f6821f] rounded-full transition-all duration-300" style="width: 0%"></div>
</div>
```

- Track: `h-2` (8px), `rounded-full`, `overflow-hidden`. The `neutral-200 / neutral-700` pair **is** `--color-kumo-fill`, so we reference the token.
- Indicator: filled with **`#f6821f` — Cloudflare orange**. That literal is exactly `--text-color-kumo-brand`, which holds the same value in *every* theme (`:root`, `[data-mode=dark]`, `.theme-kumo`). We reference the token rather than the hex.
- Transition: `300ms` on width — noticeably slower than the `.1s` house default, because a growing bar reads as motion, not as a state flip.

Drive it with the `--ds-progress-value` custom property (`style="--ds-progress-value: 62%"`), not an inline `width`.

| Variant | Effect |
|---|---|
| `.ds-progress--sm` / `--lg` | 4px / 12px track |
| `.ds-progress--info` / `--success` / `--warning` / `--danger` | Re-tint the indicator — for usage meters that redline near quota |
| `.ds-progress--indeterminate` | A 33% band that travels; disabled under reduced motion |

> **A11y gap in the source:** the observed bar has **no `role="progressbar"`** and no `aria-value*` attributes. It is invisible to screen readers. Always author it as shown in §11.

---

## 8. Skeleton

The **only named CSS component** in the entire capture. Geometry is exact:

| Property | Source value | Our token |
|---|---|---|
| `height` | `.5rem` | `.5rem` |
| `border-radius` | `2px` | `--radius-xs` (`.125rem` = **2px** — exact match) |
| `background-color` | `#f3f4f6` ⚠️ raw | `--color-kumo-fill` |
| shimmer gradient | `#0000 → #00000014 → #0000` ⚠️ raw | `transparent → --color-kumo-shadow-edge → transparent` |
| `animation` | `shimmer var(--shimmer-duration, 1.5s) var(--shimmer-delay, 0s) infinite ease-in-out` | same |

Three **per-instance inline custom properties** drive it — this is the mechanism, and it's worth copying:

```html
<div class="ds-skeleton" style="--skeleton-width: 52%; --shimmer-duration: 1.35s; --shimmer-delay: 0.30s"></div>
```

Observed real values: widths `32% / 52% / 54% / 78%`; durations `1.35s–1.70s`; delays `0.01s–0.41s`. Randomising all three per line is what stops a skeleton block from looking like a metronome — the lines are ragged like real text, and they shimmer out of phase.

Lists additionally set `--stagger-delay` per row and feed it into `animation-delay`, so rows wake in sequence.

| Variant | Geometry | Observed as |
|---|---|---|
| *(base)* `.ds-skeleton` | 8px tall, 2px radius | `.skeleton-line` |
| `.ds-skeleton--text` | 16px tall, `--radius-sm` | `h-4 … rounded` |
| `.ds-skeleton--circle` | 20px, `rounded-full` | `size-5 animate-pulse rounded-full` |
| `.ds-skeleton--block` | 32px, `--radius-lg` | the `h-8` sparkline slot |
| `.ds-skeleton--pulse` | opacity pulse instead of the shimmer sweep | `animate-pulse` (2s, `cubic-bezier(.4,0,.6,1)`) |

The target uses **both** techniques: the shimmer sweep for text lines, `animate-pulse` for circles and avatar placeholders.

---

## 9. Avatar — **PRESCRIPTIVE**

**No avatar component exists in this target.** Worth being precise about why, because the capture *looks* like it has avatars and doesn't:

- `elementTotalsDeduped.img = 4` — and all four are vendor logos/illustrations (OneTrust consent logos, an inline SVG data-URI).
- The `size-4 rounded-full bg-neutral-100 dark:bg-neutral-900` circles (14×) and `size-5 animate-pulse rounded-full` circles (5×) are **skeleton placeholders in a loading list**, not avatars.
- No element is named, roled or classed as an avatar anywhere in the 8 pages.

So the recipe below is an extension of the system, not an extraction from it. It is anchored to the target's **real** box scale rather than an imported convention.

### Anatomy

```
.ds-avatar                     ← rounded-full · --color-kumo-fill · overflow-hidden · inline-flex
├── .ds-avatar__image          ← object-fit: cover
├── .ds-avatar__fallback       ← initials, uppercase, medium weight (shows through if the image fails)
└── .ds-avatar__status         ← 6px dot, bottom-right, 2px ring in --color-kumo-base
```

### Sizes

| Class | Box | Anchored to | Initials? |
|---|---|---|---|
| `.ds-avatar--xs` | **16px** | `size-4` in markup; 16px is an observed icon size | ✗ — use an image/icon |
| `.ds-avatar--sm` | **20px** | `size-5` in markup | ✗ |
| `.ds-avatar--md` | **24px** | `size-6` — the only observed `squareBoxes` entry (`w-6 h-6`) | ✓ (`--text-xs`) |
| `.ds-avatar--lg` | **32px** | fits the 48px list/table row with breathing room | ✓ (`--text-sm`) |
| `.ds-avatar--xl` | **48px** | 48px is an observed icon size (9 uses) | ✓ (`--text-lg`) |

Below `--md`, initials are not legible — use an image or a fallback icon. `--md` and `--lg` are the sizes that belong in a 48px table/list row.

### Variants & states

| Class | Effect |
|---|---|
| `.ds-avatar--square` | `--radius-lg` instead of `rounded-full` — for org/project/service tiles |
| `.ds-avatar__status--online` / `--busy` / `--away` / `--offline` | `--color-kumo-success` / `--danger` / `--warning` / `--interact` |
| `.ds-avatar-group` | Overlapping stack (`-.5rem` overlap + a 2px `--color-kumo-base` ring to punch each out) |

The status-dot geometry (`size-1.5` = 6px, `rounded-full`, `aria-hidden="true"`) **is** observed — the target uses exactly that dot as a standalone health indicator (`bg-green-500 dark:bg-green-400`).

---

## 10. Stepper — **PRESCRIPTIVE**

**No stepper or wizard exists in this target.** Zero `aria-current="step"`, zero stepper markup across all 8 pages. Built strictly from observed primitives: `rounded-full` indicators, `--color-kumo-brand` for the active step, `--color-kumo-line` hairline connectors, `--color-kumo-fill` for the inactive track.

### Anatomy

```
<ol class="ds-stepper">                              ← horizontal by default
  <li class="ds-stepper__step" data-state="complete">
    <span class="ds-stepper__indicator">✓</span>     ← 28px rounded-full
    <span class="ds-stepper__label">Details</span>
  <li class="ds-stepper__step" aria-current="step">  ← the active step
  <li class="ds-stepper__step">                      ← upcoming
```

The connector is a `::after` hairline between adjacent indicators — it inherits `--color-kumo-brand` once the step is complete, so the completed run of the track reads as one continuous brand line.

### States

| State | Selector | Indicator | Label |
|---|---|---|---|
| Upcoming | *(default)* | `--color-kumo-fill` / subtle text | `--text-color-kumo-subtle` |
| Active | `[aria-current="step"]` | `--color-kumo-brand` + a 3px brand-@20% halo | strong + medium weight |
| Complete | `[data-state="complete"]` | `--color-kumo-brand` + inverse text; connector turns brand | subtle |
| Error | `[data-state="error"]` | `--color-kumo-danger` + inverse text | `--text-color-kumo-danger` |
| Disabled | `[aria-disabled="true"]` | `--text-color-kumo-inactive` | — |

`.ds-stepper--vertical` flips the axis (connector becomes a vertical rule down the left).

Complete and error states must carry an **icon** (check / alert), not just a colour — see §11.

---

## 11. Accessibility

**Table**
- Use real semantics: `<table> <caption> <thead> <th scope="col"> <tbody> <td>`. Never rebuild a table from `<div>`s — the layered-surface trick works fine on real `<td>`s.
- **Set `aria-sort`** on the sorted `<th>` (`ascending` / `descending` / `none`). The source ships a sort button but **omits `aria-sort` entirely** — don't inherit that bug. Our CSS keys the pinned caret off `[aria-sort]`, so getting the a11y right is what makes the visual right.
- The stretched row link must remain a real `<a href>`. Keyboard users tab to it; `:focus-within` on the row paints the same band `:hover` does.
- Never put a second interactive control *underneath* the stretched link. Controls in other cells need `position: relative` (or any stacking context above `-z-10`) so they stay clickable — and each needs its own accessible name.
- Row selection → `aria-selected` on the `<tr>` plus `<table aria-multiselectable>` where relevant. Selection is signalled by a **brand tint, not colour alone** in practice, because the checkbox state carries it — if you have no checkbox column, add an icon or bold weight.
- Announce async table updates with `aria-live="polite"` on the tbody wrapper, or `aria-busy="true"` while loading.

**Progress**
```html
<div class="ds-progress" role="progressbar"
     aria-valuenow="62" aria-valuemin="0" aria-valuemax="100"
     aria-label="Storage used">
  <div class="ds-progress__indicator" style="--ds-progress-value: 62%"></div>
</div>
```
For the indeterminate variant, **omit `aria-valuenow`** entirely — that's what signals "unknown duration". Never fake it with `0`.

**Skeleton**
- Skeletons are decorative. Put `aria-hidden="true"` on them and `aria-busy="true"` on the region they're standing in for, so SRs announce "busy" instead of reading a wall of empty boxes.
- Pair with a visually-hidden live region (`<span class="sr-only" role="status">Loading members…</span>`).

**List** — `role="list"` on the container is **required** when you also apply `list-style: none`; Safari/VoiceOver drops list semantics when the marker is removed. The source does this correctly.

**Avatar** — an image avatar needs `alt` with the person's name **only if the name isn't already adjacent in the DOM**; if it is, use `alt=""` to avoid double-announcing. The status dot is `aria-hidden="true"` (the source does this) — its meaning must be conveyed in text.

**Stepper** — `<ol>` + `aria-current="step"` on the active item. Completed/error state must not rely on colour alone: pair with a check/alert icon and a text label.

**Contrast** — `--text-color-kumo-subtle` on `--color-kumo-base` is the workhorse for metadata. It clears 4.5:1 in both themes, but `--text-color-kumo-inactive` (used for the `—` placeholder and disabled rows) **does not** — reserve it for genuinely non-essential content, never for text a user must read.

**Reduced motion** — the source ships 8 `prefers-reduced-motion` rules. Our recipes kill the shimmer, pulse and indeterminate sweeps while keeping placeholders visible.

---

## 12. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Draw card & table edges with the **hairline ring** (`--color-kumo-line`) | Reach for `border` + a heavy shadow — this system is flat and ringed |
| Use `--radius-lg` (`.5rem`) for cards, tables, panels, rows | Mix radii. `rounded-lg` outnumbers everything else 946 : 21 |
| Use `--color-kumo-fill-hover` for **every** hover fill (rows, list items, cards) | Invent a per-component hover colour |
| Randomise `--skeleton-width` / `--shimmer-duration` / `--shimmer-delay` per line | Ship identical skeleton lines shimmering in lockstep |
| Separate rows with hairlines | Add zebra striping — it isn't in this language |
| Let the grid table's surface layer own the row background | Set a background on `<tr>` **and** use `.ds-table--grid` — two competing fills |
| Use `tabular-nums` for timestamps, IDs and any numeric column | Let proportional figures make numeric columns ragged |
| Reserve `--text-color-kumo-brand` (orange) for the progress fill / brand moments | Use the orange as a general accent — **focus and selection are blue** (`--color-kumo-brand`) |
| Give the list content column `min-width: 0` | Wonder why `truncate` does nothing inside your grid |
| Put `role="progressbar"` + `aria-value*` on progress | Copy the source's bar verbatim — it's invisible to AT |
| Set `aria-sort` on sorted headers | Copy the source's headers verbatim — they omit it |
| Keep the stretched row link a real `<a href>` | Put `onClick` on the `<tr>` |

---

## 13. Using this in Tailwind CSS v4 + shadcn/ui

### Wiring the tokens

Import the token layer, then expose the semantic tokens to Tailwind's utility generator with `@theme inline` so `bg-kumo-base`, `ring-kumo-line`, `text-kumo-subtle` etc. exist as first-class utilities — the same names the source uses.

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tokens/colors.css";
@import "../design-system/tokens/typography.css";
@import "../design-system/components/data-display.css";

/* next-themes writes .dark on <html>; the token layer keys off [data-mode=dark].
   Bridge the two so one class flips everything. */
@custom-variant dark (&:where(.dark, .dark *));
:root:has(.dark), .dark { color-scheme: dark; }
```

```html
<!-- Simplest bridge: have next-themes write the attribute the tokens expect. -->
<ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
```
Using `attribute="data-mode"` makes next-themes emit `<html data-mode="dark">`, which is **exactly** the selector `tokens/colors.css` already ships. No re-mapping needed. If you must keep the `.dark` class, add `.dark { /* re-declare the [data-mode=dark] block */ }` — or simply `@custom-variant dark (&:is([data-mode=dark] *))`.

```css
@theme inline {
  --color-kumo-base:      var(--color-kumo-base);
  --color-kumo-canvas:    var(--color-kumo-canvas);
  --color-kumo-elevated:  var(--color-kumo-elevated);
  --color-kumo-recessed:  var(--color-kumo-recessed);
  --color-kumo-line:      var(--color-kumo-line);
  --color-kumo-fill:      var(--color-kumo-fill);
  --color-kumo-fill-hover:var(--color-kumo-fill-hover);
  --color-kumo-brand:     var(--color-kumo-brand);
  --radius:               var(--radius-lg);   /* shadcn reads --radius */
}
```

Setting `--radius` to `--radius-lg` (`.5rem`) makes every shadcn component adopt the house radius for free.

### Component mapping

| This doc | shadcn/ui | Notes |
|---|---|---|
| `.ds-card` | `<Card>` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` | Override the default `border` + `shadow-sm` with `ring ring-kumo-line shadow-xs border-0` |
| `.ds-table` | `<Table>` / `TableHeader` / `TableRow` / `TableHead` / `TableCell` | shadcn's Table is a thin wrapper over real `<table>` semantics — ideal. Pair with **TanStack Table** for sorting/selection |
| `.ds-table--grid` | *(custom)* | shadcn has no layered-surface row. Add the `.ds-table__row-surface` div inside each `TableCell` |
| `.ds-list` | *(no shadcn primitive)* | Plain `<ul role="list">` + the recipes here |
| `.ds-skeleton` | `<Skeleton>` | shadcn's Skeleton is `animate-pulse` only. Keep it for circles; use `.ds-skeleton` for shimmering text lines |
| `.ds-progress` | `<Progress>` (Radix) | Radix already emits `role="progressbar"` + `aria-value*` — a strict improvement on the source |
| `.ds-avatar` | `<Avatar>` / `AvatarImage` / `AvatarFallback` (Radix) | **PRESCRIPTIVE** — no source component to match |
| `.ds-code-block` | *(no primitive)* | **PRESCRIPTIVE** — use Shiki/Prism for tokens, our chrome for the shell |
| `.ds-stepper` | *(no primitive)* | **PRESCRIPTIVE** — `<ol>` + `aria-current="step"` |
| Cell badges | `<Badge>` | The `--color-kumo-badge-*` family (8 hues + subtle text pairs) is the source of truth |
| Icons | **lucide-react** | Source icons are 12/14/16/**18**/24px and `fill`-dominant (317 fill vs 35 stroke). Lucide is stroke-based — set `strokeWidth={2}` and size `14`/`16` to sit right in 44/48px rows |

### `class-variance-authority` — Card

```ts
import { cva, type VariantProps } from "class-variance-authority";

export const cardVariants = cva(
  // base — the observed recipe
  "relative flex flex-col gap-3 overflow-hidden rounded-lg bg-kumo-base text-kumo-default ring ring-kumo-line shadow-xs",
  {
    variants: {
      surface: {
        base:     "bg-kumo-base",
        elevated: "bg-kumo-elevated shadow-md",
        recessed: "bg-kumo-recessed shadow-none",
      },
      intent: {
        none:    "",
        info:    "bg-kumo-info-tint",
        success: "bg-kumo-success-tint",
        warning: "bg-kumo-warning-tint",
        danger:  "bg-kumo-danger-tint",
      },
      padding: { sm: "p-3", md: "p-4", lg: "p-6" },   // md = the observed default
      interactive: {
        true: "cursor-pointer transition-colors hover:bg-kumo-fill-hover focus-within:ring-2 focus-within:ring-kumo-brand",
        false: "",
      },
    },
    defaultVariants: { surface: "base", intent: "none", padding: "md", interactive: false },
  }
);
export type CardProps = VariantProps<typeof cardVariants>;
```

### `class-variance-authority` — Table row

```ts
export const rowVariants = cva(
  "group relative z-0 [&>td]:h-12 [&>td]:relative [&>td]:z-0 [&>td]:overflow-clip [&>td]:px-4",
  {
    variants: {
      selected: { true: "", false: "" },
      disabled: { true: "text-kumo-inactive pointer-events-none", false: "" },
    },
    defaultVariants: { selected: false, disabled: false },
  }
);

// The surface layer lives inside each cell:
export const rowSurface =
  "absolute inset-y-0 inset-x-0 -z-10 border-t border-kumo-line bg-kumo-base transition-colors " +
  "group-hover:bg-kumo-fill-hover " +
  "group-aria-selected:bg-kumo-brand/10 group-aria-selected:group-hover:bg-kumo-brand/20";
```

`bg-kumo-brand/10` and `/20` are **real, compiled utilities in the source** — they resolve to `color-mix(in oklab, var(--color-kumo-brand) 10%, transparent)`. You are not inventing an opacity ramp.

### TanStack Table + the grid row

```tsx
<TableRow
  key={row.id}
  aria-selected={row.getIsSelected()}
  className={rowVariants({ selected: row.getIsSelected() })}
>
  {row.getVisibleCells().map((cell) => (
    <TableCell key={cell.id}>
      <div className={rowSurface} aria-hidden />
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  ))}
</TableRow>
```

Sorted header — set `aria-sort` so the CSS and the a11y tree agree:

```tsx
<TableHead
  aria-sort={
    header.column.getIsSorted() === "asc"  ? "ascending"  :
    header.column.getIsSorted() === "desc" ? "descending" : "none"
  }
  className="h-11 whitespace-nowrap bg-transparent px-4 text-sm font-medium text-kumo-subtle"
>
  <button className="ds-table__sort" onClick={header.column.getToggleSortingHandler()}>
    {flexRender(header.column.columnDef.header, header.getContext())}
    <ChevronsUpDown className="ds-table__sort-icon" size={14} />
  </button>
</TableHead>
```

### Skeleton with the source's stagger

```tsx
export function SkeletonLines({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="ds-skeleton"
          style={{
            // observed ranges: width 32–78%, duration 1.35–1.70s, delay 0.01–0.41s
            "--skeleton-width": `${32 + Math.random() * 46}%`,
            "--shimmer-duration": `${1.35 + Math.random() * 0.35}s`,
            "--shimmer-delay": `${Math.random() * 0.42}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
```

Wrap the region in `aria-busy={isLoading}` and pair with a `role="status"` live region.

### Fonts

`_fonts.json` is **empty** — the target ships **zero `@font-face` rules**; it relies on locally-installed/preloaded families (`--font-sans: "Inter Variable"`, `--font-mono: "Paper Mono"`). `tokens/typography.css` therefore substitutes open look-alikes: **Inter** (sans/heading) and **JetBrains Mono** (mono). Lead the `--font-*` stack with a licensed family name to switch to the exact faces. Note the mono stack matters here — every code, log, timestamp and resource-ID surface in §5 resolves through `--font-mono`.
