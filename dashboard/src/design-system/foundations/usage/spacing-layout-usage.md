# Spacing, Sizing & Layout — Usage Guidelines

**The decision layer.** [`../spacing-layout.md`](../spacing-layout.md) tells you *what the values are*;
[`../../tokens/index.css`](../../tokens/index.css) defines them. This doc tells you **which one to reach for, and when**.

Back to the hub: [`../usage-guidelines.md`](../usage-guidelines.md).

### How to read the provenance tags

| Tag | Means |
| --- | --- |
| `OBSERVED(n=…, pages=[…])` | A count that exists in `capture/facts.json`. |
| `DERIVED(from=…)` | Logically follows from the token/class data; the *rule* is inferred, the *inputs* are real. |
| `PRESCRIPTIVE` | Best practice **not** evidenced by the captures. Called out honestly every time. |

**Pages convention:** `facts.json`'s `usage.spacing`, `usage.radius`, `usage.controlHeights` and
`usage.buttonHeightTypePairs` histograms are **aggregated across all 8 captured pages** and are not broken down per
page. So `pages=[all 8]` below means exactly: `analytics, api-tokens, audit-log, billing, home-overview, members,
notifications, workers-and-pages` (`usage.pages`, `pageCount: 8`). Where a claim *is* page-resolvable
(`usage.perPage`, `usage.shell`), the specific pages are named.

---

## 0. The 60-second version

| I am sizing… | Reach for | Why (evidence) |
| --- | --- | --- |
| A button / link-as-button | **`h-9`** (36px) | Most-used real control height — `OBSERVED(n=32)` |
| A button in a dense toolbar / table row | `h-8` (32px) | `OBSERVED(n=24)` — a first-class rung, not a fallback |
| An icon-only button | `size-8` / `size-9` (**square = the height**) | `DERIVED(from=components/buttons.md §icon-only)` |
| The gap between two adjacent things | **`gap-2`** (8px) | `OBSERVED(n=1572)` — the single most-used utility in the capture |
| The gap between an icon and its label *inside* a control | `gap-1.5` (6px) | `OBSERVED(n=75)` |
| Horizontal padding of any control | **`px-3`** (12px) | `OBSERVED(n=890)` |
| A badge / pill | `px-1.5 py-0.5` (6/2px) | `OBSERVED(n=136 / n=138)` |
| A card | `p-4` (16px) | `OBSERVED(n=18)` |
| A dialog | `px-6 pb-6` (24px) | `OBSERVED(n=8 / n=8)` |
| Any corner | **`rounded-lg`** (8px) | `OBSERVED(n=946)` — 80% of all radii |
| A pill / avatar / dot | `rounded-full` | `OBSERVED(n=162)` |
| The page column | `px-6 md:px-8 lg:px-10 max-w-350 mx-auto` | `DERIVED(from=foundations/spacing-layout.md §5.4)` |

Everything below is the reasoning, the exceptions, and the traps.

---

## 1. Control heights — which rung, and when

### 1.1 Read the REAL control-height mine, not the raw one

`facts.json` ships **two** height mines. Only one is about controls.

| Mine | Contents | Use it for |
| --- | --- | --- |
| `usage.controlHeights` | `{ h-8: 24, h-9: 32, h-10: 2 }` — square icon/avatar boxes **already excluded** | **Buttons, links-as-buttons, fields.** This is the authoritative ladder. |
| `usage.rawControlHeightClasses` | `{ h-8: 33, h-9: 41, h-12: 44, h-11: 7, h-14: 4, h-10: 2 }` — unfiltered | **Rows and layout blocks only.** |

`OBSERVED(n=58 control-height uses total, pages=[all 8])`.

> **The trap:** `h-12` is the single largest raw height (n=44) — and it is **not a control**. If you sort raw heights
> you will "discover" a 48px button that does not exist. `usage.controlHeights` exists precisely to stop that.
> `DERIVED(from=facts.json usage.rawControlHeightClasses vs usage.controlHeights)`

### 1.2 The ladder

