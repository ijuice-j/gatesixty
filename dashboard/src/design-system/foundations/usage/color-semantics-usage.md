# Color Semantics — Usage Guidelines

**When do I reach for which color token.**

This is the *decision* layer. It does not restate values — [`../colors.md`](../colors.md) defines every
token, its resolved light/dark value, and the source anomalies; [`../../tokens/colors.css`](../../tokens/colors.css)
ships them. This doc answers only: *given what I'm building, which token do I type?*

---

## Evidence key

Every rule carries exactly one tag.

| Tag | Means |
|---|---|
| `OBSERVED(n=…, pages=[…])` | A count or element that exists in **`capture/facts.json`**. That file is the only source of counts. |
| `DERIVED(from=…)` | Logically derived from `tokens.json`, `_classes.json`, or a class-pattern scan of the captured DOM (`capture/*.html`). Class-scan tallies are labelled as such — they are **not** facts.json counts, and are never presented as `OBSERVED`. |
| `PRESCRIPTIVE` | Best practice **not evidenced by the captures.** Said plainly, never dressed up. |

Capture surface: 8 pages — `analytics`, `api-tokens`, `audit-log`, `billing`, `home-overview`,
`members`, `notifications`, `workers-and-pages`. 551 tokens, 4 themes (`light`, `dark`, `kumo`,
`fedramp`). `OBSERVED(n=551, pages=[all 8])` · `DERIVED(from=facts.json → tokens.count, tokens.themes)`

---

## 0. The one law

> **Type a semantic token, or type nothing.**

The token layer is split by **property**, and that split is the fastest correct decision you can make:

| You are setting | Namespace | Example |
|---|---|---|
| `background-color`, `border-color`, `--tw-ring-color`, `outline-color`, `fill` | `--color-kumo-*` | `--color-kumo-base` |
| `color` (ink) | `--text-color-kumo-*` | `--text-color-kumo-default` |

**DO** — `bg-kumo-base`, `text-kumo-default`, `border-kumo-line`.
**DON'T** — `bg-neutral-800`, `text-[#333]`, `bg-blue-600`, `text-cf-orange-5`.

Why this is not style advice: of the 551 tokens, **249 sit in the `color` group, 136 in the raw `cf`
primitive group, 43 in the `text` group, 14 in `code`** `OBSERVED(n=551, pages=[all 8])`. The `cf-*`
and `color-{blue,neutral,red}-N` primitives are **theme-invariant** — a component that reaches into
one will not re-theme when `[data-mode=dark]` flips. Only the `kumo` semantic layer is themed.
`DERIVED(from=tokens.json — --cf-* and --color-<hue>-<step> carry identical light/dark values)`

---

## 1. Surfaces — which surface nests on which

### The containment rule

There is exactly **one** relationship that holds in both themes, and it is the only one you may
reason from:

> **`base` always sits on `canvas`, and always reads as more prominent.**
> (light: `#fff` on `98.75%`; dark: `17%` on `10%`)

Everything else in the ladder **inverts between themes** — `elevated` is *darker* than `canvas` in
light and *lighter* in dark. `DERIVED(from=tokens.json — --color-kumo-elevated light 98% vs canvas 98.75%; dark 12% vs 10%)`
So: **never hand-compute "one step lighter." Nest by token name, not by lightness.**

### The nesting matrix

Read left → right. Each column may legally sit inside the one before it.

| Level | Token | Utility | Put inside it |
|---|---|---|---|
| 0 — page | `--color-kumo-canvas` | `bg-kumo-canvas` | panels, and nothing else |
| 1 — panel | `--color-kumo-base` | `bg-kumo-base` | content, controls, rows, wells |
| 2a — control | `--color-kumo-control` | `bg-kumo-control` | input / field interiors |
| 2b — well | `--color-kumo-recessed` | `bg-kumo-recessed` | code blocks, table heads, sunken tracks |
| 2c — chip/face | `--color-kumo-fill` | `bg-kumo-fill` | secondary-button face, skeleton, progress track |
| 3 — float | `--color-kumo-elevated` | `bg-kumo-elevated` | popovers, menus, dialogs (floats **above** everything) |

