# Usage Guidelines — the decision layer

**The tokens tell you what the values are. The component docs tell you what each piece is. This hub tells you *when to reach for which*.**

Every rule below is derived from a static capture of **[dash.cloudflare.com](https://dash.cloudflare.com)** — 8 pages (`analytics`, `api-tokens`, `audit-log`, `billing`, `home-overview`, `members`, `notifications`, `workers-and-pages`), 551 tokens, 4 themes (`light`, `dark`, `kumo`, `fedramp`). The counts come from one file and one file only: [`../../capture/facts.json`](../../capture/facts.json). Where the capture is silent, this doc says so out loud rather than inventing a convention.

## How to read the provenance tags

| Tag | Means |
|---|---|
| `OBSERVED(n=…, pages=[…])` | A count or element that exists in `facts.json`. The only source of numbers. |
| `DERIVED(from=…)` | Logically follows from `tokens.json`, `_classes.json`, a component doc, or a class-pattern scan of the captured DOM. Not a `facts.json` count. |
| `PRESCRIPTIVE` | A best practice **not evidenced by the captures.** Stated plainly, never dressed up as observed. |

**Two things `facts.json` does not know**, and you must not pretend otherwise:

* `usage.variantClasses = {}` — **empty.** There is no button-variant frequency in the fact bundle. Any "ghost vs emphasis" ranking is `DERIVED` from the component docs, never `OBSERVED`.
* `usage.statusIntent = {}` — **empty.** No success/warning/danger intent was exercised on any captured page. Every status-*intent* choice is `PRESCRIPTIVE`.
* `notObserved: ["textarea", "select", "radio", "switch"]` — four component families rendered **zero** times. `OBSERVED(n=0, pages=[all 8])`

---

## Golden rules

1. **Default to `text-sm` (13px).** It is **914 of 1,060** real type-class uses — **86%** of all typed text in the product. If you don't have a reason, it's `text-sm`. `OBSERVED(n=914, pages=[all 8])`
   *(The `type-dark` ×2 in `typeClassTotals` is a react-tooltip colour variant, not a type class — hence 1,060, not 1,062.)*

2. **The default control height is `h-9` (36px), and the compact rung is `h-8` (32px).** Read them from `usage.controlHeights` — `h-9` 32, `h-8` 24, `h-10` 2 — the **REAL** control-height field, square icon/avatar boxes already excluded. `OBSERVED(n=58 controls, pages=[all 8])`

3. **There is no hero CTA.** The tallest real control in the entire capture is **`h-10` = 40px, seen twice**, and no button anywhere carries a type class larger than `text-base` (14px). Importance comes from the **emphasis variant**, never from height. `OBSERVED(n=2 at h-10, pages=[all 8])`

4. **Never read a control size off a raw height or a square box.** `rawControlHeightClasses` makes `h-12` the single most frequent `h-*` (n=44) — it is a **row**, not a button. And `squareBoxes: {"w-6 h-6": 2}` is an **icon button**, which has no text-control height at all. `DERIVED(from=facts.json — controlHeights vs rawControlHeightClasses vs squareBoxes)`

5. **One radius: `rounded-lg` (8px).** It is **946 of 1,179** radius utilities — **80%** — `OBSERVED(n=946 rounded-lg of 1,179 radius utilities, pages=[all 8])`. Treat it as the radius of every sized control: `DERIVED(from=components/*.md — the button/input/card recipes all specify rounded-lg; usage.radius is a flat histogram with no radius-by-element cross-tab, so "every sized control" is not a countable fact)`. `rounded-full` (162) is *only* for pills, avatars, dots and spinners. `--radius-2xl` / `--radius-3xl` ship as tokens and have **zero** uses.

6. **`gap-2` between things, `px-3` inside things.** `gap-2` (8px) is the most-used utility in the whole capture at **1,572** — more than every other gap combined — and `px-3` (12px) is the horizontal padding of a control at **890**. The gap *inside* a control is the tighter `gap-1.5` (**75**) — see row 7. Import a 16/24px rhythm from another system and it will not read as Cloudflare. `OBSERVED(n=1572 gap-2 / n=890 px-3 / n=75 gap-1.5, pages=[all 8])`

7. **Icons are 16px (`size-4`) inside controls, 12px (`size-3`) for carets and dense chrome.** `icons.sizesByUse` → 12px ×196 (mostly the sidebar caret), 16px ×42, 18px ×13, **20px ×1**. The dominant draw style is `fill` (317 vs 35 stroke). Do not drop a 20px icon next to 13px text. `OBSERVED(n=476 svg uses, pages=[all 8])`

8. **A page title is `<h1>` + `text-3xl` + `font-semibold`** — and it is the system's **only responsive type pair** (`text-xl md:text-3xl` on the dashboard root). Headings are **9 elements across 8 pages** (h1 ×4, h2 ×2, h3 ×3); this is a dense admin UI where heading type is a rounding error. `OBSERVED(n=9 heading elements: h1>text-3xl 3, h1>text-xl 1, h2>text-2xl 1, h2>text-base 1, h3>text-lg 3, pages=[all 8])`

9. **Field labels and inputs are `text-base` (14px), not `text-sm`.** shadcn ships `text-sm` on `Label`/`Input` — patch the primitive. And remember `text-base` is **14px** here, not 16. `OBSERVED(n=4 label>text-base + 4 input>text-base, pages=[all 8])`

10. **At most one primary (emphasis) button per view; zero is normal.** The 8 pages carry **88 deduped buttons** (≈11 per view) — colour is spent on roughly one in twelve. `DERIVED(from=facts.json usage.elementTotalsDeduped.button=88 + usage.pageCount=8 + components/buttons.md; facts.json has NO variant counts — usage.variantClasses = {})`

11. **The accent is an edge, not an area.** `--color-kumo-brand` (blue) belongs on a `focus-visible:` ring, a focused field border, an active indicator, and the one emphasis button — never as a page/card/banner fill. Note the split: `bg-kumo-brand` is **blue**, `text-kumo-brand` is Cloudflare **orange** (`#f6821f`). They are not two forms of one colour. `DERIVED(from=tokens.json + capture/*.html class scan — bg-kumo-brand appears once across 8 pages)`

12. **Always ship the focus ring.** The system deletes the native outline on effectively every interactive node (`focus:outline-none` ×896 across the 8 pages), so the ring *is* the affordance. The recipe is two-layer: `focus:ring-kumo-focus/50` (any focus, quiet, neutral) + `focus-visible:ring-2 focus-visible:ring-kumo-brand` (keyboard only, loud). Shipping the outline-kill without the ring is a bug. `DERIVED(from=capture/*.html — 8 pages)`

13. **Never hardcode a hex, and never reach into a primitive.** Type `--color-kumo-*` for surfaces/borders/rings and `--text-color-kumo-*` for ink. The `--cf-*` ramps (136 tokens) and `--color-<hue>-<step>` primitives are **theme-invariant** — a component built on one will not re-theme when `[data-mode=dark]` flips. `DERIVED(from=tokens.json — 551 tokens, 4 themes)`

14. **Motion is fast and it is optional.** The default transition is **100ms** (`--default-transition-duration: .1s`); observed durations cluster at **200ms** (n=67); the dominant easing is plain `ease` (n=304). The capture ships **41** `prefers-reduced-motion` rules — honour it. `OBSERVED(n=41 reduced-motion rules, pages=[all 8])`

---

## Decision cheat-sheet

Situation → what to use. Every name below is real: a component in [`../components/`](../components), a token in [`tokens.json`](../tokens.json), or a class in `_classes.json`.

| # | Situation | Component / element | Type class | Geometry + token | Provenance |
|---|---|---|---|---|---|
| 1 | **Page title** | `<h1>` in the titled page header | `text-3xl font-semibold` (`text-xl md:text-3xl` on a dashboard root) | `text-kumo-default` | `OBSERVED(n=4, pages=[api-tokens, audit-log, workers-and-pages, home-overview])` |
| 2 | **Page description** | `<p>` under the title | `text-base` — **not** `text-sm` | `text-kumo-subtle`, one line | `OBSERVED(n=3, pages=[api-tokens, audit-log, workers-and-pages])` |
| 3 | **Section header** (page body) | `<h2>` | `text-2xl font-semibold` — **rare**, prefer a card heading | `text-kumo-strong` | `OBSERVED(n=1, pages=[all 8])` |
| 4 | **Card / panel heading** | `<h3>` | `text-lg font-semibold` (16px) | `text-kumo-strong` | `OBSERVED(n=3, pages=[all 8])` |
| 5 | **Field label** | `<label>` | `text-base` (14px) | `--text-color-kumo-default` | `OBSERVED(n=4, pages=[all 8])` |
| 6 | **Text field** | `Input` | `text-base` | `h-9` · `px-3` · `rounded-lg` · `bg-kumo-control` · `focus-within:ring-kumo-focus/50` on the **wrapper** | `OBSERVED(n=15 deduped inputs, pages=[all 8])` |
| 7 | **Primary action** | Button — **`emphasis`**, ≤1 per view | `text-base font-medium` | `h-9 px-3 gap-1.5 rounded-lg` (the md rung; `gap-2`/`px-4` belong to the `h-10` lg rung) · `--kumo-button-emphasis-*` (a `color-mix()` off brand, **not** a flat `bg-kumo-brand`) · label = literal white | `DERIVED(from=components/buttons.md md/default recipe + capture/*.html; usage.variantClasses = {})` |
| 8 | **Secondary action** (partner to the primary — Cancel, Back) | Button — **`secondary`** | `text-base` | `h-9` · `ring ring-kumo-line` · `bg-kumo-base` | `DERIVED(from=components/buttons.md)` |
| 9 | **Everything else clickable** | Button — **`ghost`** (the real default) | `text-sm` at `h-8`, `text-base` at `h-9` | `not-disabled:hover:bg-kumo-tint` | `DERIVED(from=components/buttons.md; ghost outnumbers emphasis ~4.6:1)` |
| 10 | **Row / toolbar action** | Button — `ghost`, compact | `text-sm` (13px) | **`h-8`** · `px-3` · `rounded-lg` | `OBSERVED(n=24 h-8 controls, n=8 h-8\|text-sm pairs, pages=[all 8])` |
| 11 | **Icon-only action** | Icon button | **none** — it carries no text class | **square** `size-8`/`size-9` + `size-4` svg · `aria-label` required · `focus-visible:ring-inset` | `DERIVED(from=facts.json squareBoxes + components/buttons.md)` |
| 12 | **Navigate somewhere** | `<a>` / `LinkButton` | `text-sm` | `no-underline!` + the button recipe if it must look like one; `h-8`/`h-9` ladder applies | `OBSERVED(n=137 deduped links vs 88 buttons; a > text-sm = 632, pages=[all 8])` |
| 13 | **Nav item (sidebar)** | Sidebar nav row | `text-sm` | **No focus ring** — focus is `focus-visible:bg-(--sidebar-active-bg)` + `text-kumo-strong`; sub-menu indent `pl-7` | `DERIVED(from=capture/*.html)` + `OBSERVED(n=176 pl-7)` |
| 14 | **Lifecycle / metadata label** ("Beta", "New") | Badge — **dashed** | 11px, `rounded-full` | 1px dashed `--color-kumo-line` · `--text-color-kumo-strong` | `OBSERVED(n=136 raw / 17 deduped, pages=[all 8])` |
| 15 | **Live row state** ("Active", "On") | **Dot badge** — neutral chip, colour in the 6px dot | `text-sm` | `bg-kumo-control` + ring + `shadow-xs`; dot = `--color-kumo-success` / `-warning` / `-danger` | `DERIVED(from=components/badges-status.md + capture/*.html — facts.json has no badge-shape breakdown, and perPage.badge is a flat 17 on all 8 pages, so no per-page attribution exists)`; **which intent is `PRESCRIPTIVE` — `usage.statusIntent = {}`** |
| 16 | **Status chip with intent** | Badge — **subtle** + intent | `text-sm` | `bg-kumo-<intent>-tint` + `text-kumo-<intent>` | `PRESCRIPTIVE — status intent was not exercised on any captured page (usage.statusIntent = {})` |
| 17 | **Explain an icon** | **Tooltip** — text only, never interactive | `text-xs` | Overlay shadow: `0 0 1px .5px var(--color-kumo-shadow-edge), 0 1px 2px var(--color-kumo-shadow-drop)` | `OBSERVED(n=27 deduped triggers, pages=[all 8])` |
| 18 | **Secondary controls in place** (filters, date range) | **Popover** | `text-sm` | `bg-kumo-elevated` · `z-50` — raise it explicitly inside a dialog | `DERIVED(from=capture/*.html; facts.json carries no popover count)` |
| 19 | **Transient message** (async result) | **Toast** | `text-sm` | `--z-index-toast` (above modal + drawer); `slide-up` / `toast-bump` keyframes exist | `PRESCRIPTIVE — CSS + keyframes ship, but zero Toasts rendered in the captures` |
| 20 | **Persistent page condition** (billing overdue, zone paused) | **Banner** | `text-sm` | `--color-kumo-banner-info` / `--color-kumo-banner-warning` — **only these two intents exist**; a success/danger banner would be an invented fill | `OBSERVED(n=2 banner tokens)` + `PRESCRIPTIVE(intent beyond info/warning)` |
| 21 | **Blocking confirm** (destructive, irreversible) | **Modal / Dialog** | body `text-sm`, title `text-lg` | `px-6 pb-6` · `rounded-lg` · `--z-index-modal` · actions = `h-9`, primary right | `OBSERVED(n=8 px-6 / n=8 pb-6, pages=[all 8])`; **beware: `elementTotalsDeduped.dialog = 25` is mostly the OneTrust cookie widget, not this system** |
| 22 | **Key / metric text** (a stat on a card) | Card + metric | `text-lg`/`text-2xl` + `font-semibold` + **`tabular-nums`** | `text-kumo-strong`; label above in `text-xs` + `text-kumo-subtle` | `DERIVED(from=_classes.json — .tabular-nums is the only numeric utility compiled)`; **metric scale itself is `PRESCRIPTIVE` — no metric type class is isolated in facts.json** |
| 23 | **ID, hash, timestamp** | Inline mono | `font-mono text-sm` (IDs) / `font-mono text-xs tabular-nums` (timestamps) | `truncate` on IDs | `DERIVED(from=capture/workers-and-pages.html, audit-log.html — family utilities are not tallied in facts.json)` |
| 24 | **Helper / caption / count** | `<span>` / `<p>` | `text-xs` (12px — the **floor**) | `text-kumo-subtle` | `OBSERVED(n=29, pages=[all 8])` |
| 25 | **Keyboard shortcut** | `<kbd>` | `font-sans text-xs/4` — `font-sans` is **mandatory** (UA default is mono) | `rounded-md` | `OBSERVED(n=8, pages=[all 8])` |
| 26 | **Table header / body cell** | `Table` | `th` → `text-sm font-medium`; `td` → `text-sm` | Header row is `h-11` — a **row**, not a control | `OBSERVED(n=7 th + 1 td, pages=[all 8])` |
| 27 | **Switch sibling views of a page** | **Tabs** (underline) | `text-sm` | Tabs are the exception, not the rule — 10 deduped, on 3 of 8 pages | `OBSERVED(n=10, pages=[audit-log, billing, members])` |
| 28 | **Switch mode/filter on the same data** | **Segmented** | `text-sm` | `h-9` indicator · `rounded-lg` | `DERIVED(from=components/tabs-segmented.md)` |
| 29 | **Group heterogeneous content** | **Card** | heading `text-lg`, body `text-sm` | `p-4` · `rounded-lg` · `bg-kumo-base` · `ring ring-kumo-line` | `OBSERVED(n=18 p-4, pages=[all 8])` |
| 30 | **Page column** | Page `<main>` / `<header>` | — | `px-6 md:px-8 lg:px-10` · `max-w-350 mx-auto` · breakpoints 640 / 768 / 1024 / 1280 | `DERIVED(from=spacing-layout.md §5.4)` + `OBSERVED(n=720/615/435/186 gated rules)` |
| 31 | **1-of-N value picker** | **Select** (custom trigger, never native `<select>`) | `text-base` | Mirror the `Input` geometry: `h-9 px-3 rounded-lg` | `PRESCRIPTIVE — select is in notObserved[]; zero rendered on any page` |
| 32 | **Long free text** | **Textarea** | `text-base` | `px-3 py-2 rounded-lg`, same ring/focus as `Input` | `PRESCRIPTIVE — textarea is in notObserved[]; zero rendered` |
| 33 | **Binary toggle** | **Switch** / **Radio** / **Checkbox** | `text-base` label | — | `PRESCRIPTIVE — Switch and Radio are in notObserved[]; the checkbox is ALSO unobserved for design purposes (all 9 deduped are OneTrust cookie-consent vendor markup — see` [`usage/components-when-to-use.md`](usage/components-when-to-use.md) `§4). All three are PRESCRIPTIVE.` |
| 34 | **Empty state** | Card body | heading `text-lg`, copy `text-sm` | Action = **`h-9` ghost/secondary**, not a hero | `PRESCRIPTIVE — no empty state is rendered in the captures` |

**34 rows.** Rows 15–16, 19, 22, 31–34 are the honest gaps: the system's CSS supports them, the captures never exercised them.

---

## DO / DON'T — the short list

**DO**
- For a **control**, reach for `h-9` + `text-base` + `px-3` + `gap-1.5` + `rounded-lg`, and only deviate on purpose. `OBSERVED(n=8 for h-9|text-base; px-3=890, gap-1.5=75, rounded-lg=946, pages=[all 8])`
- `text-sm` is the default **body/table** type class — `OBSERVED(n=914 of 1060)` — but it never pairs with `h-9` (see DON'T). `gap-2` `OBSERVED(n=1572)` is the gap **between** adjacent things, never inside a control.
- Give the one important action the **emphasis variant**, not extra height. `DERIVED(from=components/buttons.md)`
- Pair `focus:outline-none` with a ring, in the same class string, every time. `DERIVED(from=capture/*.html)`
- Take colour from `--color-kumo-*` (surface/edge) and `--text-color-kumo-*` (ink). `DERIVED(from=tokens.json)`

**DON'T**
- Don't assume `text-base` is 16px — it is **14px**, and `text-sm` is **13px**. `DERIVED(from=tokens/typography.css)`
- Don't pair `h-9` with `text-sm` — that combination occurs **zero** times. `OBSERVED(n=0)`
- Don't build a 48px hero button off `h-12` — `h-12` is a row height. `DERIVED(from=facts.json)`
- Don't paint an area in `--color-kumo-brand`, and don't use `text-kumo-brand` (orange) as body ink. `DERIVED(from=tokens.json)`
- Don't cite `textarea` / `select` / `radio` / `switch` as "how Cloudflare does it" — they were never rendered. `OBSERVED(n=0)`

---

## The six section docs

| Doc | What it decides for you |
|---|---|
| [`usage/typography-usage.md`](usage/typography-usage.md) | Role → type class. The `text-sm` default, the **13/14/16px** re-tuned scale, and the button-label ↔ **real** control-height pairing. |
| [`usage/color-semantics-usage.md`](usage/color-semantics-usage.md) | Which surface nests on which, the ink ladder, and why the brand accent is an **edge, not a fill**. Flags the empty `statusIntent`. |
| [`usage/spacing-layout-usage.md`](usage/spacing-layout-usage.md) | Which control-height rung, which gap, which padding pair, and the one-radius rule. Untangles the `controlHeights` vs `rawControlHeightClasses` trap. |
| [`usage/components-when-to-use.md`](usage/components-when-to-use.md) | Button vs link, input vs select vs menu, badge vs dot, tooltip vs popover vs toast vs banner vs modal, tabs vs sidebar, table vs card vs list. |
| [`usage/interaction-states.md`](usage/interaction-states.md) | The two-layer focus ring, hover/active/disabled/loading/invalid conventions, and the motion budget. |
| [`usage/page-patterns.md`](usage/page-patterns.md) | How a page is composed: the fixed shell, the content column, the **three** page-header variants, and the four page archetypes. |

## See also

- [`typography.md`](typography.md) · [`colors.md`](colors.md) · [`spacing-layout.md`](spacing-layout.md) · [`iconography.md`](iconography.md) · [`elevation-motion.md`](elevation-motion.md) · [`fonts.md`](fonts.md) — the foundation reference (what each value *is*)
- [`../components/`](../components) — per-component anatomy and recipes
- [`../tokens.json`](../tokens.json) · [`../tokens/`](../tokens) — the values themselves
- [`../README.md`](../README.md) — adoption (Tailwind v4 + shadcn/ui bridge)
