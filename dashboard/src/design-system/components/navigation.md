# Navigation — Sidebar · App Shell · Breadcrumbs

Navigation components for the **cloudflare-dashboard** design system (source: `https://dash.cloudflare.com`).

Recipes: [`navigation.css`](./navigation.css) · Tokens: [`../tokens/colors.css`](../tokens/colors.css) ·
Foundations: [`../foundations/spacing-layout.md`](../foundations/spacing-layout.md), [`../foundations/elevation-motion.md`](../foundations/elevation-motion.md)

Every number below carries a provenance flag, using the same vocabulary as the foundations docs:

| Flag | Meaning |
| --- | --- |
| **OBSERVED** | Read verbatim out of `facts.json`, `computed-tokens.json`, `_classes.json`, `nav-probe.json`, or the post-render DOM in `capture/*.html`. |
| **DERIVED** | Arithmetic on an OBSERVED token (`gap-2.5` → `calc(var(--spacing) * 2.5)` → `10px`). Nothing guessed. |
| **PRESCRIPTIVE** | Guidance we are adding. **Not** in the capture. Always labelled. |

> ### Provenance note — read this first
>
> `classification.json` ranks this target **`utility-compiled`** (score `1.0`, ahead of `token-driven` at `0.813`) with
> `computedStyleMandatory: true`. Consequence for navigation specifically:
>
> * **Colours are tokenised.** Every surface/text/border in the nav resolves to a `--color-kumo-*` /
>   `--text-color-kumo-*` var. `_classes.json` gives the exact mapping (e.g. `.bg-(--sidebar-bg)` →
>   `background-color: var(--sidebar-bg)`).
> * **Geometry is not.** There is no `tokens/spacing.css`. Sidebar geometry comes from *component-scoped* custom
>   properties the source writes inline (`--sidebar-width`, `--sidebar-width-icon`, `--sidebar-animation-duration`,
>   `--sidebar-easing`, `--sidebar-nav-width`) plus the single Tailwind generator `--spacing: .25rem`. All are exact,
>   all are in `computed-tokens.json`. `navigation.css` re-declares them at the component root.
> * The sidebar is **shadcn/ui's Sidebar, in production**. The captured DOM carries `data-sidebar="…"`,
>   `data-state`, `data-side`, `data-variant`, `data-collapsible`, `--sidebar-width`, `--sidebar-width-icon` — the
>   shadcn contract, tuned. Porting is re-theming, not re-building.

---

## 1. Shell dimensions — the load-bearing numbers

**OBSERVED** — `computed-tokens.json` + inline styles on `<html>` / `[data-sidebar-wrapper]`:

| Variable | Value | Where it lives | What it drives |
| --- | --- | --- | --- |
| `--header-height` | `58px` | `:root` | Top header height **and** sidebar header height (they are flush) |
| `--sidebar-width` | `16.25rem` (**260px**) | `[data-sidebar-wrapper]` inline | Expanded rail |
| `--sidebar-width-icon` | `57px` | `[data-sidebar-wrapper]` inline | Collapsed icon rail |
| `--sidebar-nav-width` | `260px` | **`<html>` inline, written by JS** | The shell grid's first column — tracks the rail's *live* width (260 ⇄ 57) |
| `--sidebar-animation-duration` | `250ms` | `[data-sidebar-wrapper]` inline | Every width/padding/transform in the rail |
| `--sidebar-easing` | `cubic-bezier(0.77, 0, 0.175, 1)` | `[data-sidebar-wrapper]` inline | Ditto — a hard ease-in-out ("easeInOutQuart") |
| `--preview-banner-height` | unset → `0px` fallback | consumed only | Sticky offsets, when a preview bar is mounted |

Derived and observed geometry:

| Part | Value | Flag |
| --- | --- | --- |
| Sidebar footer height | `48px` (`h-12`) | OBSERVED |
| Nav item min-height | **`34px`** (`min-h-8.5` → `calc(var(--spacing) * 8.5)`) | DERIVED |
| Collapse trigger | `34px` square (`size-8.5`) | DERIVED |
| Quick-search trigger | `32px` (`h-8`) — the system's small control height | OBSERVED (`facts.json → usage.controlHeights: h-8 = 24 uses`) |
| Sub-menu indent | `28px` (`pl-7`); guide rail at `left: 19px`, `1px` wide | OBSERVED |
| Rail viewport gutter | `11px` collapsed → `14px` (`px-3.5`) expanded | OBSERVED |
| Page container | `max-width: 1400px`; padding `24 → 32 (md) → 40px (lg)` | OBSERVED |
| Right-hand drawer | `450px`, `translateX(100%)` when closed, `300ms ease-in-out` | OBSERVED |

### 1.1 Why the rail is **57px** and not 56px

