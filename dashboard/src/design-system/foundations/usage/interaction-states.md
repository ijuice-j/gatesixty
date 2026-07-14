# Interaction & State Conventions — usage guide

**What this doc is:** the *decision layer* for states. It answers "which focus/hover/disabled/loading
treatment do I reach for, and when." It does **not** re-list token values — [`../../tokens.json`](../../tokens.json) and
[`../../tokens/index.css`](../../tokens/index.css) own those — and it does not re-describe components — [`../../components/`](../../components/buttons.md) owns those.

Hub: [`../usage-guidelines.md`](../usage-guidelines.md) · Siblings in foundations: [`../colors.md`](../colors.md) · [`../typography.md`](../typography.md) · [`../spacing-layout.md`](../spacing-layout.md) · [`../elevation-motion.md`](../elevation-motion.md) · [`../iconography.md`](../iconography.md)

---

## 0. How to read the provenance tags (read first)

| Tag | Means |
|---|---|
| `OBSERVED(n=…, pages=[…])` | A count that exists **verbatim in `capture/facts.json`**. |
| `DERIVED(from=…)` | Logically derived from `tokens.json` / `_classes.json` / the rendered DOM in `capture/*.html`. Class-combination counts recounted from the DOM are tagged this way — **not** `OBSERVED` — because `facts.json` carries **no class-level state counts**: `usage.variantClasses = {}` and `usage.statusIntent = {}` are both empty objects. |
| `PRESCRIPTIVE` | Best practice **not evidenced by the captures**. Always says so. |

The 8 captured pages are: `analytics`, `api-tokens`, `audit-log`, `billing`, `home-overview`, `members`,
`notifications`, `workers-and-pages` (`facts.json` → `usage.pages`, `pageCount: 8`). "all 8" below means that list.

**Not exercised at all** (`facts.json` → `usage.notObserved`): `textarea`, `select`, `radio`, `switch` — every
rule touching those is `PRESCRIPTIVE`.

---

## 1. The focus ring — the one thing you may never remove

### 1.1 The system deletes the native outline everywhere, so the ring *is* the focus affordance

`focus:outline-none` appears **896×** across all 8 pages — on effectively every interactive node.
If you then forget the ring, the element becomes **invisibly focusable**. There is no fallback.

> **Rule.** Any element that can receive focus ships `focus:outline-none` **and** a ring in the same class
> string. Shipping one without the other is a bug, not a style choice.
> `DERIVED(from=capture/*.html — 8 pages)`

### 1.2 The focus token is `--color-kumo-focus`, and it is **neutral, not brand**

`--color-kumo-focus` = `oklch(15% 0 0)` (light) / `oklch(93.5% 0 0)` (dark) — near-black on light, near-white
on dark. It is the *only* token named "focus" in the system besides the date-picker-scoped `--rdp-focus-ring`.
`DERIVED(from=tokens.json)`

`_classes.json` emits **13** rules that consume it — `focus:ring-kumo-focus`, `focus:ring-kumo-focus/50`,
`focus-visible:ring-kumo-focus`, `focus-visible:ring-kumo-focus/50`, `focus-within:ring-kumo-focus/50`,
`focus-within:outline-kumo-focus`, `focus-visible:border-kumo-focus/50`, `not-disabled:hover:ring-kumo-focus/25`,
… — all resolving through `color-mix(in oklab, var(--color-kumo-focus) <pct>%, transparent)`.
`DERIVED(from=_classes.json)`

### 1.3 The real recipe is **two-layer**: neutral on any focus, brand on keyboard focus

The standard control carries all four of these together (identical class string on 80 button nodes, all 8 pages):

```
focus:outline-none  focus:ring-kumo-focus/50
focus-visible:ring-2  focus-visible:ring-kumo-brand
```

`DERIVED(from=capture/*.html)` — recounted across all 8 pages: `focus:outline-none` ×896, `focus:ring-kumo-focus/50` ×80, `focus-visible:ring-2` ×80, `focus-visible:ring-kumo-brand` ×80.

| Layer | Fires on | Visual |
|---|---|---|
| `focus:ring-kumo-focus/50` | **any** focus, incl. pointer | recolors the existing 1px `ring` to 50% neutral — a whisper |
| `focus-visible:ring-2` + `focus-visible:ring-kumo-brand` | **keyboard only** | 2px, `--color-kumo-brand` (blue) — the loud one |

**Why it matters:** the keyboard user gets the strong signal; the mouse user gets a quiet acknowledgement
instead of a jarring blue halo after a click. Do not collapse the two layers into one.

### 1.4 Which focus shape for which element

