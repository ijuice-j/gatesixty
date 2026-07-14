# Components — when to use what

The **decision layer** for `cloudflare-dashboard` (`dash.cloudflare.com`). The token files say
*what the values are*; `components/*.md` say *how each piece is built*. This page says **which piece
to reach for**, and how many of it a view is allowed to have.

Hub: [`../usage-guidelines.md`](../usage-guidelines.md) · Foundations:
[`../typography.md`](../typography.md) · [`../colors.md`](../colors.md) ·
[`../spacing-layout.md`](../spacing-layout.md) · [`../iconography.md`](../iconography.md) ·
[`../elevation-motion.md`](../elevation-motion.md)

---

## 0. How to read this page

Every rule carries **exactly one** provenance tag:

| Tag | Meaning |
|---|---|
| `OBSERVED(n=…, pages=[…])` | A count or element that exists in `capture/facts.json`. |
| `DERIVED(from=…)` | Logically follows from the token map / class map / component doc named. |
| `PRESCRIPTIVE` | Best practice **not** evidenced by the captures. Said out loud, never disguised. |

**Two things `facts.json` does not contain** — read before you trust any variant number:

1. `usage.variantClasses` is **`{}`** and `usage.statusIntent` is **`{}`**. There is *no*
   `buttonClasses` / variant-frequency map in the fact bundle. Button-variant and status-intent
   ordering below is therefore tagged `DERIVED`, never `OBSERVED`.
2. `usage.notObserved` = **`["textarea", "select", "radio", "switch"]`**. Every rule about those four
   is `PRESCRIPTIVE`.

**The size trap, stated once.** Read control heights from `usage.controlHeights` (square icon/avatar
boxes already excluded) — **never** from `usage.rawControlHeightClasses`. The raw map's most common
height is `h-12` (44 uses) and `h-12` **is not a control height at all**; the real control heights are
only `h-8` (24), `h-9` (32), `h-10` (2). A square `w-N h-N` / `size-N` box is an **icon button**, not
a text-control size. `OBSERVED(n=3 real heights vs 6 raw height classes, pages=[all 8])`

---

## 1. The 20-second table

| You want to… | Reach for | Not for |
|---|---|---|
| Trigger the one action this view exists for | **Button — `emphasis`**, max 1 per view | Anything you'd do more than once per page |
| Everything else clickable in the chrome | **Button — `ghost`** (the default) | The page's main action |
| Go somewhere / change the URL | **Link (`<a>` / `LinkButton`)** | An action that mutates state |
| Take an unbounded value | **Input** | A known 1-of-N set |
| Take a value from a known set | **Select** (custom trigger, never `<select>`) | A list of *actions* |
| Fire actions from one trigger | **Menu** | Picking a value |
| Show lifecycle / metadata on a nav item | **Badge — dashed** | Live state |
| Show live row state | **Dot badge** (colour in the dot) | Marketing emphasis |
| Explain an icon | **Tooltip** | Anything interactive |
| Offer secondary controls in place | **Popover** | A decision you must not skip |
| Force a decision | **Modal** | Async confirmations |
| Report an async result | **Toast** | Persistent site conditions |
| State a persistent page condition | **Banner** (info / warning only) | Transient results |
| Switch sibling views of one page | **Tabs (underline)** | Filtering the same dataset |
| Switch mode/filter on the same data | **Segmented** | Cross-section navigation |
| Navigate the product | **Sidebar nav** | In-page view switching |
| Compare many records on many fields | **Table** | 1–2 fields per row |
| Scan many records on 1–2 fields | **List** | Heterogeneous content |
| Group heterogeneous content / a metric | **Card** | A dense comparable grid |

---

## 2. Buttons

### 2.1 Variant order — by real frequency

`facts.json` carries **no** variant map (`usage.variantClasses = {}`), so this order comes from the
57 `data-kumo-component="Button" | "LinkButton"` nodes in the captured DOM, as tabulated in
[`../../components/buttons.md`](../../components/buttons.md) §"Variant frequency".

