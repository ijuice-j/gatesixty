# Page Patterns — how a page is composed

> **Decision layer.** `foundations/spacing-layout.md` gives you the numbers, `components/navigation.md` gives you the
> shell parts, `components/data-display.md` gives you the card and table. **This doc tells you which page shape to reach
> for, what goes in the page header, when to wrap something in a card, and which archetype a screen belongs to.**
>
> Hub: [`../usage-guidelines.md`](../usage-guidelines.md) · Foundations: [`../spacing-layout.md`](../spacing-layout.md),
> [`../typography.md`](../typography.md), [`../colors.md`](../colors.md), [`../iconography.md`](../iconography.md),
> [`../elevation-motion.md`](../elevation-motion.md)

Every rule below is tagged **OBSERVED** (backed by `facts.json` / the captured pages), **DERIVED** (logically follows
from `tokens.json` / `_classes.json` / the captured DOM), or **PRESCRIPTIVE** (best practice, *not* evidenced —
said so out loud).

The eight captured pages, by name (`facts.json → usage.pages`):
`analytics` · `api-tokens` · `audit-log` · `billing` · `home-overview` · `members` · `notifications` · `workers-and-pages`.

---

## 0. The first thing to internalise: most of a page is not yours

| Signal (`facts.json → usage.shell`) | Value |
| --- | --- |
| Elements present on ≥ 7 of 8 pages (the shell) | **150** |
| Raw occurrences of those elements | **5,963** |
| De-duplicated occurrences | **750** |

**OBSERVED(n=8, pages=[all])** — the shell alone is a 150-element structure. Per-page element totals
(`facts.json → usage.perPage`) run **47–59 buttons** and **89–101 links** *per page*, but the de-duplicated totals across
**all eight pages** are only **88 buttons / 137 links** (`usage.elementTotalsDeduped`). Roughly **8 of every 10 controls on a
Cloudflare page belong to the chrome, not the page.**

Two consequences you must design around:

* **DO** budget the page body as a *small* thing: an overview page adds ~4 cards; a list page adds a toolbar + one table.
  **DON'T** read raw frequencies as "this is what a page contains".
* **DO** distrust the raw type-class ranking. `text-sm` is the #1 type class at **914** uses — but **632** of those are
  `a > text-sm` and **190** are `button > text-sm` (`usage.typeClassByTag`), i.e. **~90 % of `text-sm` is sidebar links and
  buttons**. **Page body copy is `text-base`, not `text-sm`** (see §4). **DERIVED(from=facts.json → usage.typeClassByTag)**

---

## 1. The app shell — what is fixed

**OBSERVED(n=8, pages=[all])** — every captured page, including the two legacy ones, renders the same three-part shell:

```
<html>                       --sidebar-nav-width: 260px   (live, JS-written)
└── shell (CSS grid: var(--sidebar-nav-width) 1fr)
    ├── aside[data-sidebar="sidebar"][data-collapsible="icon"]     width: var(--sidebar-width)  = 16.25rem / 260px
    │                                                              collapsed: --sidebar-width-icon = 57px
    └── column (flex, min-w-0)
        ├── header  h-(--header-height) · bg-kumo-canvas · border-b border-kumo-line · sticky · z-20
        │           ├── breadcrumb slot (hidden below sm)
        │           └── 3 × h-8 ghost controls (Ask AI · Support · user menu)
        └── main    w-full h-full grow bg-kumo-canvas
            └── page content
```

