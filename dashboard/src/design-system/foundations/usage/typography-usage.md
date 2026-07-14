# Typography — usage guidelines

**When to reach for which type class.** The values live in [`../../tokens/typography.css`](../../tokens/typography.css) and the anatomy lives in [`../typography.md`](../typography.md) — this doc is only the *decision layer*: role → class, weight, and the button-label ↔ control-height pairing.

Hub: [`../usage-guidelines.md`](../usage-guidelines.md) · Faces & licensing: [`../fonts.md`](../fonts.md) · Icon sizes: [`../iconography.md`](../iconography.md)

---

## 0. Read this before you trust a number

**The type classes in this system are Tailwind `text-*` utilities. There is no `.type-*` namespace.** If you are looking for `.type-heading` / `.type-body`, it does not exist — and `type-dark` (which shows up in `typeClassTotals` ×2) is **react-tooltip's colour variant**, not a type class. Ignore it.
`DERIVED(from=_classes.json — .__react_component_tooltip.type-dark sets color/background only)`

Three counting rules that govern every `n` below:

| Rule | Why it matters |
| --- | --- |
| **`typeClassTotals` sums to 1,062; the real type total is 1,060.** | Subtract the 2 `type-dark` hits. All percentages here use **1,060**. |
| **Counts are RAW occurrences across 8 pages, not unique instances.** | The app shell repeats on 7+ pages (`shell.rawOccurrences` 5,963 → `dedupedOccurrences` 750; `link` 760 raw → 137 deduped). `a > text-sm` ×632 is *mostly the same sidebar, counted 8 times*. Use the counts for **ranking**, not for sizing a work estimate. |
| **`facts.json` tallies SIZE classes only.** | `font-*`, `tracking-*`, `leading-*`, `tabular-nums`, `truncate` are **not counted anywhere**. Their absence from `typeClassTotals` is *not* evidence of non-use — so every weight/numeric rule below is `DERIVED` or `PRESCRIPTIVE`, never `OBSERVED`. |

**Provenance shorthand.** `facts.json` aggregates type classes across all 8 captured pages without per-page attribution, so `pages=[all-8]` means the aggregate of `analytics, api-tokens, audit-log, billing, home-overview, members, notifications, workers-and-pages`.

---

## 1. The default: `text-sm`

> **Reach for `text-sm` (13px) unless you have a reason not to.** It is **914 of 1,060** type-class occurrences — **86%** of all typed text in the product.
> `OBSERVED(n=914, pages=[all-8])`

`text-base` is **not** the default — it is the *comfortable* size, and it is **14px, not 16px**. The whole bottom half of the scale is re-tuned down (`xs` 12 / `sm` **13** / `base` **14** / `lg` **16**). Every instinct from a stock Tailwind project is one notch too big here.
`DERIVED(from=tokens/typography.css + ../typography.md §3)`

Shares of the 1,060:

| Class | Size | Share | Count |
| --- | --- | --- | --- |
| `text-sm` | 13px | **86.2%** | 914 |
| `text-base` | 14px | 9.5% | 101 |
| `text-xs` | 12px | 2.7% | 29 |
| `text-xs/4` | 12px (16px box) | 0.8% | 8 |
| heading-sized type classes (`text-lg`/`xl`/`2xl`/`3xl`) † | 16–30px | **0.8%** | 8 |

† This row counts **classes**, not headings. The 9th heading element — `h2 > text-base` ×1, the "Sub-header inside a card" in §2 — carries a *body*-sized class, so it lives in the `text-base` row, not here.

`OBSERVED(n=1060, pages=[all-8])` — headings are **nine elements** in the entire capture (`h1` ×4, `h2` ×2, `h3` ×3). This is a dense admin UI: it is nearly all `text-sm`, and heading type is a rounding error. Design accordingly.

---

## 2. Role → class (from `typeByTag`)

Every row is assigned from the **actual class-on-element evidence** in `facts.json` → `usage.typeClassByTag`.