| Element | Focus treatment | Evidence |
|---|---|---|
| Standard button (has `ring ring-kumo-line` at rest) | `focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand` | ×80, all 8 pages · `DERIVED(from=capture/*.html)` |
| **Icon-only** button flush in a toolbar/rail | add **`focus-visible:ring-inset`** — the ring draws *inside* the box so it can't collide with the neighbour | `focus-visible:ring-inset` ×19, all 8 pages · `DERIVED(from=capture/*.html)` |
| Text field / input group | `focus:ring-kumo-focus/50 focus:ring-[1.5px]` **plus** the same pair as `focus-within:` on the **wrapper** | `focus:ring-[1.5px]` ×8; `focus-within:ring-kumo-focus/50` ×4; `focus-within:ring-[1.5px]` ×4 · `DERIVED(from=capture/*.html)` |
| Sidebar / nav item | **no ring at all** — focus is a surface + text change: `focus-visible:bg-(--sidebar-active-bg) focus-visible:text-kumo-strong` | ×826 each, all 8 pages · `DERIVED(from=capture/*.html)` |

**The input-group case is the interesting one.** The field wrapper is `overflow-hidden`, and the ring is a
`box-shadow` (`--tw-ring-shadow`). A ring on the inner `<input>` would be **clipped**. That is precisely why
the system puts `focus-within:ring-*` on the wrapper and neutralises the inner input with `focus:ring-0!`.
`DERIVED(from=capture/*.html + _classes.json)`

> **DO** put the focus ring on the element that owns the visible border — the wrapper for compound
> fields (prefix/suffix/addon), the control itself for a plain button.
> **DON'T** ring the inner `<input>` of a group; you'll get a clipped half-ring.

### 1.5 Ring width / offset — what's actually available

`_classes.json` compiles `focus-visible:ring-{0,1,[1.5px],2}`, `focus-visible:ring-offset-{0,1,2}`,
`focus-visible:ring-offset-kumo-base`, `focus-visible:ring-inset`, plus outline variants
(`focus-visible:outline-2`, `focus-visible:outline-kumo-brand`, `focus-visible:outline-offset-{2,3}`).
`DERIVED(from=_classes.json)`

- **2px** for buttons and anything with a solid surface. **1.5px** for text fields (the ring doubles as the border, so it must stay hairline-adjacent).
- Reach for `focus-visible:ring-offset-1 focus-visible:ring-offset-kumo-base` only when the control sits directly on a coloured surface and the ring would otherwise touch it. Offsets are rare in the captures.
- `focus-visible:z-2 / z-3 / z-10 / z-50` exist for a reason: in a **button group / segmented control**, raise the focused item so its ring isn't painted over by the adjacent sibling. `DERIVED(from=_classes.json)`

### 1.6 The `forced-colors` hazard

The ring is a `box-shadow`. Windows High-Contrast / `forced-colors: active` **drops `box-shadow` entirely** —
so a ring-only focus style disappears for exactly the users who need it most.

> **Rule.** Ship a `@media (forced-colors: active) { outline: 2px solid CanvasText; outline-offset: 2px; }`
> fallback on every focusable element. **`PRESCRIPTIVE`** — no `forced-colors` rule exists in the captures.
> (See [`../elevation-motion.md`](../elevation-motion.md) §1.9, which flags the same hazard.)

### DO / DON'T — focus

- **DO** ship `focus:outline-none` and the ring as one inseparable unit.
- **DO** use `focus-visible:` for the loud ring and plain `focus:` for the quiet one.
- **DON'T** ever write `focus:outline-none` alone, or `outline-none` on a wrapper that eats a child's ring.
- **DON'T** substitute a background-colour change for the ring on a *button* — that's the nav pattern, and it only works there because nav items have no resting surface to confuse it with.
- **DON'T** use `--color-kumo-brand` as the resting border and then also as the focus ring: at rest the border is `--color-kumo-line`, so the brand ring reads as a delta. Keep the delta.

---

## 2. Hover and active — the token *suffix* conventions

### 2.1 Hover has a real `-hover` token suffix; active does not

| Token | Role |
|---|---|
| `--color-kumo-fill-hover` | hover surface for filled controls |
| `--color-kumo-brand-hover` | hover surface for the brand/primary surface |
| `--color-hover` / `--color-active` | the generic pair (legacy/non-kumo scope) |
| `--color-kumo-tint` | the *de facto* hover surface for ghost/secondary controls |
| `--color-kumo-interact` | interactive surface, one rung above `tint` |
| `--sidebar-active-bg` | the nav rail's hover **and** focus surface |