| Rung | Class | px | Uses | `<button>` | `<a>` | Share | When to use |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Default** | **`h-9`** | **36** | **32** | 26 | 6 | **55%** | Everything, unless you have a reason not to. Page actions, form submits, menu/select triggers, dialog footers. |
| **Compact** | `h-8` | 32 | 24 | 16 | 8 | 41% | Dense contexts: toolbars, table row actions, filter bars, the quick-search trigger. |
| **Roomier / rare** | `h-10` | 40 | **2** | 2 | — | 3% | Almost nothing. See the warning below. |

`OBSERVED(n=32 / 24 / 2, pages=[all 8])` — `usage.controlHeights` + `usage.controlHeightsByTag`.

**`h-9` (36px) is the DEFAULT rung.** It wins on total uses (32 vs 24) *and* on `<button>` specifically (26 vs 16).
`h-8` is a strong, legitimate second rung — at 41% it is not an edge case — but it is the **compact** rung, chosen for
density, not the baseline.

> ⚠️ **`h-10` is an outlier, not a "hero CTA".** It appears **twice**, on `<button>`, paired with `text-base`. That is
> all `facts.json` says about it — and `usage.variantClasses` and `usage.statusIntent` are both **empty objects**, so
> there is **zero intent evidence** in the capture tying any height to "primary" or "CTA".
> `OBSERVED(n=2, pages=[all 8])`. Do not build a hero-CTA tier on two data points; if you need visual emphasis, change
> the *variant* (fill/color), not the height. `PRESCRIPTIVE`.

**DO** — `<button class="h-9 px-3 gap-1.5 rounded-lg text-base">` for a normal action.
**DON'T** — reach for `h-10` "because it's important". Emphasis is a color job, not a height job. `PRESCRIPTIVE`.

### 1.3 Height ↔ type is a fixed pairing

| Pair | Uses | Rule |
| --- | --- | --- |
| `h-9 \| text-base` (14px) | 8 | Default control label. |
| `h-10 \| text-base` (14px) | 2 | Same label size; only the box grows. |
| `h-8 \| text-base` (14px) | 8 | Compact control, normal label. |
| `h-8 \| text-sm` (13px) | 8 | **The only** height that drops to 13px — densest toolbars/search rows. |

`OBSERVED(n=26, pages=[all 8])` — `usage.buttonHeightTypePairs`.

**DO** — use `text-base` (14px, `--text-base`) as the control label at every height; drop to `text-sm` (13px) **only**
at `h-8`. `OBSERVED`
**DON'T** — pair `text-sm` with `h-9`/`h-10`, or `text-xs` with any control height — neither pairing exists in the
capture. `OBSERVED(n=0)`

### 1.4 A square box is an ICON BUTTON, not a height

An icon-only control is `size-N p-0 justify-center` where **N is the control height** (`size-8` = 32px box for the
`h-8` rung, `size-9` = 36px for `h-9`). It is *not* a separate size scale.
`DERIVED(from=components/buttons.md — "size-N equals the control height"; facts.json usage.controlHeights)`

- `usage.squareBoxes = { "w-6 h-6": 2 }` and `usage.iconWidths = { "w-6": 2 }` — a **24px `w-6 h-6` box is an
  icon/avatar frame**, never a button height. `OBSERVED(n=2, pages=[all 8])`
- The icon *inside* the control is **16px** (`size-4`). The raw histogram is `16px ×42`, `12px ×196` of 476 SVG uses —
  `OBSERVED(n=42 @16px / 196 @12px, pages=[all 8])`, `icons.sizesByUse`. But that mine is a **flat histogram with no
  by-context cross-tab**, so *"inside the control"* cannot be read off it at all: the 12px bucket is caret / nav chrome —
  **176 of the 196** are a single glyph, the sidebar menu-item caret. `size-4` (16px) is the house default for a
  control-leading glyph. `DERIVED(from=components/buttons.md + foundations/iconography.md)`. See
  [`../iconography.md`](../iconography.md).