| Role | Use this | Element evidence | Provenance |
| --- | --- | --- | --- |
| **Page title** | `text-xl md:text-3xl` + `font-semibold` | `h1 > text-3xl` ×3, `h1 > text-xl` ×1 | `OBSERVED(n=4, pages=[all-8])` |
| **Section header** (h2) | `text-2xl` + `font-semibold` — **rare** | `h2 > text-2xl` ×1 | `OBSERVED(n=1, pages=[all-8])` |
| **Card / section heading** (h3) | `text-lg` (16px) + `font-semibold` | `h3 > text-lg` ×3 | `OBSERVED(n=3, pages=[all-8])` |
| **Sub-header inside a card** | `text-base` on `h2` — the *quiet* header | `h2 > text-base` ×1 | `OBSERVED(n=1, pages=[all-8])` |
| **Field label** | `text-base` (14px) — **not** `text-sm` | `label > text-base` ×4 | `OBSERVED(n=4, pages=[all-8])` |
| **Input text** | `text-base` (14px) — matches its label | `input > text-base` ×4 | `OBSERVED(n=4, pages=[all-8])` |
| **Eyebrow / group label** | `text-xs font-medium uppercase tracking-wide` + subtle tone | `p.text-xs.font-medium.uppercase.tracking-wide` (audit-log detail panel) — the **only** `uppercase` in 8 pages | `DERIVED(from=capture/audit-log.html; not tallied in facts.json)` |
| **Button label (default)** | `text-base` (14px) | `button > text-base` ×31 | `OBSERVED(n=31, pages=[all-8])` — see §4 |
| **Button label (compact)** | `text-sm` (13px) | `button > text-sm` ×190 | `OBSERVED(n=190, pages=[all-8])` — see §4 |
| **Button label (chrome/xs)** | `text-xs` (12px) | `button > text-xs` ×13 | `OBSERVED(n=13, pages=[all-8])` — see §4 trap |
| **Nav item / link** | `text-sm` | `a > text-sm` ×632, `a > text-base` ×24, `a > text-xs` ×1 | `OBSERVED(n=657, pages=[all-8])` |
| **Nav container** | `text-base` on the `<nav>`, children override to `text-sm` | `nav > text-base` ×7 | `OBSERVED(n=7, pages=[all-8])` |
| **Table header cell** | `text-sm` (+ `font-medium`) | `th > text-sm` ×7 | `OBSERVED(n=7, pages=[all-8])` |
| **Table body cell** | `text-sm`; set `text-base` once on the `<table>` and let cells override | `td > text-sm` ×1, `table > text-base` ×1 | `OBSERVED(n=2, pages=[all-8])` |
| **Body / prose** | `text-sm` for UI copy; `text-base` for a real paragraph block | `p > text-sm` ×4, `p > text-base` ×3, `p > text-xs` ×1 | `OBSERVED(n=8, pages=[all-8])` |
| **Inline text / generic wrapper** | `text-sm` | `span > text-sm` ×43, `div > text-sm` ×37, `div > text-base` ×25, `span > text-base` ×1 | `OBSERVED(n=106, pages=[all-8])` |
| **Helper / meta / caption** | `text-xs` + a subtle colour token | `div > text-xs` ×7, `span > text-xs` ×7, `p > text-xs` ×1, `a > text-xs` ×1 | `OBSERVED(n=16, pages=[all-8])` |
| **Keycap** | `font-sans text-xs/4` on `<kbd>` | `kbd > text-xs/4` ×8 — **`text-xs/4` appears on nothing else** | `OBSERVED(n=8, pages=[all-8])` |
| **Mono / IDs / timestamps** | `font-mono` + `text-sm` (IDs) or `text-xs` (timestamps) | `div.font-mono.text-sm` (resource IDs), `span.font-mono.text-xs.tabular-nums` (audit timestamps) | `DERIVED(from=capture/workers-and-pages.html, audit-log.html; family utilities are not tallied in facts.json)` |
| **Avatar** | **No type class was observed on any avatar.** See §7. | `img` 25 raw / 4 deduped; `squareBoxes: {"w-6 h-6": 2}` — image avatars, no text | `PRESCRIPTIVE — initials-avatar typography is not observed in the captures` |

---

## 3. Decision list

- **Need a page title?** → `text-xl md:text-3xl font-semibold` on `<h1>`. This is the **only responsive type pair in the system** — every other step is fixed across all breakpoints. `OBSERVED(n=4)`
- **Need a section header?** → `<h2 class="text-2xl font-semibold">` if it heads the page body; `<h2 class="text-base">` if it is a quiet header inside a card. Both are `n=1` — this level is barely exercised, so prefer an `h3` card heading. `OBSERVED(n=2)`
- **Need a card / panel heading?** → `<h3 class="text-lg font-semibold">` (**16px**, same 20px line box as `text-base`). `OBSERVED(n=3)`
- **Need a field label?** → `text-base` (14px). **Not `text-sm`** — shadcn ships `text-sm` on `Label`/`Input`; patch the primitive. `OBSERVED(n=4 label + n=4 input)`
- **Need a button label?** → `text-base` at `h-9`/`h-10`; `text-sm` only at `h-8`. See §4. `OBSERVED(n=26 pairs)`
- **Need a nav item, list row, link, table cell, badge text, or "just some text"?** → `text-sm`. `OBSERVED(n=914)`
- **Need helper text, a timestamp, a caption, a count?** → `text-xs` + subtle tone. **12px is the floor** — never below, and never for text a user must read to finish a task. `OBSERVED(n=29)`
- **Need a keyboard shortcut chip?** → `<kbd class="font-sans text-xs/4">`. `font-sans` is **mandatory** — every UA stylesheet defaults `kbd` to monospace, and this system wants keycaps in the UI face. `OBSERVED(n=8)`
- **Need an ID, hash, or timestamp?** → `font-mono` (+ `tabular-nums` for time/number columns). See §5.
- **Need display / hero type?** → You don't. `text-4xl` and `text-5xl` are defined in the token set and appear **zero** times in 8 pages. `PRESCRIPTIVE — not observed in the captures; mark any use as a deliberate deviation.`