Class-scan frequency in the captured DOM, highest → lowest: `bg-kumo-base` ≫ `bg-kumo-tint` >
`bg-kumo-canvas` > `bg-kumo-recessed` > `bg-kumo-overlay` > `bg-kumo-elevated` ≈ `bg-kumo-control` ≈
`bg-kumo-fill`. `DERIVED(from=capture/*.html class scan)` — `base` is the workhorse; `elevated`,
`control` and `fill` are specialist tokens you reach for by name, not by default.

### Decision tree

```
Am I painting a background?
├─ It's the page itself ──────────────────► bg-kumo-canvas
├─ It's a card / panel / sidebar / row ───► bg-kumo-base
├─ It floats above the page (menu, popover, dialog, tooltip)
│                            ─────────────► bg-kumo-elevated
├─ It's the inside of a text field ───────► bg-kumo-control
├─ It's sunken (code block, table head) ──► bg-kumo-recessed
├─ It's a neutral filled thing (chip, secondary button, skeleton)
│                            ─────────────► bg-kumo-fill   (hover: fill-hover ⚠ no-op in dark)
└─ It's a hover/selected wash ────────────► bg-kumo-tint   (see §1.1)
```

### 1.1 Hover washes — `tint` vs `overlay`

| Use | When | Never |
|---|---|---|
| `bg-kumo-tint` | **Default hover/selected wash.** Works on any surface. | — |
| `bg-kumo-overlay` | Only on rows/items sitting on **`base`**. | On anything sitting on `canvas` |
| `bg-kumo-interact` | Pressed / active — the most-contrasted neutral. | As a hover (too strong) |

**DON'T** put `hover:bg-kumo-overlay` on a `canvas`-backed element: in light, `overlay` (`98.75%`) is
**byte-identical to `canvas`** and the hover silently vanishes. `DERIVED(from=tokens.json — --color-kumo-overlay light == --color-kumo-canvas light)`

**DO** reach for `tint` when in doubt. In the captured DOM `tint` carries the hover/selected state
across menu items, table rows, `data-highlighted`, `aria-selected` and `data-[state=open]`;
`overlay` is used narrowly on `group/row` hovers. `DERIVED(from=_classes.json — .hover:bg-kumo-tint, .data-highlighted:bg-kumo-tint, .aria-selected:hover:bg-kumo-tint, .data-[state=open]:bg-kumo-tint vs .group-hover/row:bg-kumo-overlay)`

### 1.2 Alpha surfaces — the only sanctioned "compute"

The system composes alpha variants of surfaces (`bg-kumo-base/50`, `/60`, `/75`, `/80`, `/90`,
`bg-kumo-canvas/90`, `bg-kumo-contrast/5`). `DERIVED(from=_classes.json)` These are the *only*
derived colors you should author — use the `/NN` opacity syntax on a semantic token, never a
hand-mixed hex.

**DO** — `bg-kumo-base/80` for a sticky, translucent header.
**DON'T** — `bg-[rgba(255,255,255,0.8)]`. It won't invert in dark.

---

## 2. Text — the ink ladder

Six neutral inks. Pick by **role**, not by "how grey do I want it."

| Ink | Token | Use it for | Stop |
|---|---|---|---|
| **Strong** | `--text-color-kumo-strong` | Headings; the value in a stat; text on hover/focus | Don't use as body — you lose the hierarchy |
| **Default** | `--text-color-kumo-default` | **Body. The default. If unsure, this.** | — |
| **Subtle** | `--text-color-kumo-subtle` | Captions, metadata, secondary text a user **must still read**; disabled labels that must remain legible | — |
| **Placeholder** | `--text-color-kumo-placeholder` | Input placeholder — **and nothing else** | Never load-bearing content |
| **Inactive** | `--text-color-kumo-inactive` | Disabled-control ink, inert glyphs, em-dash fillers | ❌ **Never for text a user must read** |
| **Inverse** | `--text-color-kumo-inverse` | Ink on an inverted (`bg-kumo-contrast`) surface | Not on a *brand* fill — see §4 |

`strong` and `default` are the two dominant color utilities in the captured markup by a very wide
margin, followed by `subtle`; `placeholder`, `inactive` and `inverse` are rare-to-absent.
`DERIVED(from=capture/*.html class scan — text-kumo-default and text-kumo-strong lead, then text-kumo-subtle)`