`DERIVED(from=tokens.json)` — **there is no `--color-kumo-active`.** Active/pressed is expressed by moving
text one rung stronger, not by a dedicated surface token.

### 2.2 What the DOM actually does

| Class | Count (raw / pages) | Use for |
|---|---|---|
| `hover:bg-(--sidebar-active-bg)` | 817 / 8 | nav & rail items |
| `hover:text-kumo-default` | 84 / 8 | subtle→default text lift on hover |
| `hover:bg-kumo-tint` | 33 / 8 | ghost buttons, menu items |
| `not-disabled:hover:bg-kumo-tint` | 21 / 8 | the same, on a control that **can** be disabled |
| `active:text-kumo-strong` | 18 / 7 | pressed feedback |
| `hover:text-kumo-strong` | 18 / 7 | strongest hover text |
| `not-disabled:hover:ring-kumo-focus/25` | 2 / 2 | ring warms up on hover (25% — half the focus tint) |

`DERIVED(from=capture/*.html — 8 pages)`

### 2.3 The `not-disabled:` rule

The system uses the `not-disabled:` variant (`:not(:disabled):hover`) on controls that have a disabled state,
so a disabled button doesn't light up under the cursor. `_classes.json` compiles six of them
(`not-disabled:hover:bg-kumo-tint`, `…:bg-kumo-fill`, `…:text-kumo-strong`, `…:ring-kumo-focus/25`, …).
`DERIVED(from=_classes.json)`

> **DO** write `not-disabled:hover:bg-kumo-tint` on anything that accepts a `disabled` prop.
> **DON'T** write bare `hover:bg-kumo-tint` there — the disabled control will still glow, and
> `disabled:bg-kumo-base/50` will fight it at equal specificity.

**Hover ladder (pick the smallest step that reads):**
`text-kumo-subtle → hover:text-kumo-default → hover:text-kumo-strong` for quiet controls;
`bg-transparent → hover:bg-kumo-tint → active/open: bg-kumo-base` for surfaced ones. `DERIVED(from=capture/*.html)`

---

## 3. Disabled

### 3.1 The observed recipe

| Class | Count (raw / pages) | Notes |
|---|---|---|
| `disabled:cursor-not-allowed` | 62 / 8 | always paired with the next row |
| `disabled:text-kumo-subtle` | 62 / 8 | **the text treatment** |
| `disabled:bg-kumo-base/50` | 21 / 8 | surface drops to 50% |
| `disabled:!text-kumo-default/70` | 21 / 8 | text drops to 70% (wins over `text-kumo-subtle` via `!`) |
| `disabled:opacity-50` | 7 / 5 | whole-element fade — the blunt instrument |
| `data-[disabled]:pointer-events-none` + `data-[disabled]:opacity-50` | 4 / 4 each | for **non-`<button>`** widgets (menu items) that can't take the `:disabled` pseudo-class |

`DERIVED(from=capture/*.html — 8 pages)` · `aria-disabled` appears on 3 pages, native `disabled=` on 3 pages.

### 3.2 ⚠ `disabled:text-kumo-disabled` is a **dead class** — do not copy it

It appears **8×** in the DOM (4 pages), but:
- `--text-color-kumo-disabled` **does not exist** among the 586 color tokens in `tokens.json`, and
- `_classes.json` emits **no rule** for `.disabled\:text-kumo-disabled`.

It renders nothing. The tokens that *do* exist are `--text-color-disabled` (via the `.text-disabled` utility)
and `--text-color-kumo-inactive`. `DERIVED(from=tokens.json + _classes.json + capture/*.html)`

> **DO** use `disabled:text-kumo-subtle` (the 62× pattern) or `.text-disabled`.
> **DON'T** use `disabled:text-kumo-disabled` — it is a no-op that *looks* like it works because the
> button's other disabled classes are doing the job.

### 3.3 `disabled` vs `aria-disabled`

| Situation | Use | Focusable? |
|---|---|---|
| Action is unavailable and there is nothing to explain | native `disabled` | no |
| Action is unavailable **and you need to tell the user why** (validation gate, permission, plan limit) | `aria-disabled="true"` + `data-[disabled]:pointer-events-none` styling, keep the element focusable, keep the focus ring, attach the reason via `aria-describedby` / tooltip | **yes** |

`PRESCRIPTIVE` — the captures use both `disabled` and `aria-disabled` but never show a *reason* affordance,
so the second row is a recommendation, not an observation.

> **DON'T** strip the focus ring from an `aria-disabled` element. It is still in the tab order; an
> unreachable explanation is worse than a disabled button.

---

## 4. Loading & busy

### 4.1 Two loading idioms are in the captures, and they are for different things