| Rank | Variant | Instances | Use when | Avoid when |
|---|---|---|---|---|
| 1 | **ghost** | **32** (56%) | Default for *every* button. Toolbar actions, row actions, icon buttons, triggers, "Ask AI", filters. | It is the single action the page exists for. |
| 2 | **secondary** | **16** (28%) | The action that sits *next to* the emphasis button (Cancel, Back, "Manage"), or a card-level action that needs an edge. | You already have ≥2 secondaries competing in one cluster — demote to ghost. |
| 3 | **emphasis** (primary) | **7** (12%) | The one action the view exists for. See the count rule below. | Anything repeated per row, per card, or per toolbar. |
| 4 | **outline** | **2** (4%) | Rare — a bordered action on a busy/tinted surface where ghost would disappear. | You could use secondary. It's a 4%-of-the-system variant; treat it as an exception. |

`DERIVED(from=components/buttons.md + capture/*.html; facts.json has no variant counts)`

> **The chrome is quiet by design.** Ghost outnumbers emphasis **4.6 : 1**. Colour is spent almost
> exclusively on the one emphasis button. `DERIVED(from=components/buttons.md)`

### 2.2 How many primary buttons per view

- **≤ 1 emphasis button per view. Zero is normal.**
  7 emphasis instances across **8 pages** — under one per page — while the same 8 pages carry
  **88 deduped buttons** (≈11 per view). So ~1 button in 12 is allowed to be coloured.
  `DERIVED(from=components/buttons.md (emphasis=7) + facts.json usage.elementTotalsDeduped.button=88, usage.pageCount=8)`
- **The tallest text button is `h-10` (40px), and it occurs twice in the entire capture.**
  `usage.controlHeights: {h-8: 24, h-9: 32, h-10: 2}`. `h-10` is a 2-instance outlier, not a tier.
  There is no height-to-variant evidence — `usage.variantClasses` is `{}` — so do not tie it to the
  emphasis button. **Emphasis is a variant job, never a height job.**
  `OBSERVED(n=2, pages=[all 8 combined])`
- **There is no hero/CTA size.** No button in the capture uses `text-lg` or larger — buttons only
  ever carry `text-sm` (190), `text-base` (31), `text-xs` (13). Do not invent a marketing-scale CTA.
  `OBSERVED(n=234 button type-class uses, pages=[all 8])`

**DO** — one emphasis in the page header, ghost everywhere else, secondary only as its partner.
**DON'T** — put an emphasis button in a table row, a card footer, *and* the header. That is three
primaries; the data supports fewer than one.

### 2.3 Which height

| Height | Real uses | Type it pairs with | Use when |
|---|---|---|---|
| `h-9` (36px) | **32** | `text-base` (14px) — 8 pairings | **Default.** Page-level and form-level actions. |
| `h-8` (32px) | **24** | `text-sm` ×8 **and** `text-base` ×8 | Dense rows: toolbars, table rows, filter bars, search triggers. |
| `h-10` (40px) | **2** | `text-base` only | Almost nothing. Two instances in the whole capture; not a size in your vocabulary. |

`OBSERVED(n=58 controls, pages=[all 8])` — `usage.controlHeights` + `usage.buttonHeightTypePairs`.
Note `h-8` is the only height that takes **both** type sizes; `text-sm` (13px) is the compact pairing.

Links styled as buttons follow the same ladder: `<a>` carries `h-8` ×8, `h-9` ×6.
`OBSERVED(n=14, pages=[all 8])`

### 2.4 Button vs link

Links outnumber buttons: **137 deduped links vs 88 deduped buttons**, and `a > text-sm` alone is
**632** of the 914 `text-sm` uses in the system. `OBSERVED(n=137/88, pages=[all 8])`

- **`<a>` / `LinkButton`** when the result is a URL. Keep `no-underline!` + the button recipe if it
  must *look* like a button. `DERIVED(from=components/buttons.md §1.4)`
- **`<button type="button">`** when the result mutates state or opens an overlay. Every observed
  button sets `type` explicitly. `DERIVED(from=components/buttons.md §1.1)`

**DON'T** ship a `<div onClick>`; **DON'T** ship an `<a href="#">` for an action.

### 2.5 Icon button vs text button (the disambiguation trap)

An icon-only button is **the same size cluster plus `p-0 justify-center size-N`**, where `size-N`
equals the control height (`size-6.5` / `size-8` / `size-9`). It is a **shape modifier, not a size**.
`facts.json` lists only `usage.squareBoxes = {"w-6 h-6": 2}` and `usage.iconWidths = {"w-6": 2}` —
i.e. square boxes are rare and are *not* the button-height signal.
`OBSERVED(n=2 square boxes, pages=[all 8])` + `DERIVED(from=components/buttons.md §1.3)`