This matters because **type size does not carry hierarchy here** — `text-sm` is used **914** times
versus `text-base` **101** and `text-xs` **29** `OBSERVED(n=914, pages=[all 8])`. With one type size
doing ~86% of all type-class usage, **ink weight is your primary hierarchy channel.** Escalate
`subtle → default → strong`, not `text-sm → text-base`.

### The escalation rule

```
strong   ← headings, hovered/focused text, the number in a metric
default  ← everything else you read
subtle   ← the caption under it
inactive ← it's disabled or it's a decorative glyph
```

**DO** — `text-kumo-subtle` for a timestamp next to a `text-kumo-default` row label.
**DON'T** — `text-kumo-inactive` for that timestamp. `inactive` is the *disabled* ink; on light it
resolves to `oklch(87% 0 0)` — near-invisible on `base`. `DERIVED(from=tokens.json)`

### 2.1 Links: `link` vs `info` vs `brand`

| Want | Token | Utility |
|---|---|---|
| A hyperlink | `--text-color-kumo-link` | `text-kumo-link` |
| Informational ink / link-like affordance | `--text-color-kumo-info` | `text-kumo-info` |
| Cloudflare wordmark orange | `--text-color-kumo-brand` | `text-kumo-brand` — **see the trap in §4** |

`link` and `info` resolve to **identical values in both themes**
`DERIVED(from=tokens.json — --text-color-kumo-link == --text-color-kumo-info, light and dark)`. Keep both
names (they may diverge); choose by *intent*: `link` = it navigates, `info` = it informs.

Links are the single most common element in the capture: **760 raw / 137 deduped `<a>` across 8 pages**,
and **632** of them carry `text-sm` `OBSERVED(n=760, pages=[all 8])`. Getting link ink right is
higher-leverage than any other color decision in this system.

**DON'T** use `--text-color-kumo-brand` (`#f6821f`) as link ink. It is the marketing orange, it is
theme-invariant (identical in light *and* dark — the only semantic token that never changes), and it
is a wordmark color, not a text color. `DERIVED(from=tokens.json — --text-color-kumo-brand = #f6821f in all 4 themes)`

---

## 3. Borders, dividers, rings

| Job | Token | Utility |
|---|---|---|
| **Default border / divider / rule** | `--color-kumo-line` | `border-kumo-line`, `bg-kumo-line` (for a 1px separator `<div>`), `ring-kumo-line` |
| Opaque divider (only when you *need* opaque) | `--color-kumo-hairline` | `border-kumo-hairline` |
| Control border that doubles as a face | `--color-kumo-fill` | `border-kumo-fill`, `hocus:border-kumo-fill` |
| Focus ring (generic) | `--color-kumo-focus` @ 50% | `focus:ring-kumo-focus/50`, `focus-within:ring-kumo-focus/50` |
| Focus ring (`:focus-visible`) | `--color-kumo-brand` | `focus-visible:ring-kumo-brand` |
| Invalid / error ring | `--color-kumo-danger` | `ring-kumo-danger` |
| Tooltip outline | `--color-kumo-tip-stroke` | (transparent in light by design) |

### Pick `line`, not `hairline`

`border-kumo-line` and `bg-kumo-line` together dominate the captured markup; `border-kumo-hairline`
appears essentially once. `DERIVED(from=capture/*.html class scan — border-kumo-line/bg-kumo-line/ring-kumo-line vastly outnumber the hairline variants)`

The reason is structural, not stylistic: in light, `line` is a **10%-alpha black**
(`oklch(14.5% 0 0 / .1)`), so it composites identically over `canvas`, `base` *and* `elevated`.
`hairline` is an **opaque** `93.5%` — correct only on white. `DERIVED(from=tokens.json)`

**DO** — one `border-kumo-line` between stacked rows.
**DON'T** — stack two adjacent `line` borders in light mode; the alpha doubles to ~19% and that seam
reads visibly darker than every other divider on the page.

### Three rings, three meanings — keep all three

The focus system is a **three-token** contract, and the capture uses it consistently across all 8
pages: `focus-visible:ring-kumo-brand` is the **only** way `ring-kumo-brand` ever appears in the
markup. `DERIVED(from=capture/*.html class scan — every ring-kumo-brand occurrence is prefixed focus-visible:, on all 8 pages)`