| Idiom | Evidence | Use when |
|---|---|---|
| **Skeleton** — `.skeleton` / `.skeleton-line` + `shimmer` keyframe (`1.5s ease-in-out infinite`) | `skeleton` ×8, **`workers-and-pages` only** · `DERIVED(from=capture/*.html + _classes.json)` | You know the **shape** of the incoming content (a list of cards, a table). Reserve the layout; don't reflow on arrival. |
| **Pulse** — `animate-pulse` (`--animate-pulse` = `pulse 2s cubic-bezier(.4, 0, .6, 1) infinite`) | `animate-pulse` ×34, **`home-overview` only** · `DERIVED(from=capture/*.html + tokens.json)` | A live/streaming tile whose value is refreshing in place (also `pulse-sparkline`). |

`facts.json` → `motion.keyframeNames` (48 total) contains `skeleton`, `shimmer`, `pulse`, `ping`, `spin`,
`loading-bar`, `refresh`. `OBSERVED(n=48 keyframes, pages=[all 8])`

### 4.2 Spinners: the token exists, the usage does not

`--animate-spin` = `spin 1s linear infinite` and `--animate-refresh` = `refresh .5s ease-in-out infinite` are
real tokens. The class **`animate-spin` appears 0× in the rendered DOM.**
`DERIVED(from=tokens.json)` + `DERIVED(from=capture/*.html — n=0)`

> **`PRESCRIPTIVE` (not observed in the captures):** for an in-place submit, keep the button mounted at its
> resting width, swap the leading icon for a `animate-spin` glyph at the **16px** icon size, set
> `aria-busy="true"`, and set `disabled`. `aria-busy` appears **0×** in the captures.
> **DON'T** replace the label with a spinner — the button collapses and the layout jumps.
> **DON'T** use a skeleton for a *button press*; skeletons are for regions, spinners for actions.

### 4.3 Announce it

`aria-live` regions do occur (16 raw, all 8 pages) but the ones in the captures belong to a third-party
consent SDK, not to the design system. Treat live-region wiring as `PRESCRIPTIVE`: a loading→loaded
transition should update a polite live region, because the visual change (shimmer stops) is invisible to a
screen reader.

---

## 5. Inputs: invalid, readonly, placeholder, required

### 5.1 Invalid — driven off `aria-invalid`, styled with `--color-kumo-danger`

The one and only invalid rule in the system:

```
has-[input[aria-invalid=true]]:ring-kumo-danger     →  --tw-ring-color: var(--color-kumo-danger)
```

`DERIVED(from=_classes.json)` · `aria-invalid` ×4 and `ring-kumo-danger` ×4, on 4 pages
(`api-tokens`, `billing`, `members`, `workers-and-pages`) · `DERIVED(from=capture/*.html)`

This is the pattern worth internalising: **the accessibility attribute is the source of truth, and the style
is a `has-[…]` reaction to it.** You cannot get the red ring without also being announced as invalid.

> **DO** set `aria-invalid="true"` on the `<input>` and let the wrapper's `has-[…]:ring-kumo-danger` paint it.
> **DO** point `aria-describedby` at the error text (`aria-describedby` occurs on 7 of 8 pages).
> **DON'T** hand-apply `ring-kumo-danger` without `aria-invalid` — you get a red box nobody is told about.
> **DON'T** rely on the ring alone: ship the error **message** and an icon. (See §7.)

### 5.2 Readonly — **not observed**

`readonly` appears **0×** across all 8 pages. `DERIVED(from=capture/*.html — n=0)`

> **`PRESCRIPTIVE`:** a readonly field keeps `--color-kumo-control` as its surface and stays focusable and
> selectable; it drops only `--color-kumo-line` → hairline and the caret. Do **not** reuse the disabled
> treatment (`disabled:bg-kumo-base/50` + `cursor-not-allowed`) — readonly text must remain copyable, and
> greying it out tells the user it's inert when it isn't.

### 5.3 Placeholder

`.kumo-input-placeholder::placeholder { color: var(--text-color-kumo-placeholder) }` — one utility class,
one token. There is also `data-[placeholder]:text-kumo-placeholder` (×3) for combobox/select **triggers**
that display a placeholder value rather than a real one. `DERIVED(from=_classes.json + capture/*.html)`

> **DON'T** use the placeholder as the label. `required` (×16, all 8 pages) and `aria-describedby` (7 pages)
> are both in play — the system expects a real `<label>`.

### 5.4 What you must design yourself