**DON'T** quote 24px as a button size.
**DO** use `size-4` (16px) for a leading icon inside an `h-8`/`h-9` control; reserve `size-3` (12px) for carets and
dense nav chrome. `DERIVED(from=components/buttons.md — in-button icon is size-4; foundations/iconography.md — "Default = 16px (size-4)")`

### 1.5 Rows are a different ladder

`h-11` (44px, n=7), `h-12` (48px, n=44) and `h-14` (56px, n=4) live **only** in `rawControlHeightClasses` — they are
list rows, header slots and layout blocks. `OBSERVED(n=55, pages=[all 8])`

The menu/sidebar row is `min-h-8.5` (**34px**) — deliberately **off** the 4px control grid.
`DERIVED(from=components/menus-dropdowns.md; foundations/spacing-layout.md §6.4)`

**DO** — keep two ladders: **controls 32/36/40**, **rows 34/44/48/56**.
**DON'T** — add 34px to the control ladder. [`../../components/menus-dropdowns.md`](../../components/menus-dropdowns.md)
correctly calls `min-h-8.5` "the default" *for menu items*; that sentence is about **rows**, and does not make 34px a
button size. `DERIVED(from=facts.json usage.controlHeights — 34px is absent)`

---

## 2. Padding — compact vs default pairs

Every padding value below is `calc(var(--spacing) * n)` with `--spacing: .25rem`.
`DERIVED(from=tokens/index.css)`

### 2.1 The pairs, by what you are padding

| Thing | Pair | px | Evidence |
| --- | --- | --- | --- |
| **Control (h-8 / h-9)** — default | **`px-3` + no `py`** (height owns the vertical) | 12 / — | `OBSERVED(n=890, pages=[all 8])` |
| **Control (h-10)** — the only step-up | `px-4` | 16 | `OBSERVED(n=34)` |
| **Badge / pill** — compact | **`px-1.5 py-0.5`** | 6 / 2 | `OBSERVED(n=136 / n=138)` |
| **Chip / xs control** | `px-2` + `py-1` | 8 / 4 | `OBSERVED(n=20 / n=8)` |
| **Menu item / list row** | `px-3 py-1.5` | 12 / 6 | Classes `OBSERVED(n=890 / n=14)`; the *pairing* is `DERIVED(from=components/menus-dropdowns.md)` |
| **Table cell / medium row** | `px-3 py-2` \| `py-2.5` | 12 / 8–10 | Classes `OBSERVED(n=24 / n=15)`; pairing `DERIVED(from=components/data-display.md)` |
| **Card** | **`p-4`** | 16 | `OBSERVED(n=18)` |
| **Dialog / section** | `px-6` + `pb-6` | 24 | `OBSERVED(n=8 / n=8)` |
| **Page column** | `px-6 md:px-8 lg:px-10` | 24 / 32 / 40 | `DERIVED(from=foundations/spacing-layout.md §5.4)` |

**The rule that falls out:** the *height* changes between `h-8` and `h-9`; **`px-3` does not**. Horizontal inset is
constant at 12px across both rungs and across buttons, inputs, menu items and table cells alike.
`OBSERVED(n=890, pages=[all 8])`

**DO** — change the rung (`h-8` → `h-9`) to change density; keep `px-3`.
**DON'T** — invent a `px-2` compact button. `px-2` (n=20) belongs to chips and the 26px `h-6.5` control, not to the
button ladder. `OBSERVED`

### 2.2 The 1px-border correction

When a control gains a **1px ring/border**, the source shifts `px-3` → **`px-[11px]`** (n=24) and `pl-3` → `pl-[11px]`
(n=18) so the *visual* inset stays 12px. `OBSERVED(n=42, pages=[all 8])` — these are optical corrections, not sloppiness.

**DO** — `px-[11px]` on a bordered `px-3` control. **DON'T** — "clean up" the arbitrary value; it is load-bearing.

### 2.3 Zero-padding resets are part of the system

`py-0` (n=813), `p-0` (n=253), `m-0` (n=216), `pr-0` (n=180), `mt-0` (n=48). `OBSERVED(n=1510, pages=[all 8])`
The source aggressively resets browser/legacy padding **before** applying its own — and `p-0` is also how icon-only
buttons drop their inset. Expect to do the same when dropping these recipes into an app with a global stylesheet.