---

## 4. Button label ↔ **real** control height

Read heights from `usage.controlHeights` (the **real-control-height** field, square icon/avatar boxes already excluded) — **never** from `rawControlHeightClasses`.

**Real control heights:** `h-8` ×24, `h-9` ×32, `h-10` ×2 — and nothing else.
By tag: `button` → `h-8` 16, `h-9` 26, `h-10` 2 · `a` → `h-8` 8, `h-9` 6 (links get button chrome too).
`OBSERVED(n=58, pages=[all-8])`

**The pairing table** (`usage.buttonHeightTypePairs` — the only legitimate source for this):

| Height | Rendered | Label class | Size | Count | When |
| --- | --- | --- | --- | --- | --- |
| `h-8` | 32px | `text-sm` | 13px | 8 | Compact button in a dense row, toolbar, table action |
| `h-8` | 32px | `text-base` | 14px | 8 | Compact button that still needs a readable label |
| `h-9` | 36px | `text-base` | 14px | 8 | **Default button.** The primary form/page action |
| `h-10` | 40px | `text-base` | 14px | 2 | Largest observed control. Still 14px |

`OBSERVED(n=26, pages=[all-8])`

Three rules fall straight out of that table:

1. **`h-8` is the only height that takes `text-sm`.** `h-9 | text-sm` occurs **zero** times. At the default height, the label is 14px — do not shrink it. `OBSERVED(n=0 for h-9|text-sm)`
2. **A button label is never smaller than 13px in a real control.** `button > text-xs` exists (×13) but is paired with **no** real control height in `buttonHeightTypePairs` — those 12px labels are chrome-level buttons below the control scale (`components/buttons.md` maps them to the `xs` cluster `h-6.5 … text-xs`). Do not use `text-xs` on an `h-8`/`h-9`/`h-10` button. `OBSERVED(n=13 on button) + DERIVED(from=../../components/buttons.md)`
3. **There is no hero CTA size.** The tallest control observed is **40px (`h-10`, ×2) at `text-base` (14px)**. A 48px button, or a `text-lg`/`text-xl` button label, does not exist in this product. `OBSERVED(n=2 at h-10) — anything larger is PRESCRIPTIVE.`

### The square-box trap

`squareBoxes: {"w-6 h-6": 2}` and `iconWidths: {"w-6": 2}` — a **square** `w-N h-N` / `size-N` control is an **icon button**. It carries an icon, **not a text class**, and it must never be read as a text-control height.

Likewise, `rawControlHeightClasses` lists `h-12` ×44, `h-14` ×4, `h-11` ×7 — **these are not controls.** They are rows/containers, and they were excluded from `usage.controlHeights` for exactly that reason. Sizing a button's label from `h-12` would invent a control the product does not have.
`DERIVED(from=facts.json — controlHeights vs rawControlHeightClasses)`

**DO** `<button class="h-9 px-3 text-base font-medium">` · `<button class="h-8 px-3 text-sm">` · `<button class="size-8" aria-label="…"><svg class="size-4"/></button>`
**DON'T** `<button class="h-9 text-sm">` (unobserved pairing) · `<button class="h-12 text-lg">` (invented control + invented label size) · a `size-8` icon button with a text label crammed in.

More at [`../../components/buttons.md`](../../components/buttons.md).

---

## 5. Numeric, metric and aligned text

**The system compiles exactly one numeric utility: `.tabular-nums`.**

```css
.tabular-nums { --tw-numeric-spacing: tabular-nums; font-variant-numeric: … var(--tw-numeric-spacing,) … }
```
`DERIVED(from=_classes.json — the .slashed-zero / .ordinal / .lining-nums selectors are NOT compiled; only the var slots they would fill exist)`