| Use an icon button when | Use a text button when |
|---|---|
| The action is universally glyphable (close, copy, more, refresh) **and** you can attach an `aria-label` — non-negotiable. (`facts.json` carries **no icon-only-button tally**, so there is no count to cite here; `usage.squareBoxes = {"w-6 h-6": 2}` is the only square-box datum.) | The action is destructive, unfamiliar, or the primary action of the view. |
| It lives in a dense row/toolbar (`size-8`). | The label carries the meaning. |

In-button icons are **16px** (`size-4`), `fill="currentColor"` — matching the system's
`dominantStyle: "fill"` and its 16px standard size (42 uses; the 12px bucket at 196 uses is nav/badge
chrome, not buttons). `OBSERVED(n=42 @16px / 196 @12px, pages=[all 8])` + `DERIVED(from=components/buttons.md)`

**DON'T** wrap an icon button in a tooltip *and* omit the `aria-label` — the tooltip is not an
accessible name.

---

## 3. Input vs Select vs Menu

| | **Input** | **Select** | **Menu** |
|---|---|---|---|
| Answers | "What value?" — unbounded | "Which of these N?" | "Do what?" |
| Evidence | `input` 71 raw / **15 deduped**; only 4 are real text fields, all inside a `data-slot="input-group"` | `<select>` tag = **0**, but `data-kumo-component="Select"` ×3 as `<button role="combobox">` | `menu` 25 raw / **11 deduped** |
| Tag | `OBSERVED(n=15, pages=[all 8])` | `OBSERVED(n=0 native <select>, pages=[all 8])` + `DERIVED(from=components/forms.md)` | `OBSERVED(n=11, pages=[all 8])` |

- **Input** when the value space is open (names, tokens, URLs, search). The observed shape is always
  an **input group** with a leading addon (icon/prefix) — not a bare `<input>`.
  `OBSERVED(n=4 input groups, pages=[all 8])`
- **Select** when the set is known, small, and you are choosing **a value that will be submitted**.
  Build it as a `<button role="combobox">` + visually-hidden `<input>` — the system never ships a
  native `<select>`, so `select: 0` in `notObserved[]` is a *false negative*, not an absence of the
  pattern. `DERIVED(from=components/forms.md §Select)`
- **Menu** when the items are **actions or destinations**, not a value: row overflow ("⋯"), account
  switcher, "Add" splits. Menus are portal-mounted and were **closed at capture**, so panel geometry
  is reconstructed; triggers are fully observed. `DERIVED(from=components/menus-dropdowns.md §0)`

**Which of Select vs Menu:** if the trigger's label *changes to reflect the current choice*, it is a
Select. If the trigger's label is constant ("Actions", "⋯"), it is a Menu. `PRESCRIPTIVE`

**Search + keyboard hint** → input group with a trailing `<kbd>`; `<kbd>` is a real, observed part at
`text-xs/4` (8 uses). `OBSERVED(n=8, pages=[all 8])`

**DO** put the icon in the input group's leading addon slot.
**DON'T** replace a Select with a Menu because "it opens a panel" — a Menu has no value, no
`role="combobox"`, and nothing to submit.

See [`../../components/forms.md`](../../components/forms.md) and
[`../../components/menus-dropdowns.md`](../../components/menus-dropdowns.md).

---

## 4. Checkbox vs Radio vs Switch — all three are PRESCRIPTIVE

> **None of these three was observed as a design-system component.**
> `usage.notObserved` contains **`radio`** and **`switch`** (`n=0` on all 8 pages). And the
> `checkbox: 72 raw / 9 deduped` count is a **trap**: every one of them is a **OneTrust
> cookie-consent** widget (`.ot-switch`, `#onetrust-*`) injected by a third-party script — not
> Cloudflare's. `OBSERVED(n=0 radio, n=0 switch, pages=[all 8])` +
> `DERIVED(from=components/forms.md §"The checkbox trap")`

Everything in this section is therefore `PRESCRIPTIVE` and should be reviewed, not assumed:

| Component | Use when | Avoid when |
|---|---|---|
| **Checkbox** | Independent binary choices; **multi-select in a table** (select-all header + per-row); "I agree". Applies on submit. | The choice takes effect immediately with no submit — use a Switch. |
| **Radio** | 1-of-N where all N must be **visible and comparable** (2–5 options, e.g. plan tiers, scope choices). | N > 5, or options are long strings — use a Select. |
| **Switch** | A setting that takes effect **immediately** and is on/off (notifications on, feature enabled). | The change needs a Save button — use a Checkbox. |

All three are `PRESCRIPTIVE` — not observed in the captures.

**DON'T** style a Switch out of the OneTrust `.ot-switch` markup that appears in the capture: it is
untokenized vendor CSS and contradicts the house style.
**DO** build them on the observed control surfaces (`--color-kumo-control`, `--color-kumo-line`,
`--color-kumo-brand` for the on-state) so the `dark` / `fedramp` / `kumo` themes keep working.
`DERIVED(from=tokens.json)`

---

## 5. Badge vs Status-pill vs Dot

Badges are real and everywhere: **136 raw / 17 deduped, on all 8 pages**.
`OBSERVED(n=136 raw / 17 deduped, pages=[all 8])`

The radius numbers are a **separate** raw count, not a cross-tab: `rounded-full` is 162 uses
site-wide, `rounded-lg` 946. `OBSERVED(n=162 rounded-full, n=946 rounded-lg, pages=[all 8])`. The
claim *"every badge is a full pill, and badges never take `rounded-lg`"* is a radius-by-element
cross-tab that `facts.json` **does not contain** — it comes from the component doc:
`DERIVED(from=components/badges-status.md)`.

**Two more things the bundle cannot tell you about badges**, so read every row below with them in mind:

1. **`usage.variantClasses` is `{}` and `usage.statusIntent` is `{}`.** There is no badge shape,
   label, or intent breakdown anywhere in the bundle. Which *shape* and which *intent* to pick is
   `DERIVED` or `PRESCRIPTIVE`; only the token values are exact.
2. **`usage.perPage` reports `badge: 17` on every one of the 8 pages** — badge counts are not
   page-resolvable. **No row below can honestly say "this badge shape appears on *that* page."**

| Shape | Recipe | Use when | Avoid when |
|---|---|---|---|
| **Dashed badge** (`--dashed`) | transparent · 1px **dashed** `--color-kumo-line` · `--text-color-kumo-strong` · 11px | **Lifecycle / metadata on a nav item** — the sidebar's `Beta` / `New` / `Alpha` labels. Badge volume overall is `OBSERVED(n=136 raw / 17 deduped, pages=[all 8])`; the shape-and-label attribution is `DERIVED(from=capture/*.html class scan + components/badges-status.md)` — `facts.json` has no badge shape or label data. | Anything that changes at runtime. It reads as a permanent label. |
| **Dot badge** (`--elevated`) | chip on `--color-kumo-control` + 1px ring + `shadow-xs`; **colour lives in the 6px dot**, not the chip | **Live row state in a table/list** (`Active`, `On`). The neutral chip stays legible on any row fill; the dot carries the semantics. `DERIVED(from=capture/*.html class scan + components/badges-status.md)` | A page-level condition — that's a Banner. |
| **Subtle pill** (`--subtle` + intent) | `*-tint` fill + `--text-color-kumo-*` text, 24px tall | **Informational / navigational chips** — the shape appears as an `<a>` to docs at `--info`. Also the **default for status intents**. `DERIVED(from=capture/*.html class scan + components/badges-status.md)` | You need it to shout — see below. |
| **Bare dot** (no chip) | `size-1.5 rounded-full` + `--color-kumo-success` / `-warning` / `-danger` | Space is too tight for a chip (a nav item, a tab, an avatar corner). Must be paired with adjacent text or an `aria-label`. `PRESCRIPTIVE` | It is the only indicator of a **failure** — a bare dot with no label is unreadable. |
| **Solid** (`--solid`) | accent at full strength | Almost never. Utilities exist but the pairing is `PRESCRIPTIVE` — not observed on any badge. | Status. Status is `--subtle`. Solid competes with the emphasis button. |

**DO** use exactly **one** style class + **one** intent class — intents publish colour into
`--ds-badge-accent` / `--ds-badge-tint`, style classes decide how to paint it (additive `n+m`, not
`n×m`). `DERIVED(from=components/badges-status.md §"Style variants")`
**DON'T** hardcode `bg-green-500` for the dot even though two observed shapes do — route it through
`--color-kumo-success` or the `fedramp` / `kumo` themes break.
`DERIVED(from=components/badges-status.md)`