---

## 3. Gaps — pick by what you are separating

| Gap | px | Uses | Use it for |
| --- | --- | --- | --- |
| **`gap-2`** | **8** | **1572** | **The default gap between anything adjacent.** If you don't know, it's 8px. |
| `gap-3` | 12 | 170 | Looser groupings — form rows, header clusters. |
| `gap-2.5` | 10 | 112 | Menu-item internals (icon → label → shortcut). |
| `gap-1.5` | 6 | 75 | **Icon ↔ label inside a control.** The in-button gap. |
| `gap-1` | 4 | 69 | Tightest pairing — chip internals, `h-6.5` controls. |
| `gap-4` | 16 | 43 | Grid gutter and section gap (`md:gap-4`). |

`OBSERVED(n=2041 gap utilities, pages=[all 8])` — `usage.spacing`.

`gap-2` outnumbers **every other gap combined** (1572 vs 469). This is the density signature of the product.

**DO** — `gap-1.5` inside a control, `gap-2` between controls, `gap-4` between sections/grid cells.
**DON'T** — import a 16/24px default rhythm from another system. `gap-2` + `px-3` alone account for **2,462** spacing
utilities; an airier rhythm will not read as Cloudflare. `DERIVED(from=facts.json usage.spacing)`

**One special gap:** the sidebar sub-menu indent is `pl-7` (**28px**, n=176) — a single-purpose value paired with a 1px
rail. `OBSERVED(n=176, pages=[all 8])`. Don't reuse 28px as a generic step; it belongs to
[`../../components/navigation.md`](../../components/navigation.md).

---

## 4. Page layout — the shell, the column, the breakpoints

### 4.1 The shell is most of the DOM — budget for it

`usage.shell` = **150 elements** present on ≥7 of the 8 pages, **5,963** raw occurrences collapsing to **750** deduped.
`OBSERVED(n=150 elements, thresholdPages=7, pages=[all 8])`. The per-page totals say the same thing: 760 raw `link`s
across the capture dedupe to 137; 417 raw `button`s dedupe to 88.
`OBSERVED(from usage.elementTotalsRaw vs usage.elementTotalsDeduped)`

**Read:** roughly **4–5 of every 5 interactive elements on a page are chrome** (sidebar + header), not page content.
Layout decisions must start with the shell. `DERIVED(from=facts.json usage.shell + usage.elementTotals*)`

### 4.2 Fixed shell dimensions

| Slot | Value | Provenance |
| --- | --- | --- |
| Header height | **58px** (`--header-height`) | `OBSERVED` — `--header-height` is in `facts.json tokens.names`; value from [`../../tokens/index.css`](../../tokens/index.css) |
| Sidebar width | **260px** (`--sidebar-nav-width`, `--sidebar-width: 16.25rem`) | `DERIVED(from=tokens/index.css + foundations/spacing-layout.md §5.1)` — ⚠️ **not** in `facts.json tokens.names`; the app writes it to `<html>` at runtime, so **always supply the fallback**: `var(--sidebar-nav-width, 260px)` |
| Full-height region | `calc(100vh - 58px - var(--preview-banner-height, 0px))` | `DERIVED(from=_classes.json / foundations §5.1)` |

**DO** — absorb optional chrome with a runtime var that defaults to `0px`, exactly as `--preview-banner-height` does.
**DON'T** — copy the stray `calc(100vh - 56px)`; the header is **58px**. (Already flagged in
[`../spacing-layout.md`](../spacing-layout.md) §5.1.)

### 4.3 The content column

```html
<div class="flex flex-col md:gap-4 xl:gap-6 @container
            px-6 md:px-8 lg:px-10
            max-w-350 mx-auto w-full">
```
`DERIVED(from=foundations/spacing-layout.md §5.4 — verbatim class list from home-overview.html)`

