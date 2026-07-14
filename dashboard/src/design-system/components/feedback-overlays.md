# Feedback & Overlays

Tooltip · Popover · Toast/Notification · Banner · Modal/Dialog (+ Drawer), extracted from **cloudflare-dashboard** (`https://dash.cloudflare.com`).

Recipes: [`feedback-overlays.css`](./feedback-overlays.css) · Tokens: [`../tokens/colors.css`](../tokens/colors.css) · Elevation & z ladder: [`../foundations/elevation-motion.md`](../foundations/elevation-motion.md)

---

## 0. Provenance — read this first

This target is classified **`utility-compiled`** (`classification.json`: score `1.0`; `token-driven` `0.813`; `computedStyleMandatory: true`). Named classes do **not** carry values — atomic Tailwind utilities do. So every value below was transcribed from the **compiled stylesheet** + the **rendered DOM** in `capture/`, and resolved through the token layer, exactly as the classification's own recommendation instructs.

### The one thing that shapes this whole document

**Every overlay in this system is portal-mounted, and every overlay was CLOSED at capture time.** Tooltips, popovers, dialogs, drawers and toasts only enter the DOM on open. What we *did* capture:

- **All the triggers**, with their full utility class strings intact (`data-kumo-component="Popover"`, `data-kumo-component="Dialog"`, `data-base-ui-click-trigger`, `id="base-ui-:r1o:"`).
- **The entire compiled recipe for every popup**, still sitting in the stylesheet unused: the elevation shadow, the arrow fills, the popup outline colour, the complete toast stack math, the toast keyframes, the banner surfaces, and the `[role=region]:has([data-kumo-component=Toast])` z-index rule.
- **A full modal DOM tree** from the legacy `@cloudflare/component-modal` (its `data-source-file` attributes survived).

So the *values* are strong and the *panel geometry* (paddings, widths) is inferred. Each rule in the CSS is labelled.

### Status by component

| Component | Status | Evidence |
|---|---|---|
| **Elevation shadow** (all overlays) | **OBSERVED, verbatim** | `shadow-[0_0_1px_0.5px_var(--color-kumo-shadow-edge),0_1px_2px_var(--color-kumo-shadow-drop)]` |
| **Tooltip** popup | **OBSERVED marker + colours** | `.kumo-tooltip-popup`; `[data-mode=dark] … { outline-offset:-1px }`; `.outline-tooltip-border`; `.fill-kumo-tip-stroke` / `.fill-kumo-tip-shadow` |
| **Popover** popup | **OBSERVED marker + trigger** | `.kumo-popover-popup`; trigger with `aria-haspopup="dialog"` |
| **Dialog / Modal** | **OBSERVED anatomy** | `@cloudflare/component-modal` tree: `Modal.tsx:109` → `Modal.tsx:110` → `BaseModal.js:93` → `BaseModal.js:105` |
| **Modal scrim / backdrop** | **PRESCRIPTIVE** | No scrim rule, no `backdrop-filter` anywhere in `_classes.json` |
| **Modal sizes** | **PRESCRIPTIVE** | Snapped to the mined `--container-*` scale |
| **Toast** | **OBSERVED, verbatim (CSS only)** | Full Base UI stack math + `slide-up`/`slide-down`/`toast-bump` keyframes + `[role=region]:has([data-kumo-component=Toast]){z-index:var(--z-index-toast)}` |
| **Toast** in the DOM | **not rendered** | Zero `data-kumo-component="Toast"` across 8 pages — none were firing |
| **Banner** | **OBSERVED tokens + layout hook** | `--color-kumo-banner-info`, `--color-kumo-banner-warning`, `--preview-banner-height` |
| **Banner** success/danger intents | **PRESCRIPTIVE** | Only **two** banner tokens exist (info, warning) |
| **Drawer / side sheet** | **OBSERVED, verbatim** | Full class string in the DOM (`z-[1150]`, `bg-kumo-overlay`, `border-l border-kumo-line`) |
| Tooltip/popover **arrow geometry** | **PRESCRIPTIVE** | The two fill *tokens* are exact; the size is unrecoverable |

`facts.json` counts across 8 pages: **dialog 95 raw / 25 deduped**, **tooltip 34 raw / 27 deduped**, **menu 25/11**, **badge 136/17**. `data-kumo-component` in the DOM yields `Popover ×1` and `Dialog ×1` (their triggers).

### ⚠️ Two traps in the capture

1. **`role="dialog" aria-modal="true"` on every page is NOT the design system.** It is the **OneTrust cookie consent** vendor widget (`#onetrust-pc-sdk`, `z-index: 2147483647`, `border-radius: 2.5px`). It shares nothing with Kumo. Ignore it.
2. **`.__react_component_tooltip` is a legacy vendor tooltip** (`react-tooltip`), still shipped and still used on the Notifications page (`id="cf_component_tooltip_1"`, `role="status"`, `data-tip`, `data-for`). It is **untokenized** and contradicts the house style. See §2.6 — documented for *identification*, not for porting.

---

## 1. The shared overlay box

Tooltip, popover, menu panel, dialog panel and toast are all the **same surface**. Composing it once is the single highest-leverage thing in this file.

```css
background-color: var(--color-kumo-base);
color:            var(--text-color-kumo-default);
border-radius:    var(--radius-lg);                    /* .5rem — 946 uses */
outline:          1px solid var(--color-tooltip-border);
box-shadow:
  0 0 1px 0.5px var(--color-kumo-shadow-edge),         /* contact rim  */
  0 1px 2px     var(--color-kumo-shadow-drop);         /* cast shadow  */
```

Four things to internalise:

| Trait | Why it matters |
|---|---|
| **The hairline is an `outline`, not a `border` or a `ring`** | The target ships `.outline-tooltip-border` for exactly this. An outline is out-of-flow, which is what a portal-ed popup needs. In dark mode it flips to `outline-offset: -1px` so the line reads as an inner rim. This is the *only* CSS rule in the entire stylesheet that mentions `.kumo-tooltip-popup` / `.kumo-popover-popup`. |
| **The shadow is tiny** | 1px rim + 2px cast. This system does **not** float things on big soft shadows. There is no `shadow-md`/`shadow-lg` in it — do not invent one. |
| **`--color-kumo-shadow-edge` inverts** | Black `/.12` in light → **white `/.1` in dark**. In dark mode the "shadow" rim is a *top light*. Never hardcode it. |
| **`--radius-lg` (0.5rem) is the house radius** | 946 uses vs. 21 for `rounded-md`. An overlay is never rounder than its trigger. |

### The trigger (shared by tooltip, popover and dialog)

Mined verbatim off `<button data-kumo-component="Popover">` and `<button data-kumo-component="Dialog">`:

```
group flex shrink-0 items-center font-medium select-none border-0
h-9 gap-1.5 rounded-lg px-3 text-base
bg-kumo-base !text-kumo-default ring ring-kumo-line shadow-xs
not-disabled:hover:bg-kumo-tint
focus:outline-none focus:ring-kumo-focus/50
focus-visible:ring-2 focus-visible:ring-kumo-brand
data-[state=open]:bg-kumo-base
disabled:cursor-not-allowed disabled:bg-kumo-base/50 disabled:!text-kumo-default/70
```

**The focus indicator in this system is a `ring` (box-shadow), not an `outline`.** It has two rungs:

| State | Ring |
|---|---|
| rest | `1px` `--color-kumo-line` |
| `:focus` (pointer) | `1px` `--color-kumo-focus` @ 50% — a soft tint. `--color-kumo-focus` **inverts** (near-black light / near-white dark) |
| `:focus-visible` (keyboard) | **`2px` `--color-kumo-brand`** — the real indicator |

Icon-only trigger = `size-9 p-0 justify-center` (a 36px square).

---

## 2. Tooltip

Non-interactive, hover/focus-triggered label. Source marker: **`.kumo-tooltip-popup`**.

### 2.1 Anatomy

```
┌─ trigger ────────┐   aria-describedby → popup id
│  [icon]          │   data-state="open|closed"
└──────────────────┘
        │ portal, 6px offset
        ▼
┌─ .ds-tooltip ─────────────────────┐   role="tooltip"
│  [icon]  Label            [⌘K]    │   .ds-tooltip__kbd flushes right
└───────────────▲───────────────────┘
                └ .ds-overlay-arrow  fill = tip-stroke, drop-shadow = tip-shadow
```

### 2.2 The arrow — the most interesting mined detail

Two tokens, and they are **mutually exclusive per theme**:

| Token | Light | Dark |
|---|---|---|
| `--color-kumo-tip-stroke` | `transparent` | `neutral-800` |
| `--color-kumo-tip-shadow` | `gray-200` | `transparent` |

So the arrow paints **both** and exactly one contributes: in light it picks up a soft grey drop-shadow edge; in dark it picks up a hard hairline stroke. That's why the utilities `.fill-kumo-tip-stroke`, `.fill-kumo-tip-shadow` and `.shadow-kumo-tip-shadow` all exist. Paint both — the transparent one is a no-op.

### 2.3 Variants

| Variant | Class | Notes |
|---|---|---|
| Default | `.ds-tooltip` | Single flex row, `text-sm` (13px), `pointer-events: none` |
| Rich | `.ds-tooltip--rich` | Block layout, `__title` (strong) + `__description` (subtle), `max-w` 18rem |
| With shortcut | `+ .ds-tooltip__kbd` | Matches the observed `<kbd class="text-xs/4">` (8 uses) |
| Intent | `--info` `--success` `--warning` `--danger` | **PRESCRIPTIVE.** Tints the *text*, keeps the neutral surface — this system never repaints a surface to signal status |

### 2.4 Sizes

The tooltip is effectively **one size** in this system. Only the type ramp moves.

| Size | Font | Padding |
|---|---|---|
| `--sm` | `--text-xs` (12px) | `py-1 px-2.5` |
| `--md` *(default)* | `--text-sm` (13px) | `py-1.5 px-2.5` |

### 2.5 Placement & states

Base UI stamps `data-side` (`top` `bottom` `left` `right`) and `data-align` (`start` `center` `end`) on the popup. The recipe sets `transform-origin` per side so the scale-in grows **out of the trigger**, and applies the `--ds-popup-offset` (6px, prescriptive) as a margin.

| State | Attribute | Style |
|---|---|---|
| Opening | `[data-starting-style]` | `opacity: 0; scale: 0.9` → transitions to 1 |
| Open | *(none)* | `opacity: 1; scale: 1` |
| Closing | `[data-ending-style]` | `opacity: 0; scale: 0.9` |
| Instant (moving between adjacent triggers) | `[data-instant]` | Base UI suppresses the transition — leave it alone |
| Disabled trigger | `:disabled` | Do **not** attach a tooltip to it — it cannot receive focus. Wrap it. |

Transition: `opacity, transform` @ `0.2s ease` (the site-wide dominant pair — 17 and 15 occurrences in `motion-data.json`).

### 2.6 The legacy tooltip — identify, do not port

`_classes.json` carries a complete `react-tooltip` stylesheet. It is genuinely on the page (Notifications, `id="cf_component_tooltip_1"`).

| Trait | Legacy value | Kumo value |
|---|---|---|
| Radius | `3px` | `--radius-lg` (8px) |
| Padding | `8px 21px` | `py-1.5 px-2.5` |
| Surface | `#222` hardcoded (`.type-dark`) | `--color-kumo-base` |
| Open opacity | `0.9` | `1` |
| z-index | `999` | `--ds-z-dropdown` (110) |
| Placement | `.place-top/bottom/left/right` + CSS-triangle `:before`/`:after` (10px/8px, 6px/5px) | `data-side` + SVG arrow |
| Intents | `.type-dark/light/info/success/warning/error` — `#337AB7`, `#8DC572`, `#F0AD4E`, `#BE6464` | Token-driven |
| Role | `role="status"` ⚠️ | `role="tooltip"` |