`facts.json` → `usage.notObserved` = `["textarea", "select", "radio", "switch"]`, and
`usage.elementTotalsRaw` confirms `textarea: 0`, `select: 0`, `radio: 0`, `switch: 0`.
`OBSERVED(n=0, pages=[all 8])`

> Every state rule for those four is `PRESCRIPTIVE`. Inherit the **input** state model verbatim:
> `ring ring-kumo-line` at rest → `focus:ring-kumo-focus/50 focus:ring-[1.5px]` → `aria-invalid` → `ring-kumo-danger`.
> A switch's "on" state should use `--color-kumo-brand` (the same token the keyboard ring uses), not a
> new colour.

---

## 6. Selected / open / current — style the state attribute, don't invent a class

The system never invents a `.is-open` class. It reacts to the attribute the a11y layer already sets.

| Attribute | Where | Styling hook seen |
|---|---|---|
| `aria-expanded` (425 raw, all 8) | every disclosure/menu/combobox trigger | — |
| `data-state="open"` (20 raw, all 8) | dropdowns, dialogs | `data-[state=open]:bg-kumo-base` ×21 |
| `aria-selected` (24 raw, 3 pages) | tabs, listbox rows | `aria-selected:text-kumo-default` ×10, `aria-selected:font-medium` ×2, `aria-selected:hover:bg-kumo-tint` ×2 |
| `aria-checked` (24 raw, all 8) | checkboxes | — |
| `aria-current` (9 raw, 6 pages) | the active nav item | nav uses `has-[[data-active]]:bg-transparent` + `hover:bg-(--sidebar-active-bg)` |

`DERIVED(from=capture/*.html — 8 pages)`

Note the **selected-tab** treatment: `aria-selected:text-kumo-default` **plus** `aria-selected:font-medium` —
weight, not just colour. That is the house style for "selected", and it is why selection survives greyscale.

> **DO** write `data-[state=open]:…` / `aria-selected:…` variants.
> **DON'T** toggle a bespoke class from JS and style that — you'll drift from the a11y state.
> See [`../../components/tabs-segmented.md`](../../components/tabs-segmented.md) and [`../../components/menus-dropdowns.md`](../../components/menus-dropdowns.md).

---

## 7. Status: never colour alone

`facts.json` → `usage.statusIntent` is an **empty object `{}`** — **no status-intent utility classes were
captured at all.** Everything in this section is therefore `DERIVED(from=tokens.json)` or `PRESCRIPTIVE`.

The intent tokens exist in two parallel families, and **they are not interchangeable**:

| Intent | Mark / border / ring | Fill | Text |
|---|---|---|---|
| Danger | `--color-kumo-danger` | `--color-kumo-danger-tint` | `--text-color-kumo-danger` |
| Warning | `--color-kumo-warning` | `--color-kumo-warning-tint` | `--text-color-kumo-warning` |
| Success | `--color-kumo-success` | `--color-kumo-success-tint` | `--text-color-kumo-success` |
| Info | `--color-kumo-info` | `--color-kumo-info-tint` | `--text-color-kumo-info` |

`DERIVED(from=tokens.json)`

**Why the split is load-bearing:** in light mode `--color-kumo-warning` is `oklch(79.5% .184 86.047)` — a
bright yellow that cannot carry text on white. `--text-color-kumo-warning` is `oklch(47.6% .114 61.907)` — a
dark brown. Using the *surface* token for warning **text** is the single most likely contrast failure in this
system. `DERIVED(from=tokens.json)`

> **DO** compose status as **icon + text + colour**. Icon sizes are already there: `facts.json` →
> `icons.sizesByUse` shows **12px → 196 uses** (dominant) and **16px → 42** `OBSERVED(pages=[all 8])`.
> **DO** use `-tint` for the fill, the base token for the border/mark, and `--text-color-kumo-*` for the label.
> **DON'T** signal success/failure with colour alone — ~1 in 12 men can't separate the green from the red,
> and `forced-colors` mode flattens both.
> **DON'T** use `--color-kumo-warning` as a text colour. Use `--text-color-kumo-warning`.

See [`../../components/badges-status.md`](../../components/badges-status.md) for the badge shapes and [`../colors.md`](../colors.md) for the full ramps.

---

## 8. Empty states — **not observed; design them deliberately**

There is **no rendered empty state in any of the 8 captures.** The `cf-EmptyState.*.js` chunk *is*
module-preloaded on `api-tokens`, `billing` and `workers-and-pages` — so the component exists in the app —
but no page was captured in an empty condition. `DERIVED(from=capture/*.html)`

**Everything below is `PRESCRIPTIVE` (not observed in the captures):**