| Property | Base | `md` (768) | `lg` (1024) | `xl` (1280) |
| --- | --- | --- | --- | --- |
| Page gutter | 24px (`px-6`) | 32px (`md:px-8`) | 40px (`lg:px-10`) | — |
| Section gap | 0 | 16px (`md:gap-4`) | — | 24px (`xl:gap-6`) |
| Max width | **1400px** (`max-w-350` = 350 × 4px), centred | | | |
| Content grid | `grid auto-rows-min grid-cols-6 gap-4` — **6 columns, 16px gutter** | | | |

**DO** — express the cap as a **spacing multiple** (`max-w-350`), not `max-w-[1400px]`. Both spellings exist in the
source; the multiple is the intent. `DERIVED(from=foundations §5.3)`
**DON'T** — cap narrower content with an arbitrary width when a `--container-*` token fits: dialogs/empty-state copy use
`max-w-md` (448px), popovers `max-w-xs` (320px). All 13 `--container-*` tokens ship.
`OBSERVED(n=13, from tokens.groups.container)`

### 4.4 Viewport vs container — the one layout idiom to copy

| Responds to | Use for | Variants |
| --- | --- | --- |
| **Viewport** (`md:` `lg:` `xl:`) | Page chrome: gutters, section gaps | `md:px-8`, `lg:px-10`, `xl:gap-6` |
| **Container** (`@2xl:` `@4xl:` `@5xl:`) | Page *content*: cards, tables inside the column | `@5xl:pb-8` |

Because the 260px sidebar collapses, a card must lay out from **its column's** width, not the window's.
`DERIVED(from=foundations/spacing-layout.md §4.2)`

**Breakpoint budget** — `breakpoints` mine, `rulesGated`:

| Step | px | Rules gated | Read |
| --- | --- | --- | --- |
| `sm` | 640 | **720** | |
| `md` | 768 | **615** | The heaviest real layout step. |
| `lg` | 1024 | **435** | Second layout step. |
| `xl` | 1280 | 186 | Fine-tuning only (`xl:gap-6`). |
| `2xl` | 1536 | 27 | Token `--breakpoint-2xl` exists; **no page-layout utility in the captured markup uses it.** |

`OBSERVED(pages=[all 8])` — `breakpoints.breakpoints[]`. **DON'T** design a distinct `2xl` layout — the column is
already capped at 1400px, so there is nothing to do above it. `PRESCRIPTIVE` (n=0 layout utilities at 2xl).

---

## 5. Radius — one default, one exception

`usage.radius`, **1,179 radius utilities total**. `OBSERVED(pages=[all 8])`

| Class | Resolves to | Uses | Share | When |
| --- | --- | --- | --- | --- |
| **`rounded-lg`** | `var(--radius-lg)` = **8px** | **946** | **80.2%** | **THE DEFAULT.** Buttons, links-as-buttons, cards, inputs, menus, menu items, dialogs, sidebar rows, skeleton blocks. |
| `rounded-full` | pill / circle | 162 | 13.7% | **Pills, avatars, status dots, spinners.** Nothing else. |
| `rounded` | 4px (Tailwind v4 bare alias) | 43 | 3.6% | Legacy/third-party surface. Don't author it. |
| `rounded-md` | `var(--radius-md)` = 6px | 21 | 1.8% | Almost exclusively the extra-compact `h-6.5` (26px) chip control. |
| `rounded-none` | 0 | 4 | 0.3% | Only when a **wrapper owns the radius** and the field fills it (`h-full px-3 rounded-none`). |
| `rounded-sm` / `rounded-xl` | 4px / 12px | 2 / 1 | 0.2% | Strays. |

> **The rule, stated plainly: the default radius is `--radius-lg` = `0.5rem` = 8px.** Four out of five rounded corners
> in the entire capture are 8px. `OBSERVED(n=946 of 1,179, pages=[all 8])`
>
> Every control *recipe* in this system specifies `rounded-lg`.
> `DERIVED(from=components/buttons.md, forms.md, data-display.md — every control recipe specifies rounded-lg)`.
> Note the limit of the evidence: `usage.radius` is a **flat class histogram with no radius-by-element cross-tab**, so
> "every sized control is `rounded-lg`" is an inference from the recipes, **not** a count you can pull from the capture.