The collapsed rail is an odd number, and the nav row's inner content carries `translate-x-[-3px]` while collapsed.
Do the arithmetic (**DERIVED**): `11px` viewport gutter `+ 12px` item padding `− 3px` shift `+ 8px` (half of the
16px icon) `= 28px` — i.e. `57 / 2 = 28.5`, dead-centre. **The −3px shift and the 57px rail are one decision.**
If you change either, recompute the other or the icons drift off-axis.

### 1.2 Z-index ladder for the shell

**OBSERVED**, from the captured markup:

| Layer | z | Note |
| --- | --- | --- |
| Sub-menu guide rail | `10` | Inside the rail only |
| Banner slot | `19` | Deliberately **under** the header |
| Top header | `20` | Sticky |
| Sidebar wrapper | `50` | Sticky, `isolation: isolate` |
| Right-hand drawer | `1150` | |
| **Collapsed** sidebar container | `1190` | So a hover-peek overhangs `<main>` instead of reflowing it |

(The system's named `--z-index-*` tokens — `modal: 9999`, `drawer: 99999`, `toast: 1000000` — sit above all of this.
See `foundations/elevation-motion.md § 1.6`.)

---

## 2. App shell

```
.ds-app-shell                      grid-template-columns: var(--sidebar-nav-width) 1fr
├── .ds-sidebar-wrapper            sticky top-0 · h-screen · z-50 · isolate
│   └── aside.ds-sidebar           [data-state][data-side][data-variant][data-collapsible]
└── .ds-app-shell__column          flex column · min-w-0
    ├── header.ds-app-header       58px · sticky · hairline-bottom
    │   ├── .ds-app-header__crumb-slot → nav.ds-breadcrumbs.ds-breadcrumbs--header
    │   └── .ds-app-header__actions    → Ask AI · Support · user menu
    ├── .ds-app-shell__banner      optional (z-19)
    ├── main.ds-app-shell__main
    │   └── .ds-app-shell__container   max-w-1400 · responsive padding
    │       ├── nav.ds-breadcrumbs     in-page crumb
    │       └── header (page header)   h1 + actions
    └── .ds-app-shell__panel       optional 450px right drawer (z-1150)
```

**The shell is a CSS grid, not a flex row.** The first column is `var(--sidebar-nav-width, 57px)` and transitions
over `250ms`/`--sidebar-easing`. That is what makes the collapse feel like the *page* is widening rather than a panel
sliding away. The `<aside>` is sticky inside that column and — when collapsed — is allowed to overflow it (§4.4).

### 2.1 Surfaces

**OBSERVED**, and this is the single most important thing to copy correctly:

| Region | Background | Separator |
| --- | --- | --- |
| Sidebar | `var(--color-kumo-canvas)` | `border-right: 1px solid var(--color-kumo-line)` |
| Top header | `var(--color-kumo-canvas)` | `border-bottom: 1px solid var(--color-kumo-line)` |
| Main | `var(--color-kumo-canvas)` | — |

All three are the **same** surface. The chrome is delimited by **hairlines only** — there is no darker/lighter nav
panel. Contrast in this product comes from cards (`--color-kumo-base`) sitting *on* the canvas, not from the chrome.

### 2.2 Header contents

* **Left** — breadcrumb slot. It mounts at `opacity: 0; translateY(4px)` and fades in over `250ms` once the route's
  title resolves (keyframe `fadeSlideIn` is in `motion-data.json`). Hidden below `640px`.
* **Right** — `.ds-app-header__actions`: an "Ask AI" ghost button, a "Support" ghost link-button, and an icon-only
  user menu. All `h-8` / `size-8` ghost Buttons (`bg-inherit`, `shadow-none`, `hover:bg-kumo-tint`) — see
  `components/buttons.*`. Their **labels are hidden below `768px`** (`hidden md:inline`); the icons remain.
* The header does **not** contain a hamburger in any capture (all shots are 1920px). See §7.

### 2.3 Known source anomaly

**OBSERVED** — the main column is `min-h-[calc(100vh-56px)]` while `--header-height` is `58px`. A 2px discrepancy the
source lives with. `navigation.css` uses `calc(100vh - var(--header-height))`, i.e. it **fixes** this. If you need
pixel-identical parity with production, hardcode the 56px — but you almost certainly do not.

---

## 3. Sidebar — anatomy

Attribute contract (keep these; they are the state machine **and** they match shadcn/ui):