| Kind of empty | What it means | Treatment |
|---|---|---|
| **First-run** (never had data) | onboarding moment | Explain the object, then a **primary action** (§9). Icon at the 48px rung — `icons.sizesByUse` shows 48px ×9, the illustration rung `OBSERVED(pages=[all 8])`. |
| **Filtered to nothing** (has data, query excludes it) | user error, recoverable | Say what was filtered, offer **"clear filters"** as a *secondary* control. Never show onboarding copy here. |
| **Error / failed to load** | system failure | `--text-color-kumo-danger` + icon + **retry**. Do not reuse the first-run illustration. |
| **Permission-denied** | not your fault, not fixable here | Explain, link out. No CTA that will fail. |

Container: `--color-kumo-base` surface, `ring-kumo-line`, `rounded-lg` (`rounded-lg` = **946** uses, the
dominant radius `OBSERVED(pages=[all 8])`), body copy at `text-sm`.

> **DON'T** ship one generic "Nothing here" for all four. The three recoverable ones each need a different
> next action, and that action *is* the design.
> **DON'T** put a skeleton where an empty state belongs — an infinite shimmer reads as a hang.

---

## 9. The primary action, grounded in the **real** control heights

### 9.1 Read heights from `usage.controlHeights`, never from raw `h-*` frequency

`facts.json` gives you two different things. Only one is a control height.

| Field | Values | What it is |
|---|---|---|
| `usage.controlHeights` ✅ | `h-8: 24`, `h-9: 32`, `h-10: 2` | **REAL control heights** — square icon/avatar boxes already excluded. 58 controls total. |
| `usage.rawControlHeightClasses` ❌ | `h-12: 44`, `h-9: 41`, `h-8: 33`, `h-11: 7`, `h-14: 4`, `h-10: 2` | Every `h-*` on the page, **including layout boxes**. `h-12` is the *most frequent* here and is **not a control height**. |
| `usage.squareBoxes` ❌ | `w-6 h-6: 2` | Square ⇒ **icon button / avatar**, not a text-control height. `usage.iconWidths` = `w-6: 2` confirms. |

`OBSERVED(pages=[all 8])`

> **The trap:** `h-12` (48px) has the highest raw count of any `h-*` class. It is **not** a button size.
> Quoting it as "the large CTA" would be a fabrication. Read `controlHeights`, full stop.

### 9.2 The size ladder that actually exists

`usage.controlHeightsByTag` → `button: { h-8: 16, h-9: 26, h-10: 2 }`, `a: { h-8: 8, h-9: 6 }`
`usage.buttonHeightTypePairs` → `h-8 | text-sm: 8`, `h-8 | text-base: 8`, `h-9 | text-base: 8`, `h-10 | text-base: 2`
`OBSERVED(pages=[all 8])`

| Size | Height | Type class | When |
|---|---|---|---|
| **`h-9` (36px) — the default** | most common button height (**26** of 44 buttons) | **`text-base`** (= **14px**, not 16 — see [`../typography.md`](../typography.md)) | **The primary action.** Also the text-field height, so a button next to an input lines up for free. |
| `h-8` (32px) — compact | **24** controls overall (16 buttons + 8 links) | `text-sm` (13px) *or* `text-base` | Toolbars, table row actions, the sidebar rail, anything in a dense strip. |
| `h-10` (40px) | **n=2** | `text-base` | Exists. **Not a size in your vocabulary** — two instances is noise, not a tier. |

> **There is no hero/XL CTA size in this system.** The tallest real control is **40px**, seen twice.
> If you need more presence, get it from **surface + weight** (`--color-kumo-brand` fill, `font-medium`),
> **not** from height. `DERIVED(from=facts.json usage.controlHeights)`

### 9.3 The primary action, fully specified

```
h-9  text-base  px-3  gap-1.5  rounded-lg  font-medium
ring ring-kumo-line  shadow-xs
not-disabled:hover:bg-kumo-tint
active:text-kumo-strong
focus:outline-none  focus:ring-kumo-focus/50
focus-visible:ring-2  focus-visible:ring-kumo-brand
disabled:cursor-not-allowed  disabled:bg-kumo-base/50  disabled:!text-kumo-default/70
transition-[color,background,border,box-shadow]  duration-250
motion-reduce:transition-none
```

The padding and radius are the dominant values in `facts.json` → `usage.spacing` / `usage.radius`:
`px-3` **890**, `rounded-lg` **946**. The gap is **not**: the button's icon↔label gap is `gap-1.5` **75**
(`usage.spacing`) — the same value [`../../components/buttons.md`](../../components/buttons.md) ships on the
default `md` button. `gap-2` (**1572**, the largest spacing count in the system) is the gap *between* adjacent
things — stack and row rhythm, see [`./spacing-layout-usage.md`](./spacing-layout-usage.md) §3 — **not** the gap
*inside* a control. `OBSERVED(pages=[all 8])`
The state and transition classes are the 80×-repeated button string. `DERIVED(from=capture/*.html)`