**DO** — `rounded-lg` on anything rectangular; `rounded-full` on anything that is a pill or a circle (badges:
`usage.elementTotalsDeduped.badge = 17`).
**DON'T** — use `--radius-2xl` (16px) or `--radius-3xl` (24px). They ship as tokens (`tokens.groups.radius = 7`) but
have **zero uses** in the capture. `OBSERVED(n=0)`
**DON'T** — reproduce the legacy `border-radius: 3px` / `2px` from the old tooltip/skeleton CSS.
`DERIVED(from=_classes.json)`

The shadcn bridge already points the single `--radius` knob at the house value:
`--radius: var(--radius-lg)` (`tokens/index.css`). If you ran `npx shadcn init`, **delete** its four
`--radius-sm: calc(var(--radius) - 4px)` lines — they shadow the real ramp. `DERIVED(from=tokens/index.css)`

---

## 6. Reconciliation — where the existing docs mislabel the default

These are **flags against sibling docs in this design system**, resolved against `facts.json`. Trust the table below.

| # | Where | What it says | What `facts.json` says | Verdict |
| --- | --- | --- | --- | --- |
| **1** | `tokens/spacing.css` | — | **The file does not exist.** The spacing/radius primitives live at `:root` in [`../../tokens/index.css`](../../tokens/index.css) (lines 73–88), which says so explicitly: *"there is no ./spacing.css …"* (`classification.json` verdict: *utility-compiled*). | ✅ Not a defect — but **cite `tokens/index.css`, never `tokens/spacing.css`.** |
| **2** | `components/buttons.css` (size block) | `h-8` *"is nonetheless the single most common control height in the capture (…h-8 = 16, h-9 = 26…)"* | `controlHeights: h-9 = 32 > h-8 = 24`; on `<button>` alone `h-9 = 26 > h-8 = 16` | 🚩 **MISLABEL.** The sentence contradicts the numbers it quotes. **`h-9` is the most common control height.** `h-8` is the most common *consumer-appended* height, which is a different (and much narrower) claim. |
| **3** | `components/buttons.md` (size table) | `h-8` = *"the most-used button height in the capture … 24 of 57 component instances"* | Same as above; and the denominator is **58** (24 + 32 + 2), not 57 — with `h-9` taking **32** of it | 🚩 **MISLABEL** (same root cause). Promoting `.ds-btn--sm` to a first-class recipe is **correct**; calling it the most-used height is **not**. |
| **4** | `components/forms.css` / `forms.md` | *"h-9 (36px) is the default and by far the most used"*; `md: "h-9", // default — the only size the target renders` | `controlHeightsByTag` contains **only `button` and `a`** — **no `<input>` carries a height class at all**. The one sized input is `h-full px-3 rounded-none` (it fills a wrapper). | ⚠️ **OVER-CLAIM.** Direction is right (`h-9` *is* the most-used control height, 32 vs 24 — though "by far" overstates a 1.33× lead). But **field heights are `PRESCRIPTIVE`, derived by parity with buttons — not observed.** |
| **5** | `foundations/spacing-layout.md` §2.1 | `h-10` = *"Large. Rare; primary CTA / form submit."* | `h-10` n=**2**, and `usage.variantClasses` / `usage.statusIntent` are **empty objects** — **no intent data exists** | ⚠️ **OVER-CLAIM.** "Rare" is right (n=2). "Primary CTA" is `PRESCRIPTIVE` and should be labelled as such. Do not build a hero tier on it. |
| **6** | `components/menus-dropdowns.css` | `min-h-8.5` (34px) is *"the DEFAULT"* | 34px is **absent** from `usage.controlHeights` | ✅ Correct **in scope** (it is the default *menu-row* height) — but it is a **row**, not a control. Keep the ladders separate (§1.5). |

**The single sentence to remember:** **`h-9` (36px) is the default control height; `h-8` (32px) is the compact rung;
`h-10` (40px) is a two-instance outlier.** `OBSERVED(n=32 / 24 / 2, pages=[all 8])`