| Attribute | Values observed | Notes |
| --- | --- | --- |
| `data-state` | `expanded` · `collapsed` | On the wrapper **and** the `<aside>` |
| `data-side` | `left` | `right` is PRESCRIPTIVE |
| `data-variant` | `sidebar` | `inset` is API-present (see §6) |
| `data-collapsible` | `icon` | `offcanvas` / `none` are PRESCRIPTIVE |
| `data-active` | `true` (exactly **1** per page, all 8 pages) | On the current-route item |
| `data-size` | `base` (the **only** value in all 8 pages) | → 34px min-height |
| `data-mobile` | — (not captured) | Referenced by `group-data-[mobile=true]` rules |
| `data-sidebar` | `sidebar` `content-container` `peek-zone` `header` `content` `menu` `menu-item` `menu-button` `menu-sub` `menu-sub-item` `menu-sub-button` `menu-badge` `group` `group-label` `separator` `footer` `trigger` `sliding-views` `sliding-view` | The part map |

### 3.1 Parts

| Part | Class | Geometry |
| --- | --- | --- |
| Header | `.ds-sidebar__header` | `58px`, hairline-bottom, `px-3` → `px-2` collapsed |
| Brand | `.ds-sidebar__brand` | 48px mark, `scale(.833)` in the rail, `transform-origin: left` |
| Account name | `.ds-sidebar__account` | `text-sm`/`500`, truncates |
| Quick search | `.ds-sidebar__search` | `32px`, `⌘/Ctrl K` kbd hint, loses its ring+shadow in the rail |
| Menu | `.ds-sidebar__menu` | `<ul>`, `gap: 1px`, no bullets |
| Item | `.ds-sidebar__menu-button` | `34px`, `radius-lg`, 16px icon @ 50% opacity |
| Sub-menu | `.ds-sidebar__menu-sub` | `<ul>`, indent `28px`, 1px guide rail at `19px` |
| Sub-item | `.ds-sidebar__menu-sub-button` | `34px`, **no icon**, 150ms colour-only transition |
| Badge | `.ds-sidebar__menu-badge` | dashed pill, `11px/1`, hidden in the rail |
| Group | `.ds-sidebar__group` + `__group-label` | label ⇄ divider (§5) |
| Separator | `.ds-sidebar__separator` | one hairline, `my-3 px-2` |
| Footer | `.ds-sidebar__footer` | `48px`, sticky-bottom, hairline-top |
| Trigger | `.ds-sidebar__trigger` | `34px` square, 18px icon |

### 3.2 The scroll viewport

`.ds-sidebar__viewport` hides its scrollbar (`scrollbar-width: none`) — a 260px rail has no room for one — and instead
**masks 24px of fade at each end** with a `linear-gradient` mask driven by scroll-position vars. The fade only appears
when there is actually overflow in that direction. Copy this; a hard clip at the top of a 40-item nav looks broken.

### 3.3 Sliding views (account ⇄ zone)

`.ds-sidebar__views` is a viewport; `.ds-sidebar__views-track` holds **two** full-width views side by side
(`data-value="account"`, `data-value="zone"`). Drilling into a zone translates the track by `-100%` over
`--sidebar-animation-duration`. The off-screen view is `aria-hidden="true"` **and** `inert` **and**
`pointer-events: none` — all three. This is the source's own hygiene; keep it, or you ship a focus trap into an
invisible nav.

---

## 4. Sidebar — states

### 4.1 The complete state table (OBSERVED, transcribed from the mined class strings)

| Element | State | Background | Text | Other |
| --- | --- | --- | --- | --- |
| `menu-button` | rest | transparent | `--text-color-kumo-default` | icon `opacity: .5` |
| | **hover** | `var(--sidebar-active-bg)` | unchanged | chevron `opacity: .4 → 1` |
| | **active** (`[data-active=true]`) | `var(--sidebar-active-bg)` (persistent) | **unchanged** | — |
| | **active parent** (`:has([data-active])`) | transparent | unchanged | prevents a doubled highlight |
| | **focus-visible** | `var(--sidebar-active-bg)` | `--text-color-kumo-strong` | **no ring** — see §8 |
| | **expanded** (`[aria-expanded=true]`) | — | — | chevron rotates 180° |
| | disabled | — | — | not observed; PRESCRIPTIVE |
| `menu-sub-button` | hover / active / focus-visible | same ladder, 150ms | same | no icon slot |
| `shortcut` row | hover | `var(--sidebar-active-bg)` | link → `--text-color-kumo-strong` | pin fades in to `opacity: .5` |
| `trigger` | hover | `var(--sidebar-active-bg)` | `subtle → default` | |
| | focus-visible | — | — | **`ring-2 ring-inset` `--color-kumo-brand`** |
| `search` | hover | `var(--color-kumo-tint)` | — | |
| | focus-visible | — | — | `ring-2` `--color-kumo-brand` |

### 4.2 `--sidebar-bg` / `--sidebar-active-bg` — a two-level token remap

**OBSERVED.** The wrapper declares defaults; the `<aside>` overrides them; dark mode re-points the active surface:

```css
/* wrapper — defaults (inherited by any *other* sidebar instance, e.g. a sheet) */
--sidebar-bg:        var(--color-kumo-base);
--sidebar-active-bg: var(--color-kumo-tint);

/* aside — the real dashboard rail */
--sidebar-bg:        var(--color-kumo-canvas);
--sidebar-active-bg: var(--color-kumo-recessed);

/* dark: recessed reads as a hole on a near-black canvas → use the control surface */
[data-mode="dark"] aside { --sidebar-active-bg: var(--color-kumo-control); }
```

This is a **token remap, not a hardcoded per-theme value** — the only theme-conditional rule in `navigation.css`.
Everything else switches automatically through `:root` / `[data-mode=dark]` in `tokens/colors.css`.

### 4.3 Active is a **surface**, not a colour or a weight

The active item does **not** turn brand-orange/blue, does **not** get a bolder label, and does **not** get a left
accent bar. It gets `--sidebar-active-bg` and nothing else. Every item is already `font-weight: 500`. Resist adding an
accent bar "for clarity" — it will be the only one in the system.

### 4.4 Collapsed mode (`data-collapsible="icon"`)

What changes, in full (**OBSERVED**):

| | Expanded | Collapsed |
| --- | --- | --- |
| `<aside>` width | `260px` | `57px` |
| Shell grid column | `260px` | `57px` (via `--sidebar-nav-width`) |
| Container z-index | auto | **`1190`** (peek can overhang `<main>`) |
| Item content | `translateX(0)` | `translateX(-3px)` (centres the icon) |
| Labels | visible | clipped by `overflow: hidden` + `white-space: nowrap` — **not** `display: none` |
| Chevrons | visible | `display: none` |
| Badges | visible | `display: none` |
| Group labels | text visible, no rule | `grid-rows: 0fr` **and a hairline appears in their place** |
| Header padding | `12px` | `8px` |
| Logo | `scale(1)` | `scale(.833)` |
| Viewport gutter | `14px` | `11px` |
| Footer | `260px` wide, no right border | `57px` wide, **gains** a right border |
| Quick search | ring + shadow | ring + shadow removed |

Two subtleties worth calling out:

1. **Labels are clipped, not removed.** Keeping them in the DOM (and in the accessibility tree) is why the collapse
   can be a pure CSS width animation with no layout thrash — and why a screen-reader user in the rail still hears
   "Workers & Pages", not "button".
2. **The footer keeps its own width.** During the animation, the container and the footer both animate width, so the
   footer's border-right stays glued to the container's edge instead of tearing.

### 4.5 Peek

While collapsed, the container is promoted to `z-1190`. Hovering the rail (`data-sidebar="peek-zone"`) expands the
**container** back to `--sidebar-width` — **not** the `<aside>`, and **not** the grid column. Result: the nav
temporarily overhangs the page instead of reflowing it. `navigation.css` exposes this as
`.ds-sidebar[data-state="collapsed"][data-peek="true"]`.

---

## 5. Section grouping

Cloudflare's nav is enormous — **80 links** in the account sidebar (`nav-probe.json → navLinks.length = 80`), across
groups like *Observe · Build · Storage & databases · Manage account*. Three mechanisms keep it navigable:

1. **Group label** (`.ds-sidebar__group-label`) — `text-sm`/`500`/`--text-color-kumo-subtle`, `px-3`, `mt-4 mb-2`
   (`mt-2` for the first group). It lives inside a `grid-template-rows: 1fr → 0fr` wrapper so it can *animate* away.
2. **Label ⇄ divider swap** — when the rail collapses, the label collapses to zero height **and the wrapper grows a
   `border-bottom: 1px solid var(--color-kumo-line)` plus `my-3`**. The section boundary survives the collapse as a
   hairline. This is the single cleverest detail in the whole nav; do not drop it.
   The **first** group is exempt (no leading rule, in either state).
3. **Explicit separator** (`.ds-sidebar__separator`) — used exactly once, to fence off *Manage account* from the
   product nav.

Two disclosure levels are shipped: `menu-button` → `menu-sub` → (`menu-sub-button` → `menu-sub`). Both animate with
`grid-template-rows: 0fr → 1fr`, no height measuring. Depth beyond that is not observed — **PRESCRIPTIVE: stop at
two.** A third indent (`pl-7` twice = 56px) leaves ~200px for a label in a 260px rail.

Also in the menu: a **Recents / pinned shortcuts** block (`.ds-sidebar__shortcut`) — two-line rows (title +
originating section at `10.5px`/`--text-color-kumo-subtle`) with a pin button that is `opacity: 0` until the row is
hovered or the button is focused. `pr-8.5` (34px) permanently reserves the pin's column so the title never reflows
when it appears.

---

## 6. Variants