> **Icon-only variant:** make it **square** (`size-8` / `size-9`), add `focus-visible:ring-inset`, and give it
> an `aria-label`. A square box is an *icon button* — it never enters the height ladder above.

---

## 10. Motion

### 10.1 The tokens (this is the whole scale)

| Token | Value | Role |
|---|---|---|
| `--default-transition-duration` | `.1s` | the framework default |
| `--default-transition-timing-function` | `cubic-bezier(.4, 0, .2, 1)` | = `--ease-in-out` |
| `--ease-in` | `cubic-bezier(.4, 0, 1, 1)` | element **leaving** |
| `--ease-out` | `cubic-bezier(0, 0, .2, 1)` | element **entering** |
| `--ease-in-out` | `cubic-bezier(.4, 0, .2, 1)` | element **moving/resizing** in place |

`DERIVED(from=tokens.json)` — there are exactly **3** easing tokens (`facts.json` → `tokens.groups.ease: 3`).
`OBSERVED(n=3, pages=[all 8])`

Raw-CSS easing frequency confirms restraint: `ease` **304**, `linear` **28**, and a long tail of one-off
cubic-beziers. `OBSERVED(facts.json → motion.easings, pages=[all 8])`

### 10.2 Which duration for which state change

Top raw-CSS durations (`facts.json` → `motion.durations`): `.2s` **67**, `.1s` **41**, `.4s` **35**,
`.15s` **33**, `0s` **31**, `.5s` **22**, `.25s` **19**. `OBSERVED(pages=[all 8])`

In the DOM the utility scale is tight — `duration-150` **696**, `duration-200` **180**, `duration-100` **36**,
`duration-250` **35**, `duration-300` **18**. `DERIVED(from=capture/*.html — 8 pages)`

| Change | Duration | Easing |
|---|---|---|
| Hover / active / focus colour + ring | **150ms** (the overwhelming default — `duration-150` always rides with `transition-[color]`, 696 uses) | default (`ease-in-out`) |
| Micro-feedback (press) | **100ms** (`--default-transition-duration`) | default |
| Transform, opacity, chevron rotation | **200ms** | `ease-out` entering, `ease-in` leaving |
| Layout-affecting (sidebar collapse, disclosure grid rows) | **250ms** | `ease-in-out` |
| Drawer / sheet slide | **300ms** | `ease-in-out` |

`DERIVED(from=capture/*.html + tokens.json)` — see [`../elevation-motion.md`](../elevation-motion.md) §2.3 for the normalized ladder.

### 10.3 Enumerate the properties — never `transition-all`

The two bundles the system actually ships:

| Bundle | Count | On |
|---|---|---|
| `transition-[color,box-shadow,outline]` | 112 | nav items & controls — the **focus/hover bundle** (colour, ring, outline move together) |
| `transition-[color,background,border,box-shadow]` | 8 | the standard button |
| `transition-[color]` | 696 | the plain text-colour hover |

`DERIVED(from=capture/*.html — 8 pages)` · Raw-CSS `transition-property` (`facts.json` → `motion.transitionProps`)
tops out at `opacity` **64**, `color` **37**, `border-color` **36**, `transform` **34**, `background-color` **33**,
`box-shadow` **27**, `outline-color` **15** — with `all` at only **25**. `OBSERVED(pages=[all 8])`

> **DO** list the properties. The ring is a `box-shadow`; if you forget it, the focus ring **snaps** in while
> the colour fades — the single most common polish bug in this system.
> **DON'T** use `transition-all`. It animates `height`/`width`/`padding` you didn't mean to, and it's why the
> raw `all` count exists at all.

### 10.4 Reduced motion is **not optional** — it's already the house rule

`motion-reduce:transition-none` appears **200×** (25 per page, on **every** page).
`DERIVED(from=capture/*.html — 8 pages)`
`facts.json` → `motion.prefersReducedMotionRules` = **41** raw-CSS blocks. `OBSERVED(n=41, pages=[all 8])`
`motion-safe:` is used only on `home-overview` (16 raw) — the *opt-in* form, for the decorative stuff.
`DERIVED(from=capture/*.html)`