```
:focus         → ring-kumo-focus/50      (neutral, high-contrast — inverts with theme)
:focus-visible → ring-kumo-brand         (the blue accent — keyboard users)
[aria-invalid] → ring-kumo-danger        (error)
```

**DON'T** collapse these into one ring. **DON'T** use `ring-kumo-brand` for a non-focus purpose (§4).

---

## 4. The brand accent — a ring, not a fill

### ⚠ The brand is two different colors. This is not a bug.

| Token | Resolves to | Namespace |
|---|---|---|
| `--color-kumo-brand` | **blue** (`oklch(57.72% .2324 260)` light / `51.948%` dark) | fill / ring / border |
| `--text-color-kumo-brand` | **Cloudflare orange `#f6821f`** — identical in all 4 themes | ink |

`DERIVED(from=tokens.json)` If you type `bg-kumo-brand` you get **blue**. If you type
`text-kumo-brand` you get **orange**. They are not two forms of the same color. Do not "fix" this.

### The reserve list

The evidence is unusually clean here. Across all 8 captured pages, `bg-kumo-brand` appears **once**;
`ring-kumo-brand` appears on **every page**, always as `focus-visible:`. `text-kumo-brand` (the
orange) does **not appear at all**. `DERIVED(from=capture/*.html class scan)`

> **The brand accent is an *edge*, not an *area*.**

| Brand is FOR | Brand is NOT for |
|---|---|
| `focus-visible:ring-kumo-brand` — keyboard focus | Page/section/card backgrounds |
| `focus:border-kumo-brand` — focused field border | Hero panels, banners, empty states |
| The active-tab / active-nav indicator | Large decorative fills |
| The **one** primary button on a view | Every button on the view |
| Link ink (via `--text-color-kumo-link`, same blue family) | Body text |

**A corroborating fact:** the real text-control heights in the capture are `h-8` (n=24), `h-9` (n=32)
and `h-10` (n=2) `OBSERVED(n=58, pages=[all 8])`. There is **no large hero-CTA size in the data** —
the biggest button is `h-10`, and only twice. A system whose largest button is 40px tall is not a
system that fills big areas with brand color. Don't invent a hero CTA and don't paint one in brand.

> **Disambiguation trap.** `rawControlHeightClasses` also lists `h-12` (44), `h-11` (7) and `h-14` (4)
> `OBSERVED(n=55, pages=[all 8])` — those are **not** control heights; they are containers/rows. And
> `squareBoxes: {"w-6 h-6": 2}` `OBSERVED(n=2, pages=[all 8])` is a **square icon box**, i.e. an icon
> button — not a text-control height. An icon button gets a **ghost/`tint` hover**, never a brand fill.
> Read heights from `controlHeights`, never from raw height frequencies.

### Primary button

The primary ("emphasis") button does **not** flat-fill `--color-kumo-brand`; it composes four
element-scoped `color-mix()` values off the brand token (`--kumo-button-emphasis-bg`, `-ring`,
`-gradient-start`, `-gradient-end`), and its label is a **literal white**.
`DERIVED(from=capture/*.html + ../colors.md §10.2)`

**DON'T** label a brand-filled button with `--text-color-kumo-inverse` — in dark mode `inverse`
resolves to `oklch(20.5% 0 0)` (near-black) and would sit on a blue fill. `DERIVED(from=tokens.json)`
Use white. Details: [`../../components/buttons.md`](../../components/buttons.md).

---

## 5. Status / intent — ⚠ NOT OBSERVED IN THE CAPTURES

> **`facts.json` reports `usage.statusIntent: {}` — empty — and `usage.variantClasses: {}` — empty.**
> `OBSERVED(n=0, pages=[all 8])`
>
> **No status intent was exercised anywhere in the 8 captured pages.** Everything in this section is
> therefore `PRESCRIPTIVE`. It is the shape the token layer *implies*, not a behaviour the capture
> proves. Treat it as a proposal to validate, not as mined truth.

Corroborating: badges number **136 raw / 17 deduped**, and **every one of the 8 pages shows exactly
17** `OBSERVED(n=136, pages=[all 8])` — i.e. after de-duplication the badge count equals the per-page
count, so **every badge in the capture belongs to the persistent shell chrome**. Not one
page-specific, state-carrying badge was captured. Class-scanning the DOM confirms it: **zero**
`bg-kumo-badge-*` classes appear. `DERIVED(from=capture/*.html class scan)`