Every one of those hexes is a Bootstrap-era default. **None of them are design tokens.** The legacy tooltip also uses `role="status"`, which makes it a live region — wrong for a tooltip, and it will spam a screen reader on every hover.

---

## 3. Popover

Interactive, click-triggered floating panel. Source marker: **`.kumo-popover-popup`**.

### 3.1 Anatomy

```
┌─ .ds-overlay-trigger ────┐  aria-haspopup="dialog"   ← note: "dialog", not "menu"
│  📅  Last 24 hours   ⌄   │  aria-expanded  data-state  data-kumo-part="trigger"
└──────────────────────────┘  data-base-ui-click-trigger
        │
        ▼
┌─ .ds-popover ─────────────────────┐
│ ┌ __header  h-14 px-4 ──────────┐ │  bg-kumo-elevated, rounded-t-lg, subtle text
│ │  Title                    [×] │ │
│ └───────────────────────────────┘ │
│ ┌ __body    p-4 gap-3 ──────────┐ │  bg-kumo-base
│ │  __item (hover → kumo-overlay)│ │
│ │  ───── __separator ────────── │ │
│ └───────────────────────────────┘ │
│ ┌ __footer  py-3 px-4 ──────────┐ │  bg-kumo-elevated, hairline top
│ │                [Cancel][Apply]│ │
│ └───────────────────────────────┘ │
└───────────────▲───────────────────┘
                └ arrow (optional)
```

**Cloudflare's popover trigger advertises `aria-haspopup="dialog"`, not `menu`.** That is deliberate and it is the correct call for a popover with focusable content — mirror it. (`aria-haspopup="menu"` and `="listbox"` also appear in the capture, on actual menus and comboboxes respectively.)

The `__header` metrics are **observed** off the one floating panel that *was* in the DOM: `h-14 px-4 gap-2 text-base font-medium text-kumo-subtle bg-kumo-elevated rounded-t-lg hover:bg-kumo-overlay`.

### 3.2 Variants & sizes

| Size | min / max width | Container tokens |
|---|---|---|
| `--sm` | 16rem / 20rem | `--container-3xs` → `--container-xs` |
| `--md` *(default)* | 20rem / 24rem | `--container-xs` → `--container-sm` |
| `--lg` | 24rem / 28rem | `--container-sm` → `--container-md` |

Sizes are **PRESCRIPTIVE**, snapped to the mined `--container-*` scale. Height is capped by Base UI's `--available-height`; the body scrolls with `overscroll-behavior: contain`.

### 3.3 States