---

## 7. DO / DON'T — master list

**DO**
- Generate every space from `--spacing` (`calc(var(--spacing) * n)`, 4px base); half-steps (`.5`) are legal and heavily
  used — an effective 2px sub-grid. `OBSERVED`
- Default to **`h-9` + `px-3` + `gap-1.5` + `rounded-lg` + `text-base`** for a control. That five-class cluster *is* the
  system. Height↔type is `OBSERVED(n=8, pages=[all 8])` (`buttonHeightTypePairs: "h-9 | text-base"`); the full cluster is
  `DERIVED(from=foundations/spacing-layout.md §2.4 — joined from the captured DOM, n=8 on <button> + n=6 on <a>)`
- Default to **`gap-2` (8px)** between adjacent things and **`px-3` (12px)** inside controls. `OBSERVED`
- Drop to `h-8` for density — and to `h-8 | text-sm` only in the densest toolbars. `OBSERVED`
- Make icon-only buttons `size-N p-0` where N = the control height, and give them an `aria-label`.
  `DERIVED(from=components/buttons.md)` + `PRESCRIPTIVE` (label requirement)
- Cap page content at **1400px** (`max-w-350 mx-auto w-full`) with `px-6 md:px-8 lg:px-10` gutters. `DERIVED`
- Let page **content** respond to `@container`, page **chrome** to `md:`/`lg:`/`xl:`. `DERIVED`
- Round everything `rounded-lg` (8px); `rounded-full` only for pills/avatars/dots. `OBSERVED`

**DON'T**
- Don't read button heights out of `rawControlHeightClasses` — `h-12` (n=44) is a **row**, not a 48px button.
  `OBSERVED`
- Don't treat a square `w-6 h-6` / `size-N` box as a height rung — it's an icon frame / icon button. `OBSERVED(n=2)`
- Don't invent a hero/primary-CTA size. `h-10` has **2** uses and the capture carries **no variant/intent data at all**
  (`variantClasses: {}`). `OBSERVED`
- Don't pair `text-sm` with `h-9`/`h-10`, or use `text-xs` in any control. `OBSERVED(n=0)`
- Don't shrink the control inset below `px-3` to compact a button — change the rung instead. `PRESCRIPTIVE`
- Don't "fix" `px-[11px]`, `pl-[11px]` or `pt-[0.5px]` — they are 1px-border and optical corrections.
  `OBSERVED(n=50)`
- Don't reach for `--radius-2xl` / `--radius-3xl` (**0 uses**) or design a `2xl` (1536px) layout (**0 layout
  utilities**). `OBSERVED(n=0)`
- Don't assume `--sidebar-nav-width` resolves — it is runtime-written and is **not** in `facts.json`'s token list. Use
  `var(--sidebar-nav-width, 260px)`. `DERIVED`
- Don't design `textarea`, `select`, `radio` or `switch` sizing from this system as if it were observed —
  `usage.notObserved = ["textarea", "select", "radio", "switch"]`. **Not observed in the captures.** Anything you build
  there is `PRESCRIPTIVE`; size it to the `h-8`/`h-9` ladder with `px-3` for parity. `OBSERVED(n=0)`

---

## See also

- [`../spacing-layout.md`](../spacing-layout.md) — the values: full scale, containers, z-index, breakpoint tables.
- [`../iconography.md`](../iconography.md) — why the in-control icon is 16px and the 12px bucket is the sidebar caret.
- [`../typography.md`](../typography.md) — the 13px/14px type scale these heights pair with.
- [`../../components/buttons.md`](../../components/buttons.md) · [`../../components/forms.md`](../../components/forms.md) ·
  [`../../components/menus-dropdowns.md`](../../components/menus-dropdowns.md) ·
  [`../../components/navigation.md`](../../components/navigation.md) — the recipes these rules size.
- [`../../tokens/index.css`](../../tokens/index.css) — `--spacing`, `--radius-*`, `--container-*`, `--header-height`.
- [`../usage-guidelines.md`](../usage-guidelines.md) — hub; links to the sibling usage docs.