### The intent triplet (PRESCRIPTIVE)

Four intents exist in the token layer — `danger`, `warning`, `success`, `info`. There is no `neutral`
intent, no `critical` tier. Do not invent them. `DERIVED(from=tokens.json)`

| Slot | Token | Property | Use for |
|---|---|---|---|
| Solid | `--color-kumo-<intent>` | background | Status dot, alert bar, solid badge |
| Tint | `--color-kumo-<intent>-tint` | background | Callout / alert **body** |
| Ink | `--text-color-kumo-<intent>` | color | Text + icon **on the tint** |

**Rule — ink goes on the tint, never on the solid.** `PRESCRIPTIVE` In dark mode
`--color-kumo-warning` and `--text-color-kumo-warning` resolve to the **same value**
(`oklch(85.2% .199 91.936)`); `info`'s solid and ink likewise collide. `text-kumo-warning` on
`bg-kumo-warning` is a 1:1 contrast — literally invisible. `DERIVED(from=tokens.json)` On a solid
intent fill, use white/black or `--text-color-kumo-inverse`.

**DO**
```html
<div class="bg-kumo-danger-tint text-kumo-danger border-kumo-line">…</div>   <!-- callout -->
<span class="bg-kumo-success"></span>                                        <!-- status dot -->
```
**DON'T**
```html
<div class="bg-kumo-warning text-kumo-warning">…</div>   <!-- 1:1 in dark. invisible. -->
<div class="bg-kumo-danger">…paragraphs of body copy…</div>  <!-- solid is for dots/bars, not areas -->
```

### Banners (PRESCRIPTIVE)

Only **`--color-kumo-banner-info`** and **`--color-kumo-banner-warning`** exist. There is **no**
`banner-danger` and **no** `banner-success`. `DERIVED(from=tokens.json)` If you need them you are
**authoring** them — say so in your changelog; do not present them as mined.

### Badge hues ≠ intents (PRESCRIPTIVE)

`--color-kumo-badge-{blue,green,red,purple,teal,orange,neutral,inverted}` is a **categorical hue**
family — it *labels a thing* (environment, plan, region). Intent tokens *communicate a state*.

**Which hue maps to which meaning is not in the data** (`statusIntent: {}`). Choose the mapping, write
it down, and enforce it — the captures give you no default. See
[`../../components/badges-status.md`](../../components/badges-status.md).

⚠ The **subtle** badge variant is incomplete upstream: only three subtle *inks* exist
(`neutral`, `orange`, `teal`) and **no** `--color-kumo-badge-*-subtle` *background* token exists at
all — yet `_classes.json` compiles a utility `.bg-[var(--color-kumo-badge-orange-subtle)]` that
references one. That reference is **dangling**. `DERIVED(from=_classes.json + tokens.json)` Author the
missing tokens explicitly or don't use subtle badges.

---

## 6. Charts — no themed chart tokens exist

`facts.json` reports `charts.chartTokenCount: 0` and `charts.palette: []`, while simultaneously
reporting `markupSignals: { rechartsRoot: 10, svgChartHints: 35, canvas: 1 }`
`OBSERVED(n=0, pages=[all 8])`. **Charts render, but zero tokens were attributed to them.**

`--cf-sequential-0 … -13` exists in the **primitive** layer, is **theme-invariant hex**, and — despite
the name — is **categorical, not sequential** (the hues jump). Several entries are very dark and will
disappear against `--color-kumo-canvas` in dark mode (`oklch(10% 0 0)`).
`DERIVED(from=tokens.json)`

**DON'T** use `--cf-sequential-*` for an ordered scale, and **DON'T** assume it is dark-mode-safe.
**DO** treat a themed chart palette as something you are **authoring**, not porting. `PRESCRIPTIVE`

---

## 7. Traps, ranked by how much they'll cost you