| You are animating | Under `prefers-reduced-motion: reduce` |
|---|---|
| A `transition-*` on a state change | pair it with **`motion-reduce:transition-none`**. The end state must still be correct — reduced motion removes the *tween*, not the *feedback*. |
| An **infinite** animation (`animate-pulse`, `skeleton`, `shimmer`, `pulse-sparkline`) | **stop it.** Keep the placeholder surface (a static grey block still says "loading"), kill the loop. Vestibular triggers are worst with looping motion. |
| A decorative entrance (`fade-move-up`, `bounce-in`, `float`, `toast-bump` — all in `motion.keyframeNames`) | gate the whole thing behind **`motion-safe:`** so it simply never runs. |

> **DON'T** ship a `transition-*` utility without its `motion-reduce:` twin. 25 per page is the standard —
> match it.
> **DON'T** let a reduced-motion user lose the *state*: `motion-reduce:transition-none` still leaves the
> focus ring, the hover surface, and the open state fully painted.

---

## 11. The state matrix — one glance

| State | Selector / attribute | Visual | Tag |
|---|---|---|---|
| **rest** | — | `ring ring-kumo-line`, `bg-kumo-base`, `shadow-xs` | `DERIVED(from=capture/*.html)` |
| **hover** | `not-disabled:hover:` | `bg-kumo-tint` (surfaced) · `bg-(--sidebar-active-bg)` (nav) · `text-kumo-default→strong` | `DERIVED(from=capture/*.html)` |
| **active/pressed** | `active:` | `text-kumo-strong` (no dedicated surface token exists) | `DERIVED(from=tokens.json)` |
| **focus (any)** | `focus:` | `outline-none` + `ring-kumo-focus/50` | ×80/896 · `DERIVED(from=capture/*.html)` |
| **focus (keyboard)** | `focus-visible:` | `ring-2 ring-kumo-brand` (+ `ring-inset` if square) | ×80 · `DERIVED(from=capture/*.html)` |
| **open** | `data-[state=open]:` | `bg-kumo-base` | ×21 · `DERIVED(from=capture/*.html)` |
| **selected** | `aria-selected:` | `text-kumo-default` **+ `font-medium`** | ×10/×2 · `DERIVED(from=capture/*.html)` |
| **disabled** | `disabled:` / `data-[disabled]:` | `cursor-not-allowed` + `text-kumo-subtle` + `bg-kumo-base/50` | ×62 · `DERIVED(from=capture/*.html)` |
| **loading (region)** | — | `.skeleton` / `.skeleton-line` + `shimmer` | 1 page · `DERIVED(from=capture/*.html)` |
| **loading (action)** | `aria-busy` | spinner, label retained | **`PRESCRIPTIVE`** — `animate-spin` and `aria-busy` are both **0×** |
| **invalid** | `aria-invalid="true"` | wrapper `has-[…]:ring-kumo-danger` | ×4 · `DERIVED(from=_classes.json)` |
| **readonly** | `readonly` | keep surface + focus, drop caret | **`PRESCRIPTIVE`** — `readonly` is **0×** |
| **empty** | — | see §8 | **`PRESCRIPTIVE`** — not rendered in any capture |

---

## 12. The five rules that matter most

1. **Never remove the focus ring.** `focus:outline-none` is on 896 nodes; the ring is the only thing left.
2. **Two-layer focus:** `focus:ring-kumo-focus/50` (neutral, any focus) + `focus-visible:ring-2 ring-kumo-brand` (brand, keyboard).
3. **Never signal status with colour alone** — icon + text + colour, and use `--text-color-kumo-*` for text, `--color-kumo-*` for marks.
4. **Read control heights from `usage.controlHeights` (`h-8`/`h-9`/`h-10`), not raw `h-*` counts.** A square box (`size-8`, `w-6 h-6`) is an icon button. There is no hero CTA size.
5. **Every transition ships `motion-reduce:transition-none`; every infinite loop stops under reduced motion.**

---

### Related
[`../usage-guidelines.md`](../usage-guidelines.md) (hub) ·
[`../colors.md`](../colors.md) ·
[`../elevation-motion.md`](../elevation-motion.md) ·
[`../typography.md`](../typography.md) ·
[`../spacing-layout.md`](../spacing-layout.md) ·
[`../iconography.md`](../iconography.md) ·
[`../../components/buttons.md`](../../components/buttons.md) ·
[`../../components/forms.md`](../../components/forms.md) ·
[`../../components/feedback-overlays.md`](../../components/feedback-overlays.md) ·
[`../../components/badges-status.md`](../../components/badges-status.md) ·
[`../../components/menus-dropdowns.md`](../../components/menus-dropdowns.md) ·
[`../../components/tabs-segmented.md`](../../components/tabs-segmented.md) ·
[`../../tokens.json`](../../tokens.json)