So: **`tabular-nums` is your only lever.** Don't reach for `lining-nums`, `slashed-zero` or `ordinal` — they will not build.

| Situation | Do this | Provenance |
| --- | --- | --- |
| A **column of numbers or timestamps** in a table | `tabular-nums` on the cell/span, alongside `font-mono text-xs` for timestamps | `DERIVED(from=capture/audit-log.html — span.font-mono.text-xs.tabular-nums.truncate in the log table)` |
| A **metric / KPI block** whose value ticks or refreshes | Put `tabular-nums` **on the container**, not on each number — one class, and every figure inside locks to the same advance width | `DERIVED(from=capture/home-overview.html — div.pb-6.tabular-nums wrapping the account-overview metrics)` |
| An **ID, hash, or key** | `font-mono` + `text-sm` (13px), plus `truncate` — mono also **resets tracking to `0em`**, cancelling the global `-0.01em` | `DERIVED(from=capture/workers-and-pages.html; ../typography.md §5)` |
| **Right-aligning** a number column | Right-align **only with `tabular-nums`** — proportional digits make a ragged right edge | `PRESCRIPTIVE — text-right appears twice in the captured markup and is not tallied in facts.json` |
| **Inline numbers in a sentence** | Leave them proportional. `tabular-nums` is for columns and ticking values, not prose | `PRESCRIPTIVE` |

**Note honestly:** `tabular-nums` is **not counted in `facts.json`** (which tallies size classes only), so no `OBSERVED(n=…)` can be claimed for it. Its *definition* is in `_classes.json` and its *placements* are visible in the rendered DOM — that is the strongest evidence available, and it is `DERIVED`, not `OBSERVED`.

---

## 6. Weight variants

`facts.json` does **not** tally weight utilities. Everything here is `DERIVED` from the compiled classes and the rendered markup.

| Weight | Token | Use it for | Provenance |
| --- | --- | --- | --- |
| `font-normal` (400) | `--font-weight-normal` | **The base.** Body, UI text, table cells, links. It is the base-rule default — you rarely have to write it. | `DERIVED(from=tokens.json; base rule in ../typography.md §4)` |
| `font-medium` (500) | `--font-weight-medium` | **The emphasis workhorse.** Button labels (it sits in the button base class), table headers, active nav, eyebrows. Overwhelmingly the most common weight utility in the captured markup. | `DERIVED(from=../../components/buttons.md base class "…font-medium select-none…"; capture/*.html)` |
| `font-semibold` (600) | `--font-weight-semibold` | **The heading weight.** Every observed `h1` and `h3`. Use it for headings and nothing else. | `DERIVED(from=capture/*.html — h1/h3 class strings)` |
| `font-bold` (700) | `--font-weight-bold` | Defined, but it appears in **no** captured page's class attributes. If you use it, you are deviating. | `PRESCRIPTIVE — not observed in the captures` |
| `font-light` (300) | `--font-weight-light` | **Never.** 300 at 12–13px, with `-webkit-font-smoothing: antialiased` thinning the stems, is unreadable. The token exists; it has no safe use here. | `DERIVED(from=tokens.json + ../typography.md §7)` |

**The weight ladder is: 400 body → 500 emphasis → 600 heading.** That is the whole system. Two steps of contrast, not five.

**DO** `<h3 class="text-lg font-semibold">` · `<th class="text-sm font-medium">` · `<span class="text-sm">` (400 comes free)
**DON'T** `<span class="text-sm font-bold">` to shout · `<p class="text-xs font-light">` · pick `text-lg` *because* you wanted a heading — pick the **tag** for structure and the **class** for size. 16px/600 is visually a whisker away from 14px body; the `<h3>` is what makes it a heading to a screen reader.

---

## 7. Roles the captures do **not** cover

Be honest in code review when you land any of these — none is evidenced.

| Role | Status | Guidance |
| --- | --- | --- |
| **Avatar initials** | `img` avatars only (25 raw / 4 deduped); the two `w-6 h-6` square boxes carry images, not text. **No type class on any avatar.** | `PRESCRIPTIVE — not observed in the captures.` If you must build one: `text-xs font-medium` in a `size-6`/`size-8` round box, and never let the box drive a "control height". |
| **Display / hero type** | `text-4xl`, `text-5xl` — defined in the token set, **zero occurrences**. | `PRESCRIPTIVE — not observed in the captures.` Marketing/empty-state only; do not claim source fidelity. |
| **`<textarea>` / `<select>` label + value type** | `notObserved: ["textarea", "select", "radio", "switch"]` — **n=0 in all 8 pages**. | `PRESCRIPTIVE — not observed in the captures.` Mirror the observed `input` contract: `text-base` (14px) value, `text-base` label, `text-xs` helper. |
| **Blockquote, code block, list prose** | No `blockquote`/`pre` type class in `typeClassByTag`. | `PRESCRIPTIVE — not observed in the captures.` |