| # | Trap | Rule |
|---|---|---|
| 1 | `bg-kumo-brand` is **blue**, `text-kumo-brand` is **orange** | Never assume the two brand tokens match. `DERIVED(from=tokens.json)` |
| 2 | `elevated` is **darker** than `canvas` in light mode | Nest by token name, never by lightness. `DERIVED(from=tokens.json)` |
| 3 | `overlay` == `canvas` in light | Only apply `hover:bg-kumo-overlay` to things on `base`. `DERIVED(from=tokens.json)` |
| 4 | Dark-mode `warning`/`info`: solid == ink | Intent ink belongs on the **tint**. `DERIVED(from=tokens.json)` |
| 5 | `fill-hover` == `fill` in dark | The hover is a **no-op** in dark. Don't rely on it alone. `DERIVED(from=tokens.json)` |
| 6 | Two stacked `line` borders in light | Alpha doubles to ~19% — that seam reads darker. `DERIVED(from=tokens.json)` |
| 7 | `text-kumo-inactive` used as de-emphasis | It's the **disabled** ink. Use `subtle` for live text. `DERIVED(from=tokens.json)` |
| 8 | A square `w-N h-N` control | That's an **icon button**, not a control height. Ghost/`tint` hover, never a brand fill. `OBSERVED(n=2, pages=[all 8])` |
| 9 | Reaching into `--cf-*` / `--color-<hue>-<step>` | Primitives are theme-invariant. The component will not re-theme. `DERIVED(from=tokens.json)` |
| 10 | Building a "kumo theme" | `.theme-kumo` is the dark theme. There are 4 theme columns but only 2 real skins + a fedramp patch. `DERIVED(from=tokens.json, facts.json → tokens.themes)` |

### Classes in the DOM with no token behind them

The captured markup contains `text-kumo-disabled` and `ring-kumo-ring`, but **no
`--text-color-kumo-disabled` and no `--color-kumo-ring` token exists** in `tokens.json`, and neither
utility is compiled in `_classes.json`. `DERIVED(from=capture/*.html + tokens.json + _classes.json)`
**They are dead classes and render nothing.** Use `text-kumo-inactive` (disabled ink) and
`ring-kumo-focus` / `ring-kumo-brand` (rings) instead.

---

## 8. Quick reference card

```
SURFACES     page ......... bg-kumo-canvas
             panel/card ... bg-kumo-base           ← the workhorse
             popover ...... bg-kumo-elevated
             field ........ bg-kumo-control
             well ......... bg-kumo-recessed
             chip/face .... bg-kumo-fill
             hover wash ... bg-kumo-tint           (overlay ONLY on base)
             pressed ...... bg-kumo-interact

TEXT         heading ...... text-kumo-strong
             body ......... text-kumo-default      ← the default
             caption ...... text-kumo-subtle
             placeholder .. text-kumo-placeholder
             disabled ..... text-kumo-inactive
             link ......... text-kumo-link
             on inverted .. text-kumo-inverse

EDGES        divider ...... border-kumo-line       (bg-kumo-line for a 1px <div>)
             :focus ....... ring-kumo-focus/50
             :focus-visible ring-kumo-brand
             invalid ...... ring-kumo-danger

INTENT       callout ...... bg-kumo-<intent>-tint + text-kumo-<intent>   [PRESCRIPTIVE]
             dot / bar .... bg-kumo-<intent>                             [PRESCRIPTIVE]
             label a thing  bg-kumo-badge-<hue>                          [PRESCRIPTIVE]

NEVER        bg-neutral-800 · text-[#333] · --cf-orange-5 · text-kumo-brand as body ink ·
             brand as a large fill · intent ink on an intent solid
```

---

## See also

- [`../usage-guidelines.md`](../usage-guidelines.md) — the usage hub (all sibling decision docs)
- [`../colors.md`](../colors.md) — every color token, resolved values, and the upstream anomalies
- [`../typography.md`](../typography.md) — why ink weight, not type size, carries hierarchy here
- [`../elevation-motion.md`](../elevation-motion.md) — shadow/elevation tokens that pair with the surface ladder
- [`../iconography.md`](../iconography.md) — icon color inherits ink; `dominantStyle: fill`
- [`../../components/buttons.md`](../../components/buttons.md) — the emphasis-button color-mix recipe
- [`../../components/badges-status.md`](../../components/badges-status.md) — badge hue family
- [`../../components/feedback-overlays.md`](../../components/feedback-overlays.md) — callouts, banners, dialogs
- [`../../components/forms.md`](../../components/forms.md) — control, placeholder, invalid ring
- [`../../tokens/colors.css`](../../tokens/colors.css) — the shipped token values