| Variant | Status | Behaviour |
| --- | --- | --- |
| `data-variant="sidebar"` | **OBSERVED** — the only live one | Rail sits flush against `<main>`; hairline separates them |
| `data-variant="inset"` | **API-present, not active.** The wrapper carries `has-data-[variant=inset]:bg-kumo-recessed` | Shell background recesses so `<main>` floats as a card |
| `data-collapsible="icon"` | **OBSERVED** | Collapses to the 57px rail (§4.4) |
| `data-collapsible="offcanvas"` / `"none"` | **PRESCRIPTIVE** | shadcn conventions; not in this capture |
| `data-side="left"` | **OBSERVED** | |
| `data-side="right"` | **PRESCRIPTIVE** | Flip the container's border to `border-left` |
| `data-size="base"` | **OBSERVED** — 8/8 pages, no other value | 34px |
| `data-size="sm"` | **PRESCRIPTIVE** | 28px, offered in `navigation.css` for dense tools |
| `.ds-sidebar--focus-ring` | **PRESCRIPTIVE** | Adds a real focus ring to nav items (§8) |

---

## 7. Responsive behaviour

Mined breakpoints (`breakpoints-data.json`): **640 / 768 / 1024 / 1280 / 1536**. Navigation uses the first three.

| Width | Behaviour | Flag |
| --- | --- | --- |
| `≥ 640px` (`sm`) | Header breadcrumb appears (`hidden sm:flex`). The in-page breadcrumb renders **twice** — `contents sm:hidden` and `hidden sm:contents` — so the two can carry different crumb sets. | OBSERVED |
| `≥ 768px` (`md`) | Header action **labels** appear (`hidden md:inline`); icons show at all widths. Page container padding `24px → 32px`. | OBSERVED |
| `≥ 1024px` (`lg`) | Page container padding `32px → 40px`. | OBSERVED |
| `< 640px` | **Mobile sheet.** The class strings prove the mode exists — `group-data-[mobile=true]/sidebar:` rules force group labels open (`grid-rows-[1fr]`, `my-0`, `border-transparent`) and kill transitions (`transition-none`). **No mobile DOM was captured** (all 8 shots are 1920px), so the sheet's overlay/scrim/trigger markup is **PRESCRIPTIVE**. | Mixed |

**PRESCRIPTIVE mobile recipe:** render the same sidebar inside a shadcn `<Sheet side="left">` at `--sidebar-width`
(260px), set `data-mobile="true"` on the sidebar root (which switches labels on and transitions off — those rules are
real), and put the `SidebarTrigger` in the header, left of the breadcrumb. Do **not** ship the 57px rail on a phone:
an icon-only rail with 80 destinations and no labels is unusable.

---

## 8. Accessibility

### What the source gets right (copy it)

* `<aside>` for the rail, `<nav>` for the menu region, `<header>` for the top bar, `<main>` for content — real
  landmarks, not `div role=`.
* Menus are `<ul>` / `<li>`, list-styled off. Nav items are `<a>` when they navigate and `<button type="button">`
  when they only disclose. **Never a `div` with an onClick.**
* Disclosures: `aria-expanded` + `aria-controls` on the trigger; the panel is `role="region"` and gets
  `aria-hidden="true"` **plus `inert`** when closed.
* The off-screen sliding view is `aria-hidden` + `inert` + `pointer-events: none`.
* The collapse trigger has `aria-label="Collapse sidebar"` and `aria-expanded`, and it is the one control that
  focuses with a **real 2px `--color-kumo-brand` ring** (`ring-inset`, so it never clips inside the 34px square).
* Decorative icons are `aria-hidden="true" focusable="false"`; the breadcrumb chevrons are `aria-hidden` too.
* Collapsed labels are **clipped, not `display:none`** — they stay in the accessibility tree.
* `motion-reduce:transition-none` is on every animated nav surface, and 8 `prefers-reduced-motion` rules ship.

### What to fix (⚠ do **not** copy)

1. **⚠ Nav items have no focus ring.** `focus-visible` on `menu-button` / `menu-sub-button` / shortcut links sets
   `background: var(--sidebar-active-bg)` and `color: --text-color-kumo-strong` — and `outline: none`. In light mode
   that background step is `canvas (98.75% L)` → `recessed (96% L)`: a **~2.75% luminance delta**, far below the
   3:1 non-text contrast required by WCAG 2.2 SC 1.4.11 / 2.4.11 (Focus Appearance). A keyboard user cannot reliably
   see where they are. **Use `.ds-sidebar--focus-ring`**, which adds `inset 0 0 0 2px var(--color-kumo-brand)` — the
   same ring the collapse trigger already uses.
2. **⚠ The active item is announced only by colour.** `data-active="true"` is a styling hook, not a semantic. Add
   **`aria-current="page"`** to the active nav link. (The source *does* do this on breadcrumbs — 6 of 8 pages — but
   not on the sidebar item.)