| Fixed value | Where it comes from | Tag |
| --- | --- | --- |
| `--header-height: 58px` | `tokens.json` (`tokens.groups.header = 1`) | OBSERVED |
| `--sidebar-width: 16.25rem` (260px) | inline on the sidebar wrapper, all 8 pages | OBSERVED(n=8, pages=[all]) |
| `--sidebar-width-icon: 57px` | inline on the sidebar wrapper, all 8 pages | OBSERVED(n=8, pages=[all]) |
| Shell chrome = `bg-kumo-canvas` + `border-kumo-line` hairlines | header/sidebar/main all carry the same bg class | OBSERVED(n=8, pages=[all]) |
| Header actions are `h-8` ghost controls — **3 in the header** (Ask AI · Support · user menu) | `usage.controlHeightsByTag`: h-8 = 16 `<button>` + 8 `<a>` (24 total, aggregated across all 8 pages; `facts.json` gives **no per-page height attribution** — the 24 is *not* "3 × 8"). The count of 3 in the header is read off the DOM. | DERIVED(from=capture/*.html) |
| Breadcrumb lives **in the shell header**, before `<main>` | crumb `<nav aria-label="breadcrumb">` precedes `<main>` on all 6 kumo pages | OBSERVED(n=6, pages=[api-tokens, audit-log, billing, home-overview, members, workers-and-pages]) |

**Rules**

* **DO** treat header + sidebar + main as **one surface** (`--color-kumo-canvas`). Contrast comes from cards sitting *on*
  the canvas, never from a darker nav panel. **OBSERVED(n=8, pages=[all])**
* **DO** put the page's location string in the **shell breadcrumb**; the page header carries the *title*, not the path.
  **OBSERVED(n=6, pages=[api-tokens, audit-log, billing, home-overview, members, workers-and-pages])**
* **DON'T** render a second breadcrumb inside `<main>`. `home-overview` is the only page that does
  (`aria-label="breadcrumb"` ×2 — one before `<main>`, one inside it); it is a duplication, not a pattern.
  **OBSERVED(n=1, pages=[home-overview])**
* **DON'T** put a hamburger in the header — none of the captures has one (all captures are desktop-width). If you need a
  mobile shell, design it; do not claim this one. **PRESCRIPTIVE — not observed in the captures.**

Full shell anatomy, z-ladder and collapse behaviour: [`../../components/navigation.md`](../../components/navigation.md) §1–§4.
Shell dimensions and the `100vh − 58px` calc family: [`../spacing-layout.md`](../spacing-layout.md) §5.1.

---

## 2. The content column — one width, one gutter set

**OBSERVED(n=4, pages=[api-tokens, audit-log, billing, home-overview])** — the content column is
`max-w-350 mx-auto w-full` (`max-w-350` = 350 × `--spacing` (`.25rem`) = **1400px**), corroborated by a hard-coded
`max-w-[1400px]` on `home-overview` and by the 87.5rem/1400px container breakpoint in
`facts.json → breakpoints.containerBreakpoints`.

```html
<!-- the page body track, verbatim class set from home-overview -->
<div class="flex flex-col md:gap-4 xl:gap-6 @container
            px-6 md:px-8 lg:px-10
            max-w-350 mx-auto w-full">
```

| Decision | Answer | Tag |
| --- | --- | --- |
| Page max width | **1400px, centred** (`max-w-350`) | OBSERVED(n=4, pages=[api-tokens, audit-log, billing, home-overview]) |
| Page gutter | `px-6` (24) → `md:px-8` (32) → `lg:px-10` (40) | OBSERVED(n=4, same pages) |
| Gap between page sections | `md:gap-4` (16) → `xl:gap-6` (24) | OBSERVED(n=2, pages=[home-overview, workers-and-pages]) |
| Do children query the viewport or the column? | **The column.** The track is an `@container`. | OBSERVED(n=2, pages=[billing, home-overview]) |

* **DO** write `max-w-350`, not `max-w-[1400px]` — the system expresses the page width as a **spacing multiple**.
  Both spellings ship; prefer the token-derived one. **DERIVED(from=tokens.json `--spacing`)**
* **DO** reach for **container queries, not media queries**, for anything inside the column: the responsive rail on
  `billing` is `@5xl:w-[380px] @5xl:sticky`, the 2-up card grid on `workers-and-pages` is `@5xl:grid-cols-2`.
  **OBSERVED(n=2, pages=[billing, workers-and-pages])**
* **DON'T** invent a second content width. Across all 8 pages the only other `max-w-*` values on body containers are
  `max-w-md` (empty-state copy) and `max-w-xs` (list search field) — both **component** widths, not page widths.
  **OBSERVED(n=8, pages=[all]; `usage` spacing/`max-w` census in the captured DOM)**

---

## 3. The page header — pick one of three

All three start from the same title row and diverge on *where the page identity lives*.

### 3a. Titled page header — the default

**OBSERVED(n=3, pages=[api-tokens, audit-log, workers-and-pages])** — corroborated by
`facts.json → usage.typeClassByTag`: `h1 > text-3xl = 3` and `p > text-base = 3`. Exactly three pages, exactly three titles,
exactly three descriptions.

```html
<header class="flex flex-col @container p-6 md:p-8 md:gap-4 lg:px-10 lg:py-10 xl:gap-6 max-w-350 mx-auto w-full">
  <div class="flex gap-4 flex-col sm:flex-row sm:justify-between sm:items-start">   <!-- title row -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-1.5 grow">
        <span class="shrink-0 flex items-center"><svg width="28" height="28" …></span>   <!-- optional -->
        <h1 class="text-kumo-default text-3xl font-semibold">…</h1>
      </div>
      <p class="text-kumo-subtle text-base">…</p>                                   <!-- optional description -->
    </div>
    <div class="flex items-center gap-2 shrink-0">…actions…</div>                    <!-- optional -->
  </div>
</header>
```

| Slot | Rule | Tag |
| --- | --- | --- |
| Title | `h1` + `text-3xl` + `font-semibold` + `text-kumo-default`. On `home-overview` it is responsive: `text-xl md:text-3xl` (`h1 > text-xl = 1`). | OBSERVED(n=3 + 1, pages=[api-tokens, audit-log, workers-and-pages] + [home-overview]) |
| Title icon | **28px**, `fill`, sits in a `shrink-0` span, `gap-1.5` from the title. Optional — used on 2 of the 4 titled pages. | OBSERVED(n=2, pages=[api-tokens, audit-log]; `facts.json → icons.sizesByUse: "28": 2`) |
| Description | `p` + `text-base` + `text-kumo-subtle`. **One line. `text-base`, not `text-sm`.** | OBSERVED(n=3, pages=[api-tokens, audit-log, workers-and-pages]) |
| Actions | `flex items-center gap-2 shrink-0`, **`h-9` buttons**, primary = the `--kumo-button-emphasis-*` variant. | OBSERVED(n=3, pages=[api-tokens, audit-log, members]) |
| Collapse | Title row is `flex-col` below `sm`, `sm:flex-row sm:justify-between sm:items-start` above. Actions drop **under** the title on narrow. | OBSERVED(n=3, same pages) |

> ⚠️ **No hero CTA exists in this system.** The page-header primary action is **`h-9` — the same height as every other
> primary control** (`facts.json → usage.controlHeights: h-8 = 24, h-9 = 32, h-10 = 2`). `h-10` has **two** uses in the entire
> capture; it is not a size tier. And `h-11` / `h-12` / `h-14` in `usage.rawControlHeightClasses` are **row heights** (the
> `members` table header row is `h-11` = 44px; the sidebar footer is `h-12`), not control heights. **Never scale a CTA up
> to "look important" — importance is carried by the emphasis *variant*, not by height.**
> **OBSERVED(n=8, pages=[all]; facts.json → usage.controlHeights + usage.rawControlHeightClasses)**

### 3b. Tabbed sticky sub-header — when the page *is* a set of tabs

**OBSERVED(n=2, pages=[billing, members])** — these two pages have **no `<h1>` at all**. Their identity is the breadcrumb
+ the tab set; a second 58px bar sits under the app header and holds the tabs:

```html
<header class="flex items-center justify-between h-(--header-height) gap-3 px-4
               border-b border-kumo-line sticky z-20 bg-surface-secondary"
        style="top: var(--preview-banner-height, 0px);">
  <!-- Tabs (segmented, h-9 indicator) … right-aligned page action -->
</header>
```

* Two stacked 58px bars = **116px** of chrome — which is exactly why `h-[calc(100vh-116px-var(--preview-banner-height,0px))]`
  exists in the utility set. **DERIVED(from=_classes.json + tokens.json `--header-height`)**
* **USE WHEN** the route has 2–4 sibling views that share one title (`billing` = 3 tabs, `members` = 3 tabs).
  **OBSERVED(n=2, pages=[billing, members]; `facts.json → usage.elementTotalsDeduped.tab = 10`)**
* **DON'T** use it for one-off in-page grouping. `audit-log` keeps its `h1` page header and puts its 4 tabs **in the body**
  — that is the pattern when tabs switch a *panel*, not the *page*. **OBSERVED(n=1, pages=[audit-log])**
* **DON'T** ship both an `h1` and a tabbed sub-header. No captured page does.
  **OBSERVED(n=8, pages=[all])**

Tab mechanics (indicator, sizes, states): [`../../components/tabs-segmented.md`](../../components/tabs-segmented.md).

### 3c. Track-gutter header — when the body owns the padding

**OBSERVED(n=1, pages=[workers-and-pages])** — same title row, but the `<header>` carries **bottom padding only**
(`flex flex-col pb-6 md:pb-8 lg:pb-9 md:gap-2 xl:gap-4`) because the page body is a grid track whose gutter comes from
`--page-body-track-gutter` (16px → 32px at `md`).

* **USE WHEN** the page body is a grid track with its own gutter variable. Otherwise use §3a. Do not mix: a header with
  `p-6` inside a track that already pads will double the inset. **DERIVED(from=the captured DOM)**

### Page-header decision table

| Situation | Header | Evidence page |
| --- | --- | --- |
| Standard content page | **3a titled** (`h1.text-3xl` + `p.text-base` + `h-9` actions) | `api-tokens`, `audit-log` |
| Page = 2–4 sibling views | **3b tabbed sticky sub-header**, no `h1` | `billing`, `members` |
| Body is a padded grid track | **3c track-gutter header** | `workers-and-pages` |
| Dashboard / account root | 3a with a responsive title (`text-xl md:text-3xl`) | `home-overview` |

---

## 4. Headings, inside the page

Counts are **OBSERVED(pages=[all 8]; `facts.json → usage.typeClassByTag`)** — but note that `typeClassByTag` is an
**aggregate over all eight pages with no per-page breakdown** (the only page-resolvable mines in the bundle are
`usage.perPage` and `usage.shell`). So the *counts* are OBSERVED; every **"which page"** in the last column is
**DERIVED(from=capture/&lt;page&gt;.html)** — read off the captured DOM, not off `facts.json`.

| Level | Class | Uses (all 8 pages) | Role — and where it lands (DERIVED) |
| --- | --- | --- | --- |
| `h1` | `text-3xl` (`font-semibold`, `text-kumo-default`) | 3 | **Page title.** One per page, max. |
| `h1` | `text-xl` | 1 | Same slot, small-viewport variant (`text-xl md:text-3xl`) |
| `h2` | `text-2xl` | 1 | Major in-page section — `workers-and-pages`. **DERIVED(from=capture/workers-and-pages.html)** |
| `h2` | `text-base` (`font-semibold`, `truncate`) | 1 | **Card / panel header** — `audit-log`. **DERIVED(from=capture/audit-log.html)** |
| `h3` | `text-lg` (`font-semibold`) | 3 | **Card & empty-state title** — all 3 on `home-overview`. **DERIVED(from=capture/home-overview.html)** |
| `p` | `text-base` (`text-kumo-subtle`) | 3 | Page description |
| `p` | `text-sm` (`text-kumo-subtle`) | 4 | **Empty-state body copy** — 3 are the `home-overview` widget empty states, 1 is on `billing`. **DERIVED(from=capture/home-overview.html, capture/billing.html)** |

* **DO** step down `h1.text-3xl → h2 → h3.text-lg`. **DON'T** skip to a card title of `text-2xl`: only one `text-2xl`
  heading exists in 8 pages. **OBSERVED(n=8, pages=[all])**
* **DO** use `text-base` for prose the user reads (page description, empty-state lede on `api-tokens`/`billing`) and
  `text-sm` for *dense* copy inside a widget. **OBSERVED(n=6, pages=[api-tokens, audit-log, billing, home-overview, members, workers-and-pages])**
* Type scale, weights and line-heights: [`../typography.md`](../typography.md).

---

## 5. Sections & cards — when to draw a box

The body is grouped with **divs + card classes**, not `<section>`. `<section>` appears only inside the third-party cookie
banner in every capture — the system does **not** use it. **OBSERVED(n=8, pages=[all])**

### The five observed surfaces

| # | Recipe (verbatim class set) | Uses | Use it for |
| --- | --- | --- | --- |
| 1 | `overflow-hidden rounded-lg bg-kumo-base shadow-xs ring ring-kumo-line @container w-full h-full flex flex-col` | 4 | **The standard content card.** Equal-height, and it is its own `@container`. |
| 2 | `overflow-hidden shadow-xs ring ring-kumo-line bg-kumo-base rounded-lg p-4 relative` | 4 | **Padded card**, 16px inset, no internal scroll region. |
| 3 | `relative flex flex-col gap-2 overflow-hidden rounded-lg bg-kumo-base text-inherit no-underline ring ring-kumo-fill flex-1 p-0` | 4 | **Clickable card** — it is an `<a>`: `no-underline`, `p-0` (padding lives on the inner row), and a *softer* `ring-kumo-fill`. |
| 4 | `shadow-xs ring ring-kumo-line bg-kumo-canvas rounded-lg px-4 py-1 divide-y divide-border overflow-hidden` | 2 | **List card** — rows separated by `divide-y`, `py-1` so rows own their height, and it sits on `bg-kumo-canvas`. |
| 5 | `bg-kumo-base border border-kumo-line rounded-lg p-6` / `flex flex-col gap-3 rounded-lg border border-kumo-line bg-kumo-base p-4` | 1 + 1 | **Settings panel** — 24px inset for form-ish content, 16px for compact. |

**OBSERVED** — #1 & #3: `home-overview`; #2 & #4: `workers-and-pages`; #5: `billing`.

### Rules

* **DO** default to `rounded-lg`. It is the radius of the system: **946** uses vs `rounded-full` 162 (pills/avatars only),
  `rounded-md` 21, `rounded-xl` 1. **OBSERVED(n=8, pages=[all]; `facts.json → usage.radius`)**
* **DO** delimit cards with a **`ring` + `shadow-xs`**, not a heavy border. Every observed card uses `ring ring-kumo-line`
  or `ring ring-kumo-fill`; `border` appears only on the settings panel and the audit grid.
  **OBSERVED(n=3, pages=[billing, home-overview, workers-and-pages])**
* **DO** card a group when it (a) is clickable as a whole, (b) contains a list/table, or (c) is one of several peers in a
  grid. **DON'T** card a lone block of prose or a single form field — nothing in the captures does.
  **DERIVED(from=the five recipes above)**
* **DO** make a clickable card an `<a>` with `no-underline` and `p-0`, and soften its ring to `ring-kumo-fill`. **DON'T**
  wrap a card in a `<button>` or nest a link inside a link. **OBSERVED(n=1, pages=[home-overview])**
* **DON'T** stack a card inside a card. No capture nests card surfaces.
  **OBSERVED(n=8, pages=[all])**
* Padding ladder: **`p-4` (16px) for cards, `p-6` (24px) for settings panels, `p-16` (64px) for a full zero-state.**
  **OBSERVED(n=3, pages=[api-tokens, billing, workers-and-pages])**

Card variants/states, table anatomy and the surface ladder: [`../../components/data-display.md`](../../components/data-display.md).
Which grey is `base` vs `canvas` vs `recessed`: [`../colors.md`](../colors.md).

---

## 6. The four page archetypes

### 6a. Overview — `home-overview`

**Use when** the route is a landing/root that summarises several products and routes the user onward.

```
shell header (crumb + 3 ghost actions)
└── page-header container   max-w-[1400px] px-6 md:px-8 lg:px-10 @container
│   └── h1 text-xl md:text-3xl
└── body track              flex flex-col md:gap-4 xl:gap-6 @container max-w-350 mx-auto
    └── grid auto-rows-min grid-cols-6 gap-4
        ├── content cards  (recipe #1, ×4 — each an @container)
        └── clickable cards (recipe #3, ×4 — <a>, ring-kumo-fill)
            └── widget empty states (×3 — see §6d)
```

**OBSERVED(n=1, pages=[home-overview])** — the only page with `grid-cols-6`, the only page with clickable cards, and the
only page carrying the three widget empty states. On the type-class side, `facts.json → usage.typeClassByTag` gives only
the **aggregate** across all 8 pages (`h3 > text-lg` = 3, `p > text-sm` = **4**) and **no per-page attribution**; the
captured DOM is what puts all 3 `h3 > text-lg` and 3 of the 4 `p > text-sm` on this page (the 4th `p > text-sm` is on
`billing`). **DERIVED(from=capture/home-overview.html, capture/billing.html)**

* **DO** give overview cards `h-full` and let the 6-col grid do the layout; make each card an `@container` so its own
  contents reflow without knowing the viewport. **OBSERVED(n=1, pages=[home-overview])**
* **DON'T** put a table on an overview page. Neither of the two `<table>` elements in the capture set is here.
  **OBSERVED(n=8, pages=[all]; `facts.json → usage.elementTotalsDeduped.table = 2`)**

### 6b. List — `members`, `audit-log`, `api-tokens`, `workers-and-pages`

**Use when** the route's job is "find/scan/act on one of N things".

```
page header (§3a titled, or §3b tabbed for members)
└── toolbar row      search input (h-9, w-full max-w-xs) + filter/menu buttons (h-8/h-9)
└── data surface     ONE of:
    ├── <table> in a ring card   ring rounded-lg mt-4 › overflow-x-auto › thead th h-11 text-sm font-medium
    ├── div grid                 rounded-lg border bg-kumo-base › overflow-x-auto › header row px-4 bg-bg-secondary border-b
    └── list card                recipe #4 (divide-y rows)
└── empty state when N = 0 (§6d)
```

| Signal | Value | Tag |
| --- | --- | --- |
| Real `<table>` elements in the whole capture set | **2** (`members`, `analytics`) | OBSERVED(n=8, pages=[all]; `usage.elementTotalsDeduped.table`) |
| `audit-log`'s grid is **divs**, not a table | `role="table"` = 0 on all kumo pages | OBSERVED(n=6, pages=[api-tokens, audit-log, billing, home-overview, members, workers-and-pages]) |
| Table header row | `h-11` (44px), `text-sm font-medium text-neutral-500`, sortable cells are bare `<button>`s | OBSERVED(n=1, pages=[members]; `usage.typeClassByTag: th > text-sm = 7`) |
| List search field | `h-9`, `w-full max-w-xs` (320px) | OBSERVED(n=2, pages=[api-tokens, members]) |
| Everything horizontally scrollable is wrapped | `overflow-x-auto` | OBSERVED(n=4, pages=[api-tokens, audit-log, billing, members]) |

* **DO** use a real `<table>` when the data is tabular and sortable (`members`). **DO** fall back to a div grid only when
  you need virtualisation/resizable columns (`audit-log`) — and then **add `role="table"`/`role="row"`, which the source
  omits.** **PRESCRIPTIVE** (the div grid ships with zero ARIA grid roles — `facts.json` shows no `role="grid"` anywhere).
* **DO** put the list's *primary* action (Create…) in the **page header** action cluster, not above the table.
  **OBSERVED(n=2, pages=[api-tokens, audit-log])**
* **DON'T** size the table header row from the control scale — `h-11` is a **row** height, not a control height. See the
  warning in §3a. **OBSERVED(n=1, pages=[members])**

### 6c. Detail / settings — `billing`

**Use when** the route shows one entity's configuration.

```
tabbed sticky sub-header (§3b, 58px)
└── two-column, container-query driven:
    ├── main column   settings panels: bg-kumo-base border border-kumo-line rounded-lg p-6
    └── rail          @5xl:w-[380px] w-full @5xl:sticky top-22 h-fit flex flex-col gap-4 shrink-0
```

**OBSERVED(n=1, pages=[billing])** — the only two-column body in the capture set; the rail is `380px` and becomes sticky
(88px offset) only at the `@5xl` **container** size, stacking underneath below that.

* **DO** use the sticky rail for a *summary* the user needs while scrolling the panels. **DO** gate it on a container
  query (`@5xl`), not a media query. **OBSERVED(n=1, pages=[billing])**
* **DO** give settings panels `p-6` (24px) — denser cards look cramped once labelled fields go in.
  **OBSERVED(n=1, pages=[billing])**

> ### ⚠️ The settings **form** is not in the captures
> **`facts.json → usage.notObserved = [textarea, select, radio, switch]`**, and there is **not a single `<form>` element on
> any of the 8 pages**. The 71 raw `<input>`s are search/filter fields and third-party cookie checkboxes. So:
> **every rule about form layout, field stacking, label placement, inline validation, and a save/cancel footer is
> PRESCRIPTIVE — not observed in the captures.** Build them from [`../../components/forms.md`](../../components/forms.md)
> and say so; do not present them as "how Cloudflare does it".
>
> The one thing you *can* carry over: **PRESCRIPTIVE** — reuse the `billing` settings panel (`p-6`, `border-kumo-line`,
> `rounded-lg`) as the form section wrapper, one concern per panel, and put the primary `h-9` action in the panel footer
> or the page header — never at a size the system doesn't have.

### 6d. Empty state — two different things

**Flavour 1 — widget empty state** (inside a card, in a grid of cards).
**OBSERVED(n=3, pages=[home-overview])**

```html
<div class="w-full h-full flex items-center justify-center p-4">
  <div class="w-full max-w-md flex flex-col items-center text-center gap-1">
    <div class="… size-8 mb-3 p-2"><svg width="24" class="text-kumo-subtle"></div>
    <div class="flex-1 mb-3">
      <h3 class="text-kumo-default text-lg font-semibold">…</h3>
      <p  class="text-kumo-subtle text-sm">…</p>
    </div>
    <a data-kumo-component="LinkButton" class="… h-9 …">…</a>
  </div>
</div>
```

**Flavour 2 — zero-state** (the page's whole data surface is empty).
**OBSERVED(n=2, pages=[api-tokens, billing])**

```html
<div class="… rounded-lg ring ring-kumo-line bg-kumo-base …">   <!-- the table/list card, still drawn -->
  <div class="p-16 flex flex-col items-center gap-4">
    <h2>…</h2>
    <div class="text-muted text-center text-base"><div class="max-w-md">…</div></div>
    <div class="flex justify-center gap-4"> …LinkButton(s)… </div>
  </div>
</div>
```

| Decision | Flavour 1 (widget) | Flavour 2 (zero-state) |
| --- | --- | --- |
| Where | Inside one card of many | Inside the page's single data card |
| Inset | `p-4` | **`p-16`** (64px) |
| Copy width | `max-w-md` (448px) | `max-w-md` (448px) |
| Title | `h3` `text-lg` | `h2` |
| Body | `text-sm` `text-kumo-subtle` | **`text-base`** `text-muted` |
| Icon | 24px, `text-kumo-subtle` | none observed |
| Action | one `h-9` LinkButton | `flex justify-center gap-4` — up to two |

* **DO** keep the card/table chrome drawn around a zero-state (`api-tokens` keeps the ring + rounded card). **DON'T**
  replace the whole page with a centred illustration — no capture does. **OBSERVED(n=2, pages=[api-tokens, billing])**
* **DO** centre on `max-w-md` (448px) in both flavours — that is the only copy-measure the system uses.
  **OBSERVED(n=3, pages=[api-tokens, billing, home-overview])**
* **DON'T** use an emphasis/primary button for a *widget* empty state. The observed one is a LinkButton at `h-9`.
  **OBSERVED(n=3, pages=[home-overview])**
* **Error and loading page states**: skeletons exist (`animate-pulse` blocks, keyframes `skeleton`/`shimmer` in
  `facts.json → motion.keyframeNames`), but **no full-page error / 404 / permission-denied archetype was captured**.
  **PRESCRIPTIVE — not observed in the captures.** Build it from flavour 2 (same `p-16` block) rather than inventing a
  new layout.

---

## 7. Two shell generations — do not copy the wrong one

**OBSERVED(n=8, pages=[all])** — the 8 pages split into two families:

| Family | Pages | Body markup |
| --- | --- | --- |
| **Kumo (current)** | `api-tokens`, `audit-log`, `billing`, `home-overview`, `members`, `workers-and-pages` | Readable utility classes (`bg-kumo-base`, `max-w-350`, `rounded-lg`), `data-kumo-component="…"` |
| **Legacy** | `analytics`, `notifications` | Compiled/hashed classes (`c_av c_aw …`), `@cloudflare/component-page` headings, `<a id="skipTarget">` |

Both families render **the same shell** (`--header-height`, the sidebar `<aside>`, the kumo header). Only the **body**
differs.

* **DO** take every page-composition rule from the six kumo pages.
* **DON'T** mine `analytics` or `notifications` for body recipes — their classes are build artefacts with no token
  meaning. Use them only as evidence that the shell is universal (and that `analytics` is where the other real `<table>`
  lives). **OBSERVED(n=2, pages=[analytics, notifications])**

---

## 8. Page-level anti-patterns the source itself ships

Copy the pattern, not the bug.

| Defect | Where | Fix |
| --- | --- | --- |
| **No `<main>` landmark** — content root is a bare `<div class="bg-kumo-canvas flex flex-col grow">` | `workers-and-pages` (`<main>` count = 0) — **OBSERVED(n=1)** | Always render `<main>`. **PRESCRIPTIVE** |
| **No skip link** on the six kumo pages (only the two legacy pages have `#skipTarget`) | **OBSERVED(n=6, pages=[api-tokens, audit-log, billing, home-overview, members, workers-and-pages])** | Ship a skip-to-content link. **PRESCRIPTIVE** |
| **Duplicate breadcrumb** (shell header *and* in-page) | `home-overview` — **OBSERVED(n=1)** | One crumb, in the shell header. |
| **`min-h-[calc(100vh-56px)]`** while `--header-height` is **58px** | all 8 pages — **OBSERVED(n=8)** | Use `calc(100vh - var(--header-height))`. See [`../spacing-layout.md`](../spacing-layout.md) §5.1. |
| **Data grid with no ARIA grid roles** (`role="table"`/`row`/`columnheader` = 0 on every kumo page) | `audit-log` — **OBSERVED(n=6, pages=[kumo pages])** | Use a real `<table>`, or add the roles. **PRESCRIPTIVE** |

---

## 9. Composing a new page — the checklist

1. **Shell**: nothing to do. Header, sidebar, breadcrumb, and the 3 `h-8` ghost actions are given. **§1**
2. **Column**: `max-w-350 mx-auto w-full`, `px-6 md:px-8 lg:px-10`, mark it `@container`. **§2**
3. **Header**: titled (§3a) unless the page is a tab set (§3b) or a padded grid track (§3c).
   `h1.text-3xl` · optional 28px icon · optional `p.text-base` description · `h-9` action cluster.
4. **Archetype**: overview (§6a) / list (§6b) / detail-settings (§6c). If you're writing a *form*, you are off the map —
   it is PRESCRIPTIVE territory (§6c warning).
5. **Group** with cards from the five recipes (§5). `rounded-lg`, `ring ring-kumo-line`, `shadow-xs`. `p-4` card / `p-6`
   panel. Never nest cards.
6. **Gaps**: `gap-2` (8px) unless you have a reason — it is used **1,572** times, more than every other gap combined
   (`facts.json → usage.spacing`). Section gap is `md:gap-4 xl:gap-6`. **OBSERVED(n=8, pages=[all])**
7. **Empty state**: pick flavour by scope (§6d). Keep the card chrome. `max-w-md` copy.
8. **Check yourself against §8** before you ship.

---

### Related

* Hub — [`../usage-guidelines.md`](../usage-guidelines.md) (index of all usage docs)
* [`../spacing-layout.md`](../spacing-layout.md) — the widths, gutters, control heights, z-ladder
* [`../typography.md`](../typography.md) · [`../colors.md`](../colors.md) · [`../iconography.md`](../iconography.md) · [`../elevation-motion.md`](../elevation-motion.md)
* [`../../components/navigation.md`](../../components/navigation.md) — shell & sidebar anatomy
* [`../../components/data-display.md`](../../components/data-display.md) — card, table, list, skeleton
* [`../../components/tabs-segmented.md`](../../components/tabs-segmented.md) · [`../../components/buttons.md`](../../components/buttons.md) · [`../../components/forms.md`](../../components/forms.md) · [`../../components/feedback-overlays.md`](../../components/feedback-overlays.md)