See [`../../components/badges-status.md`](../../components/badges-status.md).

---

## 6. Tooltip vs Popover vs Banner vs Toast vs Modal

Sort by **how much of the user's agency you are taking**.

| | Persistence | Blocks? | Interactive content? | Evidence |
|---|---|---|---|---|
| **Tooltip** | Transient (hover/focus) | No | **Never** | `tooltip` 34 raw / **27 deduped** — all *triggers*; popups are portal-mounted and were closed at capture. `OBSERVED(n=27, pages=[all 8])` |
| **Popover** | Transient (click, dismissible) | No | Yes | `data-kumo-component="Popover"` ×1; trigger has `aria-haspopup="dialog"`. `DERIVED(from=capture/*.html — data-kumo-component="Popover" ×1; facts.json carries no popover count)` |
| **Toast** | Transient (auto-dismiss) | No | One action max | Full CSS + stack math + `slide-up`/`slide-down`/`toast-bump` keyframes exist; **zero `data-kumo-component="Toast"` rendered**. `DERIVED(from=components/feedback-overlays.md §5)` — usage is `PRESCRIPTIVE` |
| **Banner** | **Persistent** until resolved | No | Yes (a link/action) | `--color-kumo-banner-info`, `--color-kumo-banner-warning` — that is the **whole** banner token set. `OBSERVED(n=2 banner tokens)`. The layout var `--preview-banner-height` is *not* a token in the bundle: `DERIVED(from=_classes.json — a runtime-written var, not a token in facts.json)` |
| **Modal / Dialog** | Persistent until answered | **Yes** | Yes | `data-kumo-component="Dialog"` ×1 + a full legacy `@cloudflare/component-modal` tree. `OBSERVED` |
| **Drawer** | Persistent until dismissed | Yes (side sheet) | Yes | Full class string in the DOM (`z-[1150]`, `bg-kumo-overlay`, `border-l border-kumo-line`). `DERIVED(from=capture/*.html — facts.json carries no drawer count either)` |

> **The dialog trap.** `elementTotalsDeduped.dialog = 25` looks huge — but the `role="dialog"
> aria-modal="true"` node on **every** page is the **OneTrust cookie widget**
> (`#onetrust-pc-sdk`, `z-index: 2147483647`). It shares nothing with this design system.
> Do not read "25 dialogs" as "this product loves modals."
> `DERIVED(from=components/feedback-overlays.md §"Two traps")`

### Choose by asking, in order

1. **Is it just a label for something already on screen?** → **Tooltip.** Text only. No links, no
   buttons, no forms — if a user would want to click inside it, it is a Popover.
2. **Does the user need extra controls *in place*, without leaving the page?** → **Popover**
   (filters, a date range, a small form). Dismissible on outside-click / Esc.
3. **Is it the result of something the user already did, and they can ignore it?** → **Toast.**
   Stack it; auto-dismiss; ≤1 action. `PRESCRIPTIVE` (never rendered in the capture).
4. **Is it a condition of the page that stays true until someone fixes it?** → **Banner.** Only
   **info** and **warning** tokens exist — a "success banner" or "danger banner" is `PRESCRIPTIVE`
   and you'd be inventing the fill. Prefer a Toast for success and a Modal for danger.
5. **Must the user answer before anything else can happen?** → **Modal.** Destructive confirmations,
   irreversible steps.
6. **Is it a long form or a detail record that deserves the whole side of the screen?** → **Drawer**.

### DO / DON'T

- **DO** stack correctly. Token order: `--z-index-modal` < `--z-index-drawer` < `--z-index-toast`
  (a toast must be readable over a modal). Menus/popovers sit at `z-50` — **explicitly raise them if
  you render a menu inside a dialog.** `OBSERVED(n=3 z tokens)` + `DERIVED(from=components/menus-dropdowns.md §"Elevation & stacking")`
- **DO** reuse the one overlay elevation:
  `shadow-[0_0_1px_0.5px_var(--color-kumo-shadow-edge),0_1px_2px_var(--color-kumo-shadow-drop)]` —
  observed verbatim on every overlay. `OBSERVED`