---

## 8. Pair the icon to the text

Icon sizes cluster at **12px (196 uses), 16px (42), 14px (22)** — `OBSERVED(n=260 of 476 svg uses, pages=[all-8])`.

| Text | Icon | Class |
| --- | --- | --- |
| `text-sm` (13px) | 12px or 14px | `size-3` / `size-3.5` |
| `text-base` (14px) | 16px | `size-4` |
| `text-xs` (12px) | 12px | `size-3` |

**DON'T** drop a 20px icon next to 13px text — 20px is a **single** use in the whole capture. `OBSERVED(n=1 at 20px)`. Details in [`../iconography.md`](../iconography.md).

---

## 9. DO / DON'T

**DO**
- Default to **`text-sm` (13px)**. 86% of the product is this one class. `OBSERVED(n=914)`
- Use **`text-base` (14px)** for the *comfortable* tier: labels, inputs, prose paragraphs, and **all button labels at `h-9`/`h-10`**. `OBSERVED(n=101)`
- Use **`text-sm` on a button only at `h-8`**. `OBSERVED(n=8)`
- Reserve **`font-semibold`** for headings and **`font-medium`** for emphasis; let 400 come from the base rule. `DERIVED`
- Put `text-*` and `leading-*` **on the same element** — `--tw-leading` is registered `inherits: false`, so a `leading-*` on a parent styles nothing. `DERIVED(from=../typography.md §4)`
- Add **`tabular-nums`** to number/timestamp columns and to metric containers. `DERIVED(from=_classes.json + capture/*.html)`
- Put **`font-sans` on `<kbd>`** explicitly, with `text-xs/4`. `OBSERVED(n=8)`
- Take text colour from **`--text-color-kumo-*`**; typography is theme-invariant, only colour changes. `DERIVED(from=tokens.json)`

**DON'T**
- **Don't assume `text-base` is 16px.** It is **14px**, `text-sm` is **13px**, `text-lg` is **16px**. `DERIVED(from=tokens/typography.css)`
- **Don't pair `h-9` with `text-sm`** — zero observed. And **don't put `text-xs` on any real control height**. `OBSERVED(n=0)`
- **Don't read a button size off a square box.** `size-8` / `w-6 h-6` is an **icon button** — it has no text class. `DERIVED(from=facts.json squareBoxes)`
- **Don't size type from `h-12`/`h-14`/`h-11`.** Those are rows and containers, deliberately excluded from `usage.controlHeights`. `DERIVED(from=facts.json)`
- **Don't invent a hero CTA.** The tallest observed control is 40px at 14px type. `OBSERVED(n=2)`
- **Don't use `text-4xl`/`text-5xl` and call it source-faithful.** `PRESCRIPTIVE — not observed.`
- **Don't reach for `lining-nums` / `slashed-zero` / `ordinal`** — only `.tabular-nums` is compiled. `DERIVED(from=_classes.json)`
- **Don't use `font-light` at any size**, and don't go below **12px**. `DERIVED`
- **Don't treat `type-dark` as a type class** — it is a react-tooltip colour variant. `DERIVED(from=_classes.json)`
- **Don't height-lock a container around `text-sm`** — its 1.176 line-height (15.29px) leaves zero slack when a user forces WCAG 1.4.12 text spacing. `DERIVED(from=../typography.md §7)`

---

## 10. Cheat card

```
page title    h1  text-xl md:text-3xl font-semibold   20 → 30px   (only responsive type)
card heading  h3  text-lg font-semibold               16px
field label   label/input  text-base                  14px  (NOT text-sm — patch shadcn)
button        h-9 text-base font-medium               36px / 14px  ← default
              h-8 text-sm | text-base                 32px / 13px | 14px
              h-10 text-base                          40px / 14px  ← largest that exists
icon button   size-8 + size-4 svg                     no text class
nav / link    a   text-sm                             13px  ← the default for everything
table         th  text-sm font-medium · td text-sm    13px
body          p   text-sm (UI) | text-base (prose)    13 | 14px
helper / meta      text-xs + subtle tone              12px  ← floor
keycap        kbd font-sans text-xs/4                 12px / 16px box
id · hash          font-mono text-sm truncate         13px, tracking resets to 0
number column      tabular-nums (+ font-mono text-xs for timestamps)
```