3. **⚠ Breadcrumbs are not a list.** The source uses `<nav aria-label="breadcrumb">` wrapping bare `<a>`/`<span>`.
   Wrap them in `<ol><li>` (as shadcn's `Breadcrumb` does) so the count and position are announced.
4. **⚠ The active-parent rule is `:has()`-only.** `:has([data-active])` has no fallback; in a browser without `:has()`
   the parent and the child both tint. Acceptable in 2026, but know it is there.

### Additional PRESCRIPTIVE requirements

* Give the sidebar `<nav aria-label="Main">` and the breadcrumb `<nav aria-label="Breadcrumb">` — two navs, two names.
* Ship a **skip link** to `<main>` as the first focusable element. There is none in the capture, and with 80 links
  ahead of the content that is a serious tab-order problem.
* Give `<main>` `id="main"` and `tabindex="-1"` so the skip link can land on it.
* Icon-only rail: the label is clipped, so the accessible name survives — but sighted mouse users get nothing. Attach
  a `Tooltip` to each item when `data-state="collapsed"` (the source already wires tooltip triggers on the pin
  buttons, so the primitive exists).

---

## 9. Do / Don't

**Do**

* Drive everything from `data-state` / `data-active` / `data-collapsible` on the roots. Never toggle classes per item.
* Keep the rail, the header and `<main>` on the **same** `--color-kumo-canvas` surface, separated by
  `--color-kumo-line` hairlines.
* Animate `width` on the **container**, `grid-template-columns` on the **shell**, and `grid-template-rows` on the
  **disclosures**. All three at `250ms` / `--sidebar-easing`.
* Keep the `-3px` icon shift paired with the `57px` rail (§1.1).
* Use `--radius-lg` (`.5rem`) on every nav surface. `rounded-lg` is **946 uses** across the capture — it *is* the
  system radius (`facts.json → usage.radius`).
* Reserve the pin/action gutter (`pr-8.5`) permanently so hover never reflows a label.
* Truncate with `min-width: 0` + `text-overflow: ellipsis` on **every** crumb and label. A 260px rail and a 1400px
  content column both depend on it.

**Don't**

* ❌ Don't add a left accent bar, a brand-coloured active item, or a bolder active label. The system's "you are here"
  is a surface tint, full stop.
* ❌ Don't recolour the 16px nav icon on active/hover. It stays at `opacity: .5`, always.
* ❌ Don't widen the `<aside>` (or the grid column) on peek — widen the **container** and let it overhang at `z-1190`.
* ❌ Don't `display: none` the labels when collapsing — you lose the accessibility tree and the pure-CSS animation.
* ❌ Don't use `transition: all`. The source enumerates: `transition-[width]`, `transition-[padding]`,
  `transition-[grid-template-rows]`, `transition-[color,box-shadow,outline]`. Match that discipline
  (`foundations/elevation-motion.md § 2.4`).
* ❌ Don't nest disclosures more than two deep.
* ❌ Don't ship the shipped focus style (§8.1).
* ❌ Don't hardcode `oklch(...)`/hex anywhere in navigation. Every colour has a token.

---

## 10. Using this in Tailwind CSS v4 + shadcn/ui

The source **is** shadcn/ui's Sidebar. The port is a re-theme.

### 10.1 `@theme` — register the nav scale

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tokens/colors.css";      /* :root + [data-mode=dark] */
@import "../design-system/tokens/typography.css";

/* next-themes writes .dark — mirror the source's [data-mode=dark] onto it */
@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  /* Surfaces / text — straight through to the mined tokens */
  --color-canvas:    var(--color-kumo-canvas);
  --color-base:      var(--color-kumo-base);
  --color-tint:      var(--color-kumo-tint);
  --color-recessed:  var(--color-kumo-recessed);
  --color-control:   var(--color-kumo-control);
  --color-line:      var(--color-kumo-line);
  --color-brand:     var(--color-kumo-brand);

  --color-fg:          var(--text-color-kumo-default);
  --color-fg-strong:   var(--text-color-kumo-strong);
  --color-fg-subtle:   var(--text-color-kumo-subtle);
  --color-fg-inactive: var(--text-color-kumo-inactive);

  /* shadcn's Sidebar reads these three by name — give it the mined values */
  --sidebar-width: 16.25rem;
  --sidebar-width-icon: 57px;
  --sidebar-width-mobile: 16.25rem;

  --header-height: 58px;
  --radius-lg: 0.5rem;
}
```

> **Dark mode:** the token file switches on `[data-mode=dark]`. With `next-themes` (`attribute="class"`) you get
> `.dark`. Either add `attribute={["class", "data-mode"]}`, or duplicate the token block's selector to
> `[data-mode="dark"], .dark`. `navigation.css` already targets **both** for its one theme-conditional rule.

### 10.2 Install and re-skin the shadcn Sidebar

```bash
npx shadcn@latest add sidebar breadcrumb sheet tooltip button
```

`components/ui/sidebar.tsx` ships with the exact part names the capture uses. Map them:

| Capture part | shadcn component | Re-skin to |
| --- | --- | --- |
| `[data-sidebar-wrapper]` | `<SidebarProvider>` | `--sidebar-bg: var(--color-kumo-base)`, `--sidebar-active-bg: var(--color-kumo-tint)` |
| `aside[data-sidebar=sidebar]` | `<Sidebar collapsible="icon">` | `bg-canvas`, `border-r border-line`; override the two vars to `canvas` / `recessed` |
| `[data-sidebar=header]` | `<SidebarHeader>` | `h-[--header-height] border-b border-line px-3` |
| `[data-sidebar=content]` | `<SidebarContent>` | hide scrollbar + 24px mask |
| `[data-sidebar=group]` | `<SidebarGroup>` | |
| `[data-sidebar=group-label]` | `<SidebarGroupLabel>` | **wrap in the `grid-rows-[1fr→0fr]` shell** so it can swap to a hairline |
| `[data-sidebar=menu]` | `<SidebarMenu>` | `gap-px` |
| `[data-sidebar=menu-button]` | `<SidebarMenuButton>` | 34px, `rounded-lg`, `text-sm/500` |
| `[data-sidebar=menu-sub]` | `<SidebarMenuSub>` | `pl-7` + the 1px rail at `left-[19px]` |
| `[data-sidebar=menu-badge]` | `<SidebarMenuBadge>` | dashed `rounded-full` pill |
| `[data-sidebar=separator]` | `<SidebarSeparator>` | |
| `[data-sidebar=footer]` | `<SidebarFooter>` | `h-12 border-t border-line` |
| `[data-sidebar=trigger]` | `<SidebarTrigger>` | 34px, `ring-2 ring-inset ring-brand` on focus |
| `nav[aria-label=breadcrumb]` | `<Breadcrumb>` | §10.5 |
| mobile sheet | `<Sheet>` (built into `<Sidebar>`) | `data-mobile="true"` |

shadcn's default sidebar tokens (`--sidebar-accent`, `--sidebar-primary`, …) are **not** this system. Delete them and
point the component at `--sidebar-bg` / `--sidebar-active-bg` as above.

### 10.3 CVA — the nav item

```ts
// components/nav/sidebar-menu-button.tsx
import { cva, type VariantProps } from "class-variance-authority";