| State | Selector | Style |
|---|---|---|
| Trigger open | `[data-state="open"]` | `bg-kumo-base` (MINED — the trigger *stays* base, it doesn't darken) |
| Row hover | `:hover` | `bg-kumo-overlay` (MINED — `.hover\:bg-kumo-overlay`) |
| Row keyboard-active | `[data-highlighted]` | `bg-kumo-overlay` (MINED — `.data-highlighted\:bg-kumo-overlay`) |
| Row focus | `:focus-visible` | 2px `--color-kumo-brand` ring |
| Entering / leaving | `[data-starting-style]` / `[data-ending-style]` | `opacity: 0; scale: 0.9` |

> In light mode `--color-kumo-overlay` is `neutral-50` — **almost white**. It is a *hover fill*, not a scrim. The name is a false friend; do not use it for a modal backdrop.

---

## 4. Modal / Dialog

### 4.1 Anatomy — OBSERVED

Straight from the `data-source-file` attributes on the live modal in `workers-and-pages.html`:

```
.ds-dialog-backdrop        ← Modal.tsx:109      fixed, covers viewport (the scrim)
  .ds-dialog-positioner    ← Modal.tsx:110      centers, scrolls when tall
    .ds-dialog-focus-trap  ← BaseModal.js:93    role="presentation" tabindex="-1" id="focusFallback"
      .ds-dialog           ← BaseModal.js:105   role="dialog" aria-modal="true"
                                                aria-labelledby="…-modal-title"
        <h1 id="…-modal-title">     → .ds-dialog__title
        <img alt="">                → decorative illustration
        <p>…</p>                    → .ds-dialog__body
        <button>Resend email</button> → .ds-dialog__footer
```

Two details worth stealing:

1. **The focus fallback is its own node.** `role="presentation" tabindex="-1" id="focusFallback"` wraps the dialog. When the dialog has no natural first focus target, focus lands here instead of escaping to `<body>`. Base UI / Radix do this for you (`initialFocus`), but the intent is explicit in this source.
2. **The title is an `<h1>` carrying the exact id that `aria-labelledby` points at.** Not `aria-label` on the dialog. Keep the association in the DOM.

### 4.2 The scrim — PRESCRIPTIVE, and here is the trap

**No scrim rule and no `backdrop-filter` declaration exists anywhere in the capture.** So this is the one honest guess in the file — and it needs an explanation, because the obvious choices are all wrong:

| Candidate token | Light | Dark | Verdict |
|---|---|---|---|
| `--color-kumo-overlay` | `neutral-50` (near-white) | `neutral-800` | ❌ It's a **hover fill**. Near-white scrim in light mode. |
| `--color-kumo-contrast` | `neutral-975` (near-black) | `neutral-25` (near-white) | ❌ **Inverts.** Near-white scrim in dark mode. |
| `--color-kumo-focus` | near-black | near-white | ❌ Same inversion. |
| `--color-kumo-shadow-drop` | black `/.08` | black `/.3` | ❌ Far too weak to be a scrim. |

**This system has no semantic token that stays dark in both themes** — because it never needed one. So the recipe anchors the scrim on the theme-invariant *palette primitive* `--color-neutral-950` and exposes the strength as a knob:

```css
--ds-scrim-color: var(--color-neutral-950);   /* palette primitive, does not flip */
--ds-scrim-opacity: 50%;
background-color: color-mix(in oklab, var(--ds-scrim-color) var(--ds-scrim-opacity), transparent);
```

Variants: `.ds-dialog-backdrop--subtle` (30%) and `.ds-dialog-backdrop--blur` (uses the **mined** `--blur-xs` = 4px; applying it to a scrim is still prescriptive). The mined blur scale is `--blur-xs 4px · --blur-sm 8px · --blur-md 12px · --blur-xl 24px` (no `lg`).

### 4.3 Sizes — PRESCRIPTIVE

| Size | max-width | Container token | Use for |
|---|---|---|---|
| `--sm` | 24rem | `--container-sm` | Confirm / destructive alert |
| `--md` *(default)* | 28rem | `--container-md` | Standard dialog |
| `--lg` | 36rem | `--container-xl` | Forms |
| `--xl` | 48rem | `--container-3xl` | Tables, previews |
| `--full` | 100% | — | Takeover; radius drops to 0 |

Add `.ds-dialog--scroll` when the body scrolls: it hairlines the header and footer so the scroll boundary is legible, and tints the footer `--color-kumo-elevated`.

### 4.4 Intent variants — PRESCRIPTIVE

**The panel stays neutral. Intent lives in the icon.** That is the rule across this entire design system — no kumo surface is ever repainted to signal status.

```html
<div class="ds-dialog ds-dialog--sm ds-dialog--danger">
  <div class="ds-dialog__header">
    <span class="ds-dialog__icon"><!-- lucide TriangleAlert --></span>
    <h2 class="ds-dialog__title">Delete API token?</h2>
  </div>
  …
</div>
```

`--info` `--success` `--warning` `--danger` map to `--color-kumo-{intent}-tint` (icon background) + `--text-color-kumo-{intent}` (icon fill).

### 4.5 States

| State | Selector | Style |
|---|---|---|
| Opening | `[data-starting-style]` | Backdrop `opacity: 0`; panel `opacity: 0; scale: 0.985` |
| Open | — | Full |
| Closing | `[data-ending-style]` | Reverse |
| Body scroll lock | — | Handled by the primitive; do not also set `overflow: hidden` yourself |

Large surfaces use **`scale(0.985)`**, not `scale(0.9)` — that split is mined (`.data-starting-style\:scale-\[0\.985\]` vs `.data-starting-style\:scale-90`). Big things move less. Respect it.

### 4.6 Drawer / side sheet — OBSERVED

Mined verbatim from the DOM:

```
flex flex-col fixed right-0 border-l border-kumo-line
top-[var(--preview-banner-height,0px)]
h-[calc(100vh-var(--preview-banner-height,0px))]
bg-kumo-overlay transition-[width,transform] duration-300 ease-in-out z-[1150]
```

Note it uses `bg-kumo-overlay` (the *fill*, not the base) and enters via `translate-x-full`. The recipe keeps every trait but drives `z` off the real `--z-index-drawer` token.

---

## 5. Toast / Notification

**This is Base UI's Toast, and its entire recipe is in the compiled stylesheet** — even though no toast was firing at capture time (`data-kumo-component="Toast"` appears **0 times** across 8 pages). Everything in this section is mined verbatim.

### 5.1 Anatomy

```
┌─ .ds-toast-viewport ────────────────────────┐  [role="region"]
│  z-index: var(--z-index-toast)  /* 1000000 */│  aria-label="Notifications"
│  --gap: .75rem   --peek: .75rem              │
│                                              │
│   ┌ .ds-toast  [--toast-index: 2] ┐  ← back, scaled .8, peeking
│  ┌─ .ds-toast [--toast-index: 1] ─┐          │  scaled .9
│ ┌── .ds-toast [--toast-index: 0] ──────────┐ │  ← frontmost, scale 1
│ │ [icon] Title                        [×]  │ │
│ │        Description                       │ │
│ │        [Action]                          │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 5.2 The stack math — MINED VERBATIM

```css
/* on the viewport */
--gap:  0.75rem;
--peek: 0.75rem;

/* on each toast */
--height: var(--toast-frontmost-height, var(--toast-height));
--scale:  calc(max(0, 1 - (var(--toast-index) * 0.1)));   /* 10% smaller per rung */
--shrink: calc(1 - var(--scale));
--offset-y: calc(
  var(--toast-offset-y) * -1
  + calc(var(--toast-index) * var(--gap) * -1)
  + var(--toast-swipe-movement-y)
);

z-index: calc(1000 - var(--toast-index));   /* newer toast → lower index → on top */

/* collapsed pile */
transform:
  translateX(var(--toast-swipe-movement-x))
  translateY(calc(
    var(--toast-swipe-movement-y)
    - (var(--toast-index) * var(--peek))
    - (var(--shrink) * var(--height))
  ))
  scale(var(--scale));

/* hovered / focused — the pile fans out */
&[data-expanded] {
  height: var(--toast-height);
  transform: translateX(var(--toast-swipe-movement-x)) translateY(var(--offset-y));
}
```

Two stacking systems, both real, and they do **not** conflict:
- The **viewport** sits at `--z-index-toast` (`1000000`) — the mined rule is `[role=region]:has([data-kumo-component=Toast]) { z-index: var(--z-index-toast) }`. Toasts outrank *everything*, including the drawer.
- **Inside** the viewport, toasts self-stack at `calc(1000 - var(--toast-index))`.

### 5.3 Motion — MINED VERBATIM

| Event | Animation |
|---|---|
| Enter | `slide-up 400ms cubic-bezier(0.21, 1.02, 0.73, 1)` — `translateY(100%) scale(0.96)` → `translateY(0) scale(1)`, opacity 0→1 |
| Exit (timeout / dismiss) | `slide-down 400ms cubic-bezier(0.21, 1.02, 0.73, 1) forwards` — the reverse |
| Exit (swiped) | `[data-ending-style][data-swipe-direction]` → `translate-x-full`, opacity 0 |
| Exit (evicted by stack limit) | `[data-ending-style][data-limited]` → fade only, no slide |
| Content updated in place | `toast-bump 400ms cubic-bezier(0.34, 1.56, 0.64, 1)`, `transform-origin: 50%` — scales to 1.02 at 20% and settles. A little overshoot spring. |

Both enter and exit are gated behind `motion-safe` in the source. Honour it.

`touch-action: none` on the toast enables swipe-to-dismiss.

### 5.4 Intents

| Intent | Accent token | Icon text token |
|---|---|---|
| `--info` | `--color-kumo-info` | `--text-color-kumo-info` |
| `--success` | `--color-kumo-success` | `--text-color-kumo-success` |
| `--warning` | `--color-kumo-warning` | `--text-color-kumo-warning` |
| `--danger` | `--color-kumo-danger` | `--text-color-kumo-danger` |
| `--neutral` | `--color-kumo-fill` | inherits |
| `--loading` | — | icon spins on `--animate-spin` |

**The toast surface stays `--color-kumo-base` in every intent.** Intent is carried by a 2px leading rail (`::before`) and the icon colour. Do not paint a red toast.

### 5.5 Slots & states

| Slot | Class | Notes |
|---|---|---|
| Icon | `.ds-toast__icon` | 16px — the dominant icon step (42 uses; `icons-data.json` also shows a heavy 12px step) |
| Title | `.ds-toast__title` | `font-medium`, `--text-color-kumo-strong` |
| Description | `.ds-toast__description` | `--text-color-kumo-subtle` |
| Action | `.ds-toast__action` | `--text-color-kumo-link` |
| Close | `.ds-toast__close` | `size-6`, hover → `--color-kumo-overlay` |

| State | Selector |
|---|---|
| Stacked (collapsed) | default |
| Expanded (viewport hovered/focused) | `[data-expanded]` |
| Swiping | `--toast-swipe-movement-x/y` are live |
| Limited (pushed out by newer toasts) | `[data-limited]` |

---

## 6. Banner

A **full-bleed, page-level** message. Not floating, not portal-ed — it lives in the document flow at the top of the app shell.

### 6.1 The layout contract — MINED, and non-negotiable

The banner **owns** `--preview-banner-height`, and the entire app shell reads it:

```css
header  { top:    var(--preview-banner-height, 0px); }
sidebar { height: calc(100vh - var(--preview-banner-height, 0px)); }
drawer  { top:    var(--preview-banner-height, 0px); }
main    { min-height: calc(100dvh - 58px - var(--preview-banner-height, 0px)); }
@media (min-width: 96rem) {
  header { top: calc(var(--header-height) + var(--preview-banner-height, 24px)); }
}
```

**If you render a banner and don't publish its height into `--preview-banner-height`, the header renders underneath it.** The fallback is `0px` everywhere except the `@5xl` header offsets, where it is `24px` — which tells you the intended banner height is a slim **24px** strip, not a fat callout.

### 6.2 Intents

| Intent | Surface | Status |
|---|---|---|
| `--info` | `--color-kumo-banner-info` — light: `blue-100 / .7`, dark: `blue-900 / .5` | **MINED** |
| `--warning` | `--color-kumo-banner-warning` — light: `yellow-100`, dark: `yellow-700 / .5` | **MINED** |
| `--success` | `--color-kumo-success-tint` @ 70% | **PRESCRIPTIVE** — no banner token exists |
| `--danger` | `--color-kumo-danger-tint` @ 60% | **PRESCRIPTIVE** — no banner token exists |

**Only two banner tokens exist.** That is a deliberate signal: this system uses banners for *ambient, low-urgency* states (a preview environment, a maintenance window), and pushes success/failure to **toasts**. If you find yourself reaching for a danger banner, ask whether it should be a toast or an inline form error instead.

Note that both mined banner surfaces are **alpha** colours — they *tint* the canvas rather than covering it. Keep them that way.

### 6.3 Variants, slots, states

| Variant | Class |
|---|---|
| Full-bleed *(default)* | `.ds-banner` — `border-radius: 0` |
| Sticky | `.ds-banner--sticky` |
| Inline / card callout | `.ds-banner--inline` — gains `--radius-lg` + a full hairline, `align-items: flex-start` |
| Animated entry | `.ds-banner--animated` — `fade-in 0.2s ease-in-out` (MINED: `.animate-[fade-in_0.2s_ease-in-out]`) |

Slots: `__icon` (16px) · `__content` · `__title` · `__link` (underlined, `text-underline-offset: 2px`) · `__actions` · `__dismiss`.

---

## 7. Accessibility

### Roles & ARIA

| Component | Container | Required |
|---|---|---|
| Tooltip | `role="tooltip"` | Trigger gets `aria-describedby="<tooltip id>"`. **Never** `aria-labelledby` — a tooltip supplements, it does not name. |
| Popover | `role="dialog"` | Trigger: `aria-haspopup="dialog"` + `aria-expanded` (**MINED** — Cloudflare does exactly this). Popover: `aria-labelledby` → the `__title` id. |
| Modal | `role="dialog"` + **`aria-modal="true"`** | `aria-labelledby` → the `<h1>` id (**MINED**). `aria-describedby` → the body id. |
| Toast | Viewport: `role="region"` + `aria-label` | Individual toast: `role="status"` (`aria-live="polite"`) for info/success; **`role="alert"` (`aria-live="assertive"`) for danger only**. |
| Banner | `role="status"` or `role="region"` + `aria-label` | Use `role="alert"` only for genuinely urgent, unexpected states. |

### Keyboard

| Key | Tooltip | Popover | Modal | Toast |
|---|---|---|---|---|
| `Tab` to trigger | **opens** (focus opens tooltips — not just hover) | focuses | focuses | — |
| `Enter` / `Space` | — | opens | opens | — |
| `Esc` | closes | closes, focus → trigger | closes, focus → trigger | dismisses the focused toast |
| `Tab` inside | n/a (not focusable) | cycles, **does not trap** | **traps** (focus cannot leave) | cycles within viewport |
| `F6` | — | — | — | jumps to the toast viewport (Base UI provides this) |

### Non-negotiables

- **A tooltip must open on focus, not only on hover.** Keyboard and touch users have no hover.
- **A tooltip must never contain focusable content.** If it has a link or a button, it's a popover. `pointer-events: none` in the recipe enforces this by construction.
- **Never attach a tooltip to a `disabled` button** — disabled elements don't fire pointer events or take focus. Wrap the button in a focusable span, or use `aria-disabled` instead of `disabled`.
- **Return focus to the trigger** when a popover or modal closes.
- **Toasts must not steal focus.** Announce via the live region; let the user reach them with `F6`.
- **Don't auto-dismiss a toast that carries the only copy of an action.** WCAG 2.2.1: either no timeout, or ≥20s, or a way to extend.
- **The focus ring is `2px --color-kumo-brand` on `:focus-visible`.** Never remove it. `focus:outline-none` in the source is always paired with a `ring` — it is not a removal.
- **Contrast:** the banner surfaces are alpha tints over the canvas; verify `--text-color-kumo-{intent}` on them per theme rather than assuming.
- **Forced colors:** the recipe re-asserts `outline: 1px solid CanvasText` on every overlay, because `box-shadow` is dropped in forced-colors mode and an overlay without its rim becomes an unbounded blob.
- **Reduced motion:** all transforms/animations are killed; opacity is kept so state changes stay perceivable. The source already gates its toast animations behind `motion-safe`.

---

## 8. Do / Don't

**Do**

- Compose every overlay from the **one shared box** (§1). Surface + `outline` hairline + the single elevation shadow + `--radius-lg`.
- Use the **`outline`** for the popup hairline, and let dark mode flip `outline-offset` to `-1px`.
- Paint **both** arrow fills. One is transparent in each theme, by design.
- Keep the surface **neutral** and put intent in the **icon** (and a 2px rail, for toasts).
- Drive stacking off the three real tokens: `--z-index-modal` (9999), `--z-index-drawer` (99999), `--z-index-toast` (1000000).
- Publish a banner's height into `--preview-banner-height`.
- Use `aria-haspopup="dialog"` on a popover trigger — the source does.
- Scale big surfaces **less** (`0.985`) than small ones (`0.9`) on enter/exit.

**Don't**

- **Don't invent `shadow-md` / `shadow-lg` / `shadow-xl`.** They do not exist in this system. There is one shadow and it is 3px tall.
- **Don't use `--color-kumo-overlay` as a modal scrim.** It's `neutral-50` in light — a hover fill with a misleading name.
- **Don't use `--color-kumo-contrast` (or `--color-kumo-focus`) as a scrim** either. They **invert**, so your dark-mode scrim goes near-white.
- **Don't hardcode `rgb(0 0 0 / …)` shadows.** Reference `--color-kumo-shadow-drop` / `--color-kumo-shadow-edge` so dark mode inverts correctly.
- **Don't port the legacy `.__react_component_tooltip`** (§2.6). Its hexes are Bootstrap defaults and it uses `role="status"`.
- **Don't copy the source's z-index ladder literally.** It is self-contradictory: `--z-index-modal` is 9999, but the actual dialog wears `z-[110]`, while the drawer (1150) and collapsed sidebar (1190) sit *above* it. Pick one system.
- **Don't repaint an overlay surface red/green** to signal status.
- **Don't reach for a danger banner.** Only info + warning banner tokens exist; failures belong in a toast or inline.
- **Don't put a focusable element in a tooltip.**

---

## 9. Using this in Tailwind CSS v4 + shadcn/ui

### 9.1 Wire the tokens into the v4 theme

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tokens/colors.css";
@import "../design-system/tokens/typography.css";

/* next-themes writes .dark — bridge it to the source's own [data-mode=dark] selector
   so ONE token layer serves both. */
@custom-variant dark (&:where(.dark, .dark *));
.dark { color-scheme: dark; }

@theme inline {
  /* Surfaces */
  --color-base:      var(--color-kumo-base);
  --color-elevated:  var(--color-kumo-elevated);
  --color-overlay:   var(--color-kumo-overlay);   /* a HOVER FILL. not a scrim. */
  --color-canvas:    var(--color-kumo-canvas);

  /* Lines */
  --color-line:          var(--color-kumo-line);
  --color-hairline:      var(--color-kumo-hairline);
  --color-tooltip-edge:  var(--color-tooltip-border);

  /* Arrow */
  --color-tip-stroke: var(--color-kumo-tip-stroke);
  --color-tip-shadow: var(--color-kumo-tip-shadow);

  /* Intent */
  --color-info:    var(--color-kumo-info);
  --color-success: var(--color-kumo-success);
  --color-warning: var(--color-kumo-warning);
  --color-danger:  var(--color-kumo-danger);
  --color-banner-info:    var(--color-kumo-banner-info);
  --color-banner-warning: var(--color-kumo-banner-warning);

  /* Focus */
  --color-brand: var(--color-kumo-brand);
  --color-focus: var(--color-kumo-focus);

  /* Radius */
  --radius-overlay: var(--radius-lg);

  /* The one elevation shadow */
  --shadow-overlay:
    0 0 1px 0.5px var(--color-kumo-shadow-edge),
    0 1px 2px     var(--color-kumo-shadow-drop);
}
```

Add the `.dark` bridge so the vars flip under either selector:

```css
/* tokens/colors.css defines [data-mode=dark]. Mirror it for next-themes. */
.dark { /* re-declare the same block, or simply: */ }
```

> Simplest: have `next-themes` write the attribute the tokens already use —
> `<ThemeProvider attribute="data-mode" value={{ light: "light", dark: "dark" }}>`.
> Then `[data-mode=dark]` in `tokens/colors.css` just works and you can skip the bridge entirely.
> Keep `@custom-variant dark` only if you also need Tailwind's `dark:` utilities.

### 9.2 Component map

| This doc | shadcn/ui component | Primitive underneath |
|---|---|---|
| Tooltip | `tooltip` | Radix `@radix-ui/react-tooltip` |
| Popover | `popover` | Radix `@radix-ui/react-popover` |
| Modal / Dialog | `dialog`, `alert-dialog` | Radix `@radix-ui/react-dialog` |
| Drawer / side sheet | `sheet` | Radix Dialog |
| Toast | `sonner` | Sonner |
| Banner | *(none)* — hand-roll `<Banner>` | — |

**State-attribute translation.** Cloudflare runs **Base UI** (`data-starting-style` / `data-ending-style` / `data-expanded` / `data-highlighted`). shadcn runs **Radix** (`data-[state=open]` / `data-[state=closed]` / `data-[side=*]` / `data-[highlighted]`). Same intent, different attribute:

| Base UI (source) | Radix (shadcn) |
|---|---|
| `[data-starting-style]` | `data-[state=open]` + `animate-in` |
| `[data-ending-style]` | `data-[state=closed]` + `animate-out` |
| `[data-side=top]` | `data-[side=top]` |
| `[data-highlighted]` | `data-[highlighted]` |
| `[data-expanded]` (toast) | Sonner's `[data-expanded]` — **same name** |

If you want the source's exact attribute contract, use `@base-ui-components/react` directly and drop `feedback-overlays.css` in as-is. Otherwise map through the table above.

### 9.3 Tooltip (shadcn + cva)

```tsx
// components/ui/tooltip.tsx
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tooltipContent = cva(
  [
    "z-[110] w-max",
    "rounded-lg bg-base text-[13px] leading-[1.176]",
    "outline outline-1 outline-tooltip-edge dark:-outline-offset-1",
    "shadow-(--shadow-overlay)",
    "px-2.5 py-1.5",
    "select-none pointer-events-none",
    // enter / exit — Radix equivalents of the mined starting/ending styles
    "data-[state=open]:animate-in  data-[state=open]:fade-in-0  data-[state=open]:zoom-in-90",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-90",
    "data-[side=top]:origin-bottom data-[side=bottom]:origin-top",
    "data-[side=left]:origin-right data-[side=right]:origin-left",
    "duration-200 ease-[ease]",
    "motion-reduce:transition-none motion-reduce:animate-none",
  ],
  {
    variants: {
      // PRESCRIPTIVE: the system has no tooltip intent tokens. Tint text, not surface.
      intent: {
        neutral: "text-foreground",
        info:    "text-[var(--text-color-kumo-info)]",
        success: "text-[var(--text-color-kumo-success)]",
        warning: "text-[var(--text-color-kumo-warning)]",
        danger:  "text-[var(--text-color-kumo-danger)]",
      },
      size: {
        sm: "text-[12px] py-1",
        md: "text-[13px] py-1.5",
      },
    },
    defaultVariants: { intent: "neutral", size: "md" },
  },
);

export function TooltipContent({
  className, intent, size, sideOffset = 6, children, ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & VariantProps<typeof tooltipContent>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(tooltipContent({ intent, size }), className)}
        {...props}
      >
        {children}
        {/* Paint BOTH arrow fills — exactly one is transparent per theme. */}
        <TooltipPrimitive.Arrow
          width={12}
          height={6}
          className="fill-tip-stroke drop-shadow-[0_1px_0_var(--color-tip-shadow)]"
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
```

### 9.4 Dialog

```tsx
const dialogOverlay = cva([
  "fixed inset-0 z-[9999]",
  // PRESCRIPTIVE scrim — anchored on a palette primitive that does NOT invert.
  "bg-[color-mix(in_oklab,var(--color-neutral-950)_50%,transparent)]",
  "data-[state=open]:animate-in  data-[state=open]:fade-in-0",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
]);

const dialogContent = cva(
  [
    "fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2",
    "flex w-full flex-col",
    "rounded-lg bg-base text-foreground",
    "outline outline-1 outline-tooltip-edge dark:-outline-offset-1",
    "shadow-(--shadow-overlay)",
    // MINED: big surfaces scale 0.985, not 0.9.
    "data-[state=open]:animate-in  data-[state=open]:fade-in-0  data-[state=open]:zoom-in-[0.985]",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.985]",
    "duration-200",
  ],
  {
    variants: {
      size: {                      // PRESCRIPTIVE — the mined --container-* scale
        sm:   "max-w-sm",          // 24rem
        md:   "max-w-md",          // 28rem — default
        lg:   "max-w-xl",          // 36rem
        xl:   "max-w-3xl",         // 48rem
        full: "max-w-none h-full w-full rounded-none",
      },
    },
    defaultVariants: { size: "md" },
  },
);
```

Use **`alert-dialog`** (not `dialog`) for destructive confirms — it forces an explicit choice and sets `role="alertdialog"`. Icon via `lucide-react`:

```tsx
import { TriangleAlert, Info, CircleCheck, CircleX } from "lucide-react";

const intentIcon = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleX };
```

### 9.5 Toast (Sonner)

Sonner already implements the same stacking model (`--index`, expand-on-hover, swipe). Style it to match:

```tsx
// components/ui/toaster.tsx
import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      gap={12}                      /* MINED: --gap: .75rem  */
      offset={16}
      visibleToasts={3}
      className="z-[1000000]"       /* MINED: --z-index-toast */
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "flex w-full items-start gap-2.5 px-4 py-3",
            "rounded-lg bg-base text-[13px] text-foreground",
            "outline outline-1 outline-tooltip-edge dark:-outline-offset-1",
            "shadow-(--shadow-overlay)",
            "relative overflow-hidden",
            // 2px intent rail — the surface stays neutral
            "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-(--rail)",
          ].join(" "),
          title:       "font-medium text-[var(--text-color-kumo-strong)]",
          description: "mt-1 text-[var(--text-color-kumo-subtle)]",
          actionButton:"mt-2 font-medium text-[var(--text-color-kumo-link)]",
          closeButton: "size-6 rounded-md text-[var(--text-color-kumo-subtle)] hover:bg-overlay",
          success: "[--rail:var(--color-success)] [&_[data-icon]]:text-[var(--text-color-kumo-success)]",
          error:   "[--rail:var(--color-danger)]  [&_[data-icon]]:text-[var(--text-color-kumo-danger)]",
          warning: "[--rail:var(--color-warning)] [&_[data-icon]]:text-[var(--text-color-kumo-warning)]",
          info:    "[--rail:var(--color-info)]    [&_[data-icon]]:text-[var(--text-color-kumo-info)]",
        },
      }}
    />
  );
}
```

Sonner's default motion is close but not identical. To match the mined curve exactly, override:

```css
[data-sonner-toast] {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.21, 1.02, 0.73, 1);  /* MINED */
}
```

### 9.6 Banner (hand-rolled — shadcn has no equivalent)

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { useLayoutEffect, useRef } from "react";

const banner = cva(
  "relative flex w-full items-center gap-2 px-4 py-2 text-[13px]",
  {
    variants: {
      intent: {
        info:    "bg-banner-info    text-[var(--text-color-kumo-info)]    border-b border-[var(--color-kumo-info-tint)]",     // MINED
        warning: "bg-banner-warning text-[var(--text-color-kumo-warning)] border-b border-[var(--color-kumo-warning-tint)]",  // MINED
        // PRESCRIPTIVE — no banner token exists for these. Prefer a toast.
        success: "bg-[color-mix(in_oklab,var(--color-kumo-success-tint)_70%,transparent)] text-[var(--text-color-kumo-success)]",
        danger:  "bg-[color-mix(in_oklab,var(--color-kumo-danger-tint)_60%,transparent)]  text-[var(--text-color-kumo-danger)]",
      },
      inline: { true: "rounded-lg border items-start py-3", false: "rounded-none" },
    },
    defaultVariants: { intent: "info", inline: false },
  },
);

export function Banner({ intent, inline, children, ...props }: VariantProps<typeof banner> & React.ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  // MINED CONTRACT: the shell offsets itself by --preview-banner-height.
  // Publish it or the header renders underneath the banner.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || inline) return;
    const ro = new ResizeObserver(([e]) =>
      document.documentElement.style.setProperty("--preview-banner-height", `${e.contentRect.height}px`),
    );
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty("--preview-banner-height", "0px");
    };
  }, [inline]);

  return <div ref={ref} role="status" className={banner({ intent, inline })} {...props}>{children}</div>;
}
```

### 9.7 Checklist before you ship

- [ ] `next-themes` writes `data-mode` (or you bridged `.dark` → `[data-mode=dark]`).
- [ ] `--shadow-overlay` is the **only** shadow on any overlay. No `shadow-lg` anywhere.
- [ ] The popup hairline is an `outline`, and dark mode flips it to `-outline-offset-1`.
- [ ] The scrim is anchored on `--color-neutral-950`, **not** on `--color-kumo-overlay` or `--color-kumo-contrast`.
- [ ] `:focus-visible` = `ring-2 ring-brand`. Nothing removed it.
- [ ] Tooltips open on **focus**, contain no focusable content, and are `aria-describedby`.
- [ ] Popover triggers use `aria-haspopup="dialog"`.
- [ ] Dialog is `aria-labelledby` → a real heading id (not `aria-label`).
- [ ] Danger toasts are `role="alert"`; everything else is `role="status"`.
- [ ] A banner publishes `--preview-banner-height`.
- [ ] `prefers-reduced-motion: reduce` kills every transform.

---

## 10. Token index for this family

| Token | Role | Light | Dark |
|---|---|---|---|
| `--color-kumo-base` | Overlay surface | `#fff` | `neutral-925` |
| `--color-kumo-elevated` | Header/footer strips inside overlays | `neutral-75` | `neutral-975` |
| `--color-kumo-overlay` | **Hover fill** (not a scrim) | `neutral-50` | `neutral-800` |
| `--color-tooltip-border` | Popup outline | `neutral-800` | `neutral-800` |
| `--color-kumo-line` | Internal hairlines | `black / .1` | `neutral-750` |
| `--color-kumo-tip-stroke` | Arrow stroke | `transparent` | `neutral-800` |
| `--color-kumo-tip-shadow` | Arrow shadow | `gray-200` | `transparent` |
| `--color-kumo-shadow-edge` | Contact rim — **inverts** | `black / .12` | `white / .1` |
| `--color-kumo-shadow-drop` | Cast shadow | `black / .08` | `black / .3` |
| `--color-kumo-banner-info` | Banner surface | `blue-100 / .7` | `blue-900 / .5` |
| `--color-kumo-banner-warning` | Banner surface | `yellow-100` | `yellow-700 / .5` |
| `--color-kumo-{info,success,warning,danger}` | Toast rail / icon accent | — | — |
| `--color-kumo-{info,success,warning,danger}-tint` | Dialog icon bg, inline banner | — | — |
| `--text-color-kumo-{info,success,warning,danger}` | Intent text/icon | — | — |
| `--color-kumo-brand` | `:focus-visible` ring (2px) | `oklch(57.72% .2324 260)` | `oklch(51.948% .2324 260)` |
| `--color-kumo-focus` | `:focus` soft ring @ 50% — **inverts** | `neutral-950` | `neutral-150` |
| `--z-index-modal` | 9999 | | |
| `--z-index-drawer` | 99999 | | |
| `--z-index-toast` | 1000000 | | |
| `--preview-banner-height` | Shell layout hook | `0px` (`24px` in `@5xl`) | |
| `--radius-lg` | `.5rem` — the house radius | | |
| `--blur-xs` / `--blur-sm` | `4px` / `8px` — scrim blur (prescriptive use) | | |