- **DON'T** use a Modal for an async result — that's a Toast.
- **DON'T** use a Toast for a persistent condition (billing overdue, zone paused) — that's a Banner.
- **DON'T** put interactive content in a Tooltip. Ever.
- **DON'T** port `.__react_component_tooltip` — it is a legacy `react-tooltip` vendor artefact still
  shipping on the notifications page, untokenized and off-style.
  `DERIVED(from=components/feedback-overlays.md §2.6)`
- **DON'T** assume a scrim — **no backdrop rule and no `backdrop-filter` exists anywhere** in
  `_classes.json`. If you add one, you are adding it. `DERIVED(from=_classes.json)`, usage `PRESCRIPTIVE`.

See [`../../components/feedback-overlays.md`](../../components/feedback-overlays.md).

---

## 7. Tabs vs Sidebar-nav vs Segmented

`tab` = **10 deduped**, and only on **3 of 8 pages** (`audit-log` 4, `billing` 3, `members` 3).
Meanwhile `link` = **137 deduped**. **Navigation in this product is the sidebar; tabs are the
exception.** `OBSERVED(n=10 tabs / 137 links, pages=[audit-log, billing, members])`

| | Use when | Avoid when | Geometry |
|---|---|---|---|
| **Sidebar nav** | Moving between **product sections**. Persistent, hierarchical, changes the URL. The system's primary nav (`data-kumo-component="Sidebar"`); active state is a **surface** (`--sidebar-active-bg`), not a colour or a weight. | In-page view switching. | See [`../../components/navigation.md`](../../components/navigation.md) |
| **Tabs — underline** | **Sibling views of one page**: 2–6 peer panels, each with its own content (Overview / Events / Settings). Observed as the page nav on `audit-log`. | The choice is a *filter* over one dataset. | 2px `--color-kumo-brand` bar on a `--color-kumo-hairline` rule; tab = `rounded px-2 py-3 text-base`. One size only. `OBSERVED(pages=[audit-log])` |
| **Tabs — segmented** | **Mutually exclusive mode/filter on the same data** — a time range, a chart mode, a scope toggle. Short labels, ideally ≤4. Observed on `billing`, `members` (md) and `audit-log` (sm). | Cross-section navigation, or >4 items / long labels (the track can't scroll gracefully). | Track `bg-kumo-recessed`; thumb = `bg-kumo-base shadow-sm ring ring-kumo-line`. **sm** 26px (`h-6.5`, `text-xs`) · **md** 36px (`h-9`, `text-base`). `OBSERVED(pages=[audit-log, billing, members])` |

**The accent is blue.** The active indicator is `--color-kumo-brand` = blue. Cloudflare orange
(`#f6821f`) is `--text-color-kumo-brand`, a *text* token, and is **never** used by tabs. Don't
"correct" it. `DERIVED(from=tokens.json + components/tabs-segmented.md)`

**Sizing:** the segmented **md** track is `h-9` = the same 36px default control height as a button —
so a segmented control sits flush in a toolbar next to `h-9` buttons; use **sm** (26px) only in a
dense filter bar alongside `h-8`/`h-6.5` controls. `DERIVED(from=facts.json usage.controlHeights + components/tabs-segmented.md)`

**DO** make underline tabs real `<a>`s when each panel has a URL (the tab element in this system is
"a button *or* a link"). `DERIVED(from=components/tabs-segmented.md)`
**DON'T** nest tabs inside tabs; and **don't** use a segmented control as page navigation — it has no
affordance for "you are leaving this view".
**DON'T** ship a disabled tab: **not observed**; every `role="tab"` in the capture is enabled.
`PRESCRIPTIVE` if you need one.

---

## 8. Table vs Card vs List

None of these three is a named `kumo` component — they are ad-hoc utility compositions over the
surface system. The complete named-component set is `Sidebar`, `Button`, `LinkButton`, `Tabs`,
`Select`, `Breadcrumbs`, `Popover`, `Dialog`. `DERIVED(from=components/data-display.md §0)`

| | Use when | Avoid when | Evidence |
|---|---|---|---|
| **Table** | ≥3 **comparable** columns per record, and the user needs to **sort, select, or compare**. Audit logs, members, resource inventories. | Only 1–2 fields matter per row — a table's chrome costs more than it returns. | `elementTotalsDeduped.table = 2` (`members` canonical, `analytics` second). `OBSERVED(n=2, pages=[analytics, members])` |
| **List** | A **feed or resource list** — 1–2 fields plus a trailing action. Rows are `grid auto 1fr auto` at **48px**. | The user needs to compare values across records. | `<ul role="list" class="divide-y …">` with `role="listitem"` rows. `OBSERVED(pages=[home-overview])` |
| **Card** | **Heterogeneous** content: a metric tile, a summary panel, a grouped form section, an onboarding block. | You are wrapping every table row in a card. That's a list with extra shadows. | The `shadow-xs ring ring-kumo-line bg-kumo-base rounded-lg p-4` recipe appears 4×; `ring-kumo-line` 45×. `DERIVED(from=components/data-display.md)` |

**Decision rule:** *comparable fields ≥3 → Table. Comparable fields ≤2 → List. Not comparable at all
→ Card.* `PRESCRIPTIVE` (a synthesis of the three observed shapes).

**The surface is a ring, not a border.** Cards are `ring ring-kumo-line` + `shadow-xs`, radius
`rounded-lg` (946 uses site-wide — the default radius for every surface). Padding `p-4`.
`OBSERVED(n=946 rounded-lg, pages=[all 8])` + `DERIVED(from=components/data-display.md)`

**DO** give the list's content column `min-width: 0` — without it, `text-overflow: ellipsis` cannot
work inside the grid track and long titles blow out the row. `DERIVED(from=components/data-display.md §4)`
**DO** pair timestamps/IDs with `font-mono` + `tabular-nums` (observed on `audit-log`) so the gutter
stays rigid. `OBSERVED(pages=[audit-log])`
**DON'T** copy the source's accessibility gaps: its sortable `<th>` has a real sort `<button>` but
**no `aria-sort`**, and its progress bar has **no `role="progressbar"`**. Fix both.
`DERIVED(from=components/data-display.md §"Warnings")`
**DON'T** reach for an **Avatar** or a **Stepper** — **neither exists**. `img` deduped = 4, all vendor
logos/illustrations; the `size-4 rounded-full` circles in the capture are **loading placeholders**.
Zero `aria-current="step"` anywhere. Both are `PRESCRIPTIVE` — not observed in the captures.
`OBSERVED(n=4 img, pages=[all 8])`

See [`../../components/data-display.md`](../../components/data-display.md).

---

## 9. The four rules that outrank everything above

1. **`h-9` is the default control height (32 uses), `h-8` the dense one (24).** A new control that
   doesn't match one of them needs a reason. `OBSERVED(n=58, pages=[all 8])`
2. **`rounded-lg` is the default radius (946).** `rounded-full` (162) means "pill or dot".
   `rounded-md` (21) is the compact cluster only. `OBSERVED(pages=[all 8])`
3. **`text-sm` (914) is the workhorse; `text-base` (101) is the *larger* control type** — this system
   redefines the scale (`text-base` = 14px, `text-sm` = 13px, `text-xs` = 12px). Don't assume 16/14/12.
   `OBSERVED(n=1060 type-class uses — 1,062 minus the 2 `type-dark` hits, which are a react-tooltip
   colour variant, not a type class, pages=[all 8])` + `DERIVED(from=tokens.json)`
4. **`gap-2` (1572) is the default gap; `px-3` (890) the default inline padding.** Reach past them
   only in a card (`p-4`) or a section (`gap-3`/`gap-4`). `OBSERVED(pages=[all 8])`

---

## Appendix — what the fact bundle can and cannot tell you

| Question | Answer from `facts.json` |
|---|---|
| How frequent is each button variant? | **Cannot answer.** `usage.variantClasses = {}`. Use `components/buttons.md`. |
| Which status intent is most used on badges? | **Cannot answer.** `usage.statusIntent = {}`. |
| What are the real control heights? | `h-8` 24 · `h-9` 32 · `h-10` 2 (`usage.controlHeights`). **Not** `usage.rawControlHeightClasses`, whose top entry `h-12` (44) is not a control. |
| Which components were never exercised? | `usage.notObserved = ["textarea", "select", "radio", "switch"]` — plus, from the component docs: Toast (never rendered), Avatar, Stepper, code block, ANSI palette. |
| Are checkboxes real? | `checkbox: 72/9` — **all vendor (OneTrust)**. Treat the design-system checkbox as unobserved. |