export const sidebarMenuButton = cva(
  [
    "group/menu-button relative flex w-full min-w-0 items-center gap-2.5",
    "rounded-lg px-3 py-0 text-sm font-medium text-fg no-underline",
    "cursor-pointer outline-none",
    // hit-target extender across the 1px inter-item gap
    "before:absolute before:inset-x-0 before:-inset-y-px",
    "transition-[color,background-color,box-shadow] duration-[--sidebar-animation-duration]",
    "motion-reduce:transition-none",
    // hover + active + active-parent, exactly as mined
    "hover:bg-(--sidebar-active-bg)",
    "data-[active=true]:bg-(--sidebar-active-bg)",
    "has-[[data-active]]:bg-transparent has-[[data-active]]:hover:bg-(--sidebar-active-bg)",
    // focus: the source's tint + our PRESCRIPTIVE ring (keep the ring)
    "focus-visible:bg-(--sidebar-active-bg) focus-visible:text-fg-strong",
    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand",
  ],
  {
    variants: {
      size: {
        base: "min-h-8.5",          // 34px — the ONLY size the source ships
        sm: "min-h-7 px-2.5",       // PRESCRIPTIVE
      },
      depth: {
        root: "gap-2.5",
        sub: "gap-2 transition-[color] duration-150",  // sub-items: colour only
      },
    },
    defaultVariants: { size: "base", depth: "root" },
  },
);
export type SidebarMenuButtonProps = VariantProps<typeof sidebarMenuButton>;
```

Usage — note `aria-current`, which the source omits:

```tsx
<SidebarMenuButton asChild isActive={isActive} data-size="base">
  <Link href={href} data-active={isActive || undefined} aria-current={isActive ? "page" : undefined}>
    <Boxes className="size-4 shrink-0 opacity-50" aria-hidden />
    <span className="flex flex-1 items-center gap-2 min-w-0 overflow-hidden">
      <span className="truncate">{label}</span>
      {badge && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
    </span>
  </Link>
</SidebarMenuButton>
```

### 10.4 The shell

```tsx
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16.25rem",
        "--sidebar-width-icon": "57px",
        "--sidebar-animation-duration": "250ms",
        "--sidebar-easing": "cubic-bezier(0.77, 0, 0.175, 1)",
      } as React.CSSProperties}
      className="grid min-h-screen grid-rows-1 content-start
                 [grid-template-columns:var(--sidebar-nav-width,57px)_1fr]
                 transition-[grid-template-columns] duration-250 ease-[cubic-bezier(0.77,0,0.175,1)]
                 will-change-[grid-template-columns] motion-reduce:transition-none"
    >
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>  {/* PRESCRIPTIVE */}

      <AppSidebar />

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-(--preview-banner-height,0px) z-20 flex h-(--header-height)
                           shrink-0 items-center border-b border-line bg-canvas px-4">
          <AppBreadcrumb />
          <div className="ml-auto flex gap-1">{/* Ask AI · Support · user menu */}</div>
        </header>
        <main id="main" tabIndex={-1} className="h-full w-full grow bg-canvas">
          <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-10 @container">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
```

`--sidebar-nav-width` must track the live rail width. shadcn already exposes `state` from `useSidebar()`:

```tsx
const { state } = useSidebar();
useEffect(() => {
  document.documentElement.style.setProperty(
    "--sidebar-nav-width",
    state === "collapsed" ? "57px" : "260px",
  );
}, [state]);
```

### 10.5 Breadcrumbs

```tsx
<Breadcrumb className="hidden h-12 min-w-0 grow items-center gap-1 text-base sm:flex">
  <BreadcrumbList className="gap-1">
    <BreadcrumbItem>
      <BreadcrumbLink asChild className="text-fg-subtle hover:text-fg">
        <Link href="/account"><Building2 className="size-4 shrink-0" aria-hidden /> Manage Account</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator className="text-fg-inactive [&>svg]:size-6" />   {/* 24px chevron */}
    <BreadcrumbItem>
      <BreadcrumbPage className="truncate font-medium text-fg">Members</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

shadcn's `<BreadcrumbPage>` already emits `aria-current="page"` and `<BreadcrumbSeparator>` already emits
`aria-hidden` + `role="presentation"` — this is the fix for §8.3, free.

### 10.6 Icons — `lucide-react`

The source ships **62 unique icons / 476 uses**, `dominantStyle: "fill"` — it is **Phosphor** (`viewBox="0 0 256 256"`)
plus an in-house 16px set (`viewBox="0 0 16 16"`). The target framework is `lucide-react` (stroke). Equivalents, at
the **mined sizes**:

| Nav role | Mined size | Source | `lucide-react` |
| --- | --- | --- | --- |
| Nav item icon | `16px`, `opacity: .5` | in-house 16 | domain-specific (`Boxes`, `Database`, `ShieldCheck`, …) |
| Disclosure chevron | `12px` | Phosphor — **176 uses on 8 pages, the most-used icon in the app** | `ChevronDown` |
| Collapse trigger | `18px` | stroke, 24 viewBox | `PanelLeft` |
| Breadcrumb separator | `24px` | stroke, 24 viewBox | `ChevronRight` |
| Quick search | `16px` | Phosphor | `Search` |
| Pin (shortcut) | `14px` | stroke | `Pin` / `PinOff` |
| Header actions | `16px` (`size-4`) | Phosphor | `Sparkles`, `LifeBuoy`, `CircleUser` |

Lucide's default stroke is `2`; the source's stroke icons run at `1.5`. Set `strokeWidth={1.5}` globally to match the
weight, or the rail will read heavier than production. Always `aria-hidden` decorative icons.

---

## 11. Provenance

| Claim | Source |
| --- | --- |
| Shell/rail dimensions, easing, durations | `capture/home-overview.html` inline styles; `capture/computed-tokens.json` |
| `--header-height: 58px` | `computed-tokens.json`; `:root` in the source's inline `<style>` |
| Part map, states, class→token mapping | `capture/*.html` post-render DOM; `capture/_classes.json` |
| Colour tokens | `design-system/tokens/colors.css`; `design-system/tokens.json` |
| Spacing generator `--spacing: .25rem`, `--radius-lg: .5rem`, `--text-sm: 13px`, `--text-base: 14px`, `--font-weight-medium: 500` | `computed-tokens.json` |
| Radius usage (`rounded-lg` × 946), control heights (`h-8` × 24, `h-9` × 32), breakpoints | `capture/facts.json` |
| 80 sidebar links; the sliding account/zone views | `capture/nav-probe.json`; `home-overview.html` |
| 62 unique icons / 476 uses; 12px chevron × 176 | `capture/facts.json → icons`; `capture/icons-data.json` |
| Motion: `250ms`, `cubic-bezier(0.77, 0, 0.175, 1)`, 8 reduced-motion rules, keyframe `fadeSlideIn` | `capture/motion-data.json`; `facts.json → motion` |
| Framework classification (`utility-compiled`, computed styles mandatory) | `capture/classification.json` |
