# Badges & Status

Small, non-interactive-by-default pills that label a thing without being the thing. In
`cloudflare-dashboard` they do three jobs: mark **product maturity** (Beta / New / Alpha),
report **entity status** (Active / On), and offer a **tinted inline link** (Billing Docs).

Recipes: [`badges-status.css`](./badges-status.css) · Tokens: [`../tokens/colors.css`](../tokens/colors.css)

---

## What the capture actually proves

This target was classified **`utility-compiled`** (`classification.json`, score 1.0) — atomic
classes carry the values, not named component classes. So the anatomy below is read off the
**post-render DOM**, and every colour is traced back through the compiled utility map
(`_classes.json`) to the token it resolves to.

| Claim | Evidence |
|---|---|
| 136 badge instances raw, 17 deduped, on **all 8** captured pages | `facts.json → usage.elementTotals.badge` |
| **Three** distinct badge shapes in the DOM | `home-overview.html`, `members.html`, `billing.html` |
| Every badge is a **full pill** (`rounded-full`) | 162 `rounded-full` uses; badges never use the dominant `rounded-lg` (946 uses) |
| 8-hue badge palette + 4 status intents are **token-backed** | `facts.json → tokens.names`; `_classes.json` |
| Status **intents were essentially not exercised on badges** | `facts.json → usage.statusIntent` is `{}` — empty |

> [!IMPORTANT]
> **`usage.statusIntent` is empty `{}`.** The extractor found no status-intent variant classes.
> A single exception exists that the bucket missed: one `info` subtle pill in `billing.html`.
> Everything in this doc marked **PRESCRIPTIVE** is therefore *our recommended usage of exact,
> existing tokens* — not observed behaviour. The token **values** are always exact; only the
> **usage** is prescriptive. Each section says which it is.

---

## Anatomy

```
┌─────────────────────────────────────────┐
│  ●   Active                         ×   │
│  ↑   ↑                              ↑   │
│  dot label                       remove │
└─────────────────────────────────────────┘
   └────────── pill container ───────────┘
```

| Part | Class | Required | Notes |
|---|---|---|---|
| Container | `.ds-badge` | yes | `inline-flex`, `align-items:center`, `flex:none`, `width:fit-content`, `border-radius:9999px`, `white-space:nowrap`, `user-select:none` |
| Dot | `.ds-badge__dot` | no | 6px circle (`size-1.5`). **Observed** carrying `aria-hidden="true"` |
| Icon | `.ds-badge__icon` | no | 12px — the target's dominant icon size (196 of 476 svg uses) |
| Label | *(text node / `<span>`)* | **yes** | The only part that conveys meaning |
| Remove | `.ds-badge__remove` | no | PRESCRIPTIVE — no removable badge in the captures |

The container never shrinks (`flex:none` / `shrink-0` is on **all three** observed shapes) — a
badge in a flex row squeezes its siblings, never itself.

### The three observed shapes, verbatim

**1. Lifecycle badge — `.ds-badge--dashed`. 136 of 136 instances.**
Sidebar nav. Labels observed: `Beta` (96), `New` (32), `Alpha` (8).

```html
<span class="inline-flex shrink-0 items-center rounded-full border border-dashed
             border-kumo-line select-none px-1.5 py-0.5 text-[11px]/none
             font-medium text-kumo-strong">
  <span>Beta</span>
</span>
```
→ transparent fill · 1px **dashed** `--color-kumo-line` · `--text-color-kumo-strong` · 2px/6px
padding · **11px**/1 · weight 500.

**2. Dot status badge — `.ds-badge--elevated`. `members.html`.** Labels: `Active`, `On`.

```html
<span class="w-fit flex-none shrink-0 rounded-full px-2 py-0.5 text-xs font-medium
             whitespace-nowrap text-kumo-default bg-white dark:bg-neutral-900
             inline-flex items-center gap-1.5 border-0 ring-1 ring-black/10
             dark:ring-white/20 shadow-xs">
  <span class="size-1.5 rounded-full bg-green-500 dark:bg-green-400" aria-hidden="true"></span>
  <span>Active</span>
</span>
```
→ **The colour lives in the dot, not the chip.** The chip stays on the control surface so it
stays legible against any table row. 2px/8px padding · 12px · gap 6px · 1px ring · `shadow-xs`.

**3. Subtle info pill (a link) — `.ds-badge--subtle.ds-badge--info.ds-badge--lg`. `billing.html`.**

```html
<a href="https://developers.cloudflare.com/billing/" class="flex gap-1 rounded-full
   bg-kumo-info-tint font-medium h-6 text-xs items-center px-2.5 text-kumo-info
   hover:ring-1 ring-inset ring-kumo-ring !no-underline whitespace-nowrap">
  Billing Docs
  <svg width="12" height="12" fill="currentColor" class="shrink-0">…</svg>
</a>
```
→ `--color-kumo-info-tint` fill · `--text-color-kumo-info` text · fixed **24px** height · 10px
inline padding · hover = **inset ring**, not a fill change.

> Two of the three observed shapes reach past the token layer: shape 2 hardcodes
> `bg-white dark:bg-neutral-900` and `ring-black/10 dark:ring-white/20`, and its dot hardcodes
> `bg-green-500 dark:bg-green-400`. Those resolve to `--color-kumo-control`, `--color-kumo-line`
> and (near-enough) `--color-kumo-success`. **The recipe routes them through the tokens** so the
> `fedramp` / `kumo` themes are not silently broken.

---

## Style variants

Set **one** style class and **one** intent class. They compose — intents only publish colour
values into local custom properties (`--ds-badge-accent`, `--ds-badge-tint`, `--ds-badge-on-tint`,
`--ds-badge-on-solid`), and style classes decide how to paint them. That keeps the matrix
additive (`n + m`) rather than combinatorial (`n × m`).

| Variant | Fill | Text | Border | Status |
|---|---|---|---|---|
| `--subtle` | `*-tint` | `--text-color-kumo-*` | none | **OBSERVED** (info). **Default for status.** |
| `--solid` | accent, full strength | `--text-color-kumo-badge-inverted` | none | Utilities exist; pairing PRESCRIPTIVE |
| `--outline` | transparent | accent | 1px solid accent | Utilities exist; PRESCRIPTIVE |
| `--dashed` | transparent | `--text-color-kumo-strong` | 1px **dashed** `--color-kumo-line` | **OBSERVED** — lifecycle only |
| `--elevated` | `--color-kumo-control` | `--text-color-kumo-default` | 1px ring + `shadow-xs` | **OBSERVED** — the dot badge |
| `--inverted` | `--color-kumo-badge-inverted` | `--text-color-kumo-badge-inverted` | none | Utilities exist; PRESCRIPTIVE |

`--inverted` is the only variant whose **both** sides flip per theme (near-black-on-white →
near-white-on-black), so its contrast is preserved automatically. Do not "fix" it with a
`dark:` override.

---

## Intents

### Status intents — semantic (PRESCRIPTIVE usage, exact values)

Four intents, each with a full triple (`accent` / `tint` / `on-tint`). All are token-backed and
theme-aware. **Only `info` is observed on a badge.**

| Intent | Accent | Subtle fill | Subtle text |
|---|---|---|---|
| `--success` | `--color-kumo-success` | `--color-kumo-success-tint` | `--text-color-kumo-success` |
| `--warning` | `--color-kumo-warning` | `--color-kumo-warning-tint` | `--text-color-kumo-warning` |
| `--danger` / `--error` | `--color-kumo-danger` | `--color-kumo-danger-tint` | `--text-color-kumo-danger` |
| `--info` | `--color-kumo-info` | `--color-kumo-info-tint` | `--text-color-kumo-info` |
| `--neutral` | `--color-kumo-badge-neutral` | *(see token gap)* | `--text-color-kumo-badge-neutral-subtle` |

`--error` is an alias for `--danger`; **the target's own vocabulary is "danger"** — prefer it.

There are also `--color-kumo-banner-{info,warning}` tokens. Those are for **page-level banners**,
not badges — they are lower-alpha wash colours (`oklch(… / .7)` light, `/ .5` dark) meant to sit
behind a full-width strip. Do not use them as a badge fill.

### Hue intents — decorative (PRESCRIPTIVE)

Eight hues: `blue`, `green`, `orange`, `purple`, `red`, `teal`, `neutral`, `inverted`
(`--color-kumo-badge-*`). Use them for **taxonomy** — plan tier, product area, region.

> [!WARNING]
> **Never encode status in a hue.** `--color-kumo-badge-red` and `--color-kumo-danger` are
> different tokens with different jobs. A hue carries no agreed meaning, does not survive a
> colour-blind reading, and will drift out of sync with the semantic ramp.

> [!CAUTION]
> **Token gap — subtle backgrounds.** The compiled stylesheet references
> `--color-kumo-badge-*-subtle` (e.g. `.bg-[var(--color-kumo-badge-orange-subtle)]`), but
> `tokens/colors.css` defines **no such background token** — only the three *foreground*
> companions `--text-color-kumo-badge-{neutral,orange,teal}-subtle`. The recipe references the
> token first and falls back to `color-mix(… 15%, transparent)` — 15% being the mid-point of the
> tint ramp the target actually compiles (`bg-kumo-*/5`, `/10`, `/15`, `/20`). **Subtle hue
> badges are only fully token-backed for `neutral`, `orange` and `teal`.** For `blue`, `green`,
> `purple` and `red`, prefer `--solid` or `--outline` until the tokens land.

---

## Sizes

All three sizes are real geometry from the capture. `--spacing` is the target's Tailwind v4 base
(`.25rem`), so the `calc()`s stay on-scale.

| Size | Padding | Font | Height | Gap | Source |
|---|---|---|---|---|---|
| `--sm` | 2px / 6px | **11px** / 1 | ~18px intrinsic | 4px | Lifecycle badge |
| `--md` *(default)* | 2px / 8px | 12px (`--text-xs`) / 1 | ~20px intrinsic | 6px | Dot status badge |
| `--lg` | 0 / 10px | 12px (`--text-xs`) / 1 | **24px fixed** | 4px | Info pill |

Two quirks worth preserving:

- **11px is deliberately off-scale.** The source writes `text-[11px]` as an *arbitrary* value;
  the scale's smallest step (`--text-xs`) is 12px. Reproduce it as a literal, do not "round it
  up" to `--text-xs`.
- **This target's `--text-sm` is 13px, not 14px.** Do not assume Tailwind defaults anywhere near
  this component.

Badges sit **below** the control scale — buttons are `h-8`/`h-9`/`h-10` (32/36/40px), badges cap
at 24px. Use `--lg` when the badge is a link or button and needs a real hit target.

---

## States

| State | Treatment | Source |
|---|---|---|
| Default | Per variant | — |
| Hover *(interactive only)* | `inset 0 0 0 1px` ring — **not** a fill change | **OBSERVED**: `hover:ring-1 ring-inset` on the info pill |
| Focus | `outline: none` | **OBSERVED**: `outline-none` (216 uses) |
| Focus-visible | **2px `--color-kumo-brand` ring, 2px offset** in `--color-kumo-base` | **OBSERVED**: `focus-visible:ring-2 focus-visible:ring-kumo-brand` |
| Disabled | `--text-color-kumo-inactive`, `opacity .6`, `cursor:not-allowed` | PRESCRIPTIVE |
| Pulse (live) | 1.5s opacity loop on the dot | PRESCRIPTIVE |

**A static badge has no states.** Hover and focus are scoped to `a.ds-badge` / `button.ds-badge`
in the CSS precisely so a `<span>` badge cannot advertise an affordance it does not have.

The focus ring uses the **offset** technique (`0 0 0 2px base, 0 0 0 4px brand`) rather than a
bare ring so it reads against both a card and a table row. It fires on `:focus-visible` only — a
mouse click on a badge link must not paint a ring.

> A dedicated `--color-kumo-focus` token exists (86 `ring-kumo-focus` uses). But the *observed
> `focus-visible` recipe on controls* pairs `ring-2` with `ring-kumo-brand`, so that is what the
> recipe reproduces. `--color-kumo-focus` is a neutral (near-white in dark, near-black in light)
> and is used for **inner** rings on filled surfaces.

**Motion:** the recipe transitions `background-color`, `color`, `border-color`, `box-shadow` at
**0.2s / `ease`** — the target's dominant duration (17 uses) and easing (15 uses). All motion,
including the pulse, is wrapped in `prefers-reduced-motion: reduce` guards; the target itself
ships 8 such rules.

---

## Accessibility

**A badge is text, and the text is the meaning.** Colour, the dot, and the icon are all
redundant encodings. This is the single rule that matters — the observed dot badge already obeys
it (`aria-hidden="true"` on the dot, `Active` in a real text node).

- **Never** ship a badge whose only content is a colour or a dot. `● ` with no label is
  unreadable to a screen reader and to anyone with a colour vision deficiency.
- **Decorative parts get `aria-hidden="true"`** — the dot (**observed**) and `.ds-badge__icon`.
- **Static badges are `<span>`.** Do not add `role`, `tabindex`, or a click handler to one.
- **Live status needs a live region.** If a badge's label changes without a page navigation
  (`Provisioning` → `Active`), wrap it in `role="status"` + `aria-live="polite"` so the change is
  announced. The app already uses this pattern (10 `role="status"`, 16 `aria-live="polite"`).
  Use `polite`, never `assertive` — a badge flip is not an interruption.
- **A count badge needs a name.** `<span class="ds-badge ds-badge--count">3</span>` announces
  "3". Give the host an `aria-label`: `aria-label="3 unread notifications"`. A bare
  `--count-dot` has no text at all and is meaningless without one.
- **Contrast.** `--subtle` pairs a `*-tint` fill with its matching `--text-color-kumo-*`
  foreground — the pairs are designed to clear 4.5:1 in both themes. **Do not mix across pairs**
  (e.g. `--color-kumo-success-tint` under `--text-color-kumo-info`); nothing guarantees that
  combination. The one pairing to verify yourself is `--solid` + `--warning`:
  `--color-kumo-warning` is a *light* yellow in both themes
  (`oklch(79.5% …)` light, `oklch(85.2% …)` dark) and the inverted foreground is white in light
  mode — **that will fail contrast.** Prefer `--subtle` for warning.
- **Removable chips**: `.ds-badge__remove` is a real `<button>` with an `aria-label`
  ("Remove *filter name*"), reachable by keyboard, never a bare `<span>` with `onClick`.
- Badges are `user-select: none` (observed) — copy-paste of surrounding text will not pick them
  up. Do not put information there that a user might need to copy.

---

## Do / Don't

**Do**

- Use `--subtle` + a **status intent** for status. It is the observed pattern and the only one
  with a guaranteed contrast pair.
- Use `--elevated` + a dot when badges sit in a **table** — the neutral chip stays legible on
  striped/hovered rows while the dot carries the colour.
- Reserve `--dashed` for **product maturity** (Beta / New / Alpha). That is its only job in the
  target, across all 136 instances.
- Keep labels to **one or two words**. The pill is `white-space: nowrap`; a long label will blow
  out its container rather than wrap.
- Let the theme do the work — use the vars and let `:root` / `[data-mode=dark]` switch.

**Don't**

- Don't put a status meaning on a **hue** (`--red` ≠ `--danger`).
- Don't use `--solid --warning` — light yellow + white text fails contrast. Use `--subtle`.
- Don't make a badge a click target unless it is genuinely a link/button; if it is, use `--lg`
  so the hit area is 24px.
- Don't hardcode `bg-white dark:bg-neutral-900` (as the source does in one place) — that is
  `--color-kumo-control`, and hardcoding it silently breaks the `fedramp` and `kumo` themes.
- Don't swap the pill radius for `rounded-lg`. Cards and buttons are 8px; **badges are pills**,
  with no exception anywhere in the capture.
- Don't stack more than 2–3 badges on one row — past that, use a definition list or a table
  column.

---

## Using this in Tailwind CSS v4 + shadcn/ui

### 1. Expose the tokens to Tailwind

Tailwind v4 is CSS-first. Import the token file, then re-export the badge tokens through
`@theme inline` so `bg-badge-blue`, `text-status-success` etc. compile. `@theme inline` (not
plain `@theme`) is required: it emits utilities that *reference* the var rather than copying its
value, which is what keeps theme switching live.

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tokens/colors.css";
@import "../design-system/components/badges-status.css";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  /* hues */
  --color-badge-blue:     var(--color-kumo-badge-blue);
  --color-badge-green:    var(--color-kumo-badge-green);
  --color-badge-orange:   var(--color-kumo-badge-orange);
  --color-badge-purple:   var(--color-kumo-badge-purple);
  --color-badge-red:      var(--color-kumo-badge-red);
  --color-badge-teal:     var(--color-kumo-badge-teal);
  --color-badge-neutral:  var(--color-kumo-badge-neutral);
  --color-badge-inverted: var(--color-kumo-badge-inverted);

  /* status intents */
  --color-status-success:      var(--color-kumo-success);
  --color-status-success-tint: var(--color-kumo-success-tint);
  --color-status-warning:      var(--color-kumo-warning);
  --color-status-warning-tint: var(--color-kumo-warning-tint);
  --color-status-danger:       var(--color-kumo-danger);
  --color-status-danger-tint:  var(--color-kumo-danger-tint);
  --color-status-info:         var(--color-kumo-info);
  --color-status-info-tint:    var(--color-kumo-info-tint);
}
```

### 2. Bridge the theme selector

The target switches on **`[data-mode=dark]`**; `next-themes` + shadcn switch on **`.dark`**.
Bridge them once — do not duplicate the token values:

```css
/* .dark is what next-themes sets; [data-mode=dark] is what the tokens listen for. */
.dark { color-scheme: dark; }
:root:has(.dark), .dark { }
```

Simplest and most robust: configure `next-themes` to write the attribute the tokens already
expect, so no bridge is needed at all.

```tsx
// app/providers.tsx
<ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

If you must keep the `.dark` class (because other shadcn components depend on it), pass
`attribute={["class", "data-mode"]}` so both land on `<html>`.

### 3. The `Badge` component (CVA)

shadcn's `Badge` already uses `class-variance-authority`. Replace its `variants` block. Note the
**compound** `style × intent` shape below — it mirrors the CSS's custom-property indirection and
avoids writing out 6 × 9 explicit combinations.

```tsx
// components/ui/badge.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // base — pill, never shrinks, 500 weight, .2s ease
  [
    "inline-flex w-fit flex-none items-center rounded-full font-medium",
    "whitespace-nowrap select-none border border-transparent",
    "transition-[background-color,color,border-color,box-shadow] duration-200 ease-[ease]",
    "motion-reduce:transition-none",
    // observed focus recipe: outline-none + 2px brand ring, offset in the base surface
    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-kumo-brand)]",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-kumo-base)]",
    "[&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:pointer-events-none",
  ],
  {
    variants: {
      // maps 1:1 to .ds-badge--{variant}
      variant: {
        subtle:   "bg-(--ds-badge-tint) text-(--ds-badge-on-tint)",
        solid:    "bg-(--ds-badge-accent) text-[var(--text-color-kumo-badge-inverted)]",
        outline:  "bg-transparent text-(--ds-badge-accent) border-(--ds-badge-accent)",
        dashed:   "border-dashed border-[var(--color-kumo-line)] text-[var(--text-color-kumo-strong)]",
        elevated: "bg-[var(--color-kumo-control)] text-[var(--text-color-kumo-default)] shadow-xs ring-1 ring-[var(--color-kumo-line)]",
        inverted: "bg-[var(--color-kumo-badge-inverted)] text-[var(--text-color-kumo-badge-inverted)]",
      },
      // sets the --ds-badge-* channel the variant above reads
      intent: {
        success: "[--ds-badge-accent:var(--color-kumo-success)] [--ds-badge-tint:var(--color-kumo-success-tint)] [--ds-badge-on-tint:var(--text-color-kumo-success)]",
        warning: "[--ds-badge-accent:var(--color-kumo-warning)] [--ds-badge-tint:var(--color-kumo-warning-tint)] [--ds-badge-on-tint:var(--text-color-kumo-warning)]",
        danger:  "[--ds-badge-accent:var(--color-kumo-danger)]  [--ds-badge-tint:var(--color-kumo-danger-tint)]  [--ds-badge-on-tint:var(--text-color-kumo-danger)]",
        info:    "[--ds-badge-accent:var(--color-kumo-info)]    [--ds-badge-tint:var(--color-kumo-info-tint)]    [--ds-badge-on-tint:var(--text-color-kumo-info)]",
        neutral: "[--ds-badge-accent:var(--color-kumo-badge-neutral)] [--ds-badge-on-tint:var(--text-color-kumo-badge-neutral-subtle)]",
        orange:  "[--ds-badge-accent:var(--color-kumo-badge-orange)]  [--ds-badge-on-tint:var(--text-color-kumo-badge-orange-subtle)]",
        teal:    "[--ds-badge-accent:var(--color-kumo-badge-teal)]    [--ds-badge-on-tint:var(--text-color-kumo-badge-teal-subtle)]",
        blue:    "[--ds-badge-accent:var(--color-kumo-badge-blue)]",
        green:   "[--ds-badge-accent:var(--color-kumo-badge-green)]",
        purple:  "[--ds-badge-accent:var(--color-kumo-badge-purple)]",
        red:     "[--ds-badge-accent:var(--color-kumo-badge-red)]",
      },
      size: {
        sm: "gap-1   px-1.5  py-0.5 text-[11px]/none",  // 11px is arbitrary by design
        md: "gap-1.5 px-2    py-0.5 text-xs/none",
        lg: "gap-1   px-2.5  h-6    text-xs/none",
      },
    },
    defaultVariants: { variant: "subtle", intent: "neutral", size: "md" },
  }
)

function Badge({
  className, variant, intent, size, asChild = false, ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, intent, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
```

> **Tailwind v4 note:** `bg-(--ds-badge-tint)` is v4's shorthand for
> `bg-[var(--ds-badge-tint)]`. It resolves at paint time, so a `variant` and an `intent` set in
> two independent CVA slots still compose — that is the whole point of the custom-property
> indirection.

> **Subtle hue gap:** the `blue`/`green`/`purple`/`red` intents above set no `--ds-badge-tint`,
> because no such token exists (see the token-gap warning). Pair them with
> `variant="solid"` or `"outline"`, or add a `color-mix` fallback in `@theme` first.

### 4. Usage

```tsx
import { Badge } from "@/components/ui/badge"
import { CircleDot, ExternalLink } from "lucide-react"

// Status — the observed default. Text carries the meaning.
<Badge variant="subtle" intent="success">Active</Badge>
<Badge variant="subtle" intent="danger">Failed</Badge>

// Dot status badge — the members.html pattern. Dot is decorative.
<Badge variant="elevated" intent="success">
  <span aria-hidden className="size-1.5 rounded-full bg-(--ds-badge-accent)" />
  Active
</Badge>

// Lifecycle — the sidebar pattern (136/136 instances).
<Badge variant="dashed" size="sm">Beta</Badge>

// Interactive pill — the billing.html pattern. asChild keeps the <a> semantics.
<Badge asChild variant="subtle" intent="info" size="lg">
  <a href="/docs/billing">
    Billing Docs
    <ExternalLink aria-hidden />
  </a>
</Badge>

// Live status — announce the flip.
<span role="status" aria-live="polite">
  <Badge variant="subtle" intent={isReady ? "success" : "warning"}>
    {isReady ? "Active" : "Provisioning"}
  </Badge>
</span>
```

**Icons:** `lucide-react`, sized to **12px** (`size-3`) — the target's dominant icon size and
exactly what the info pill ships. The base CVA already applies `[&>svg]:size-3`, so you never
pass a size prop. Lucide is stroke-based while this target's icons are predominantly `fill`
(317 fill vs 35 stroke); at 12px the difference is not legible, but if you need an exact match,
use `@phosphor-icons/react` — the captured markup's `viewBox="0 0 256 256"` is Phosphor's.

**Dark mode:** handled entirely by the token layer. There is **no** `dark:` class anywhere in the
recipe or the CVA, and there should not be — every colour above is a var that re-declares itself
under `[data-mode=dark]`. If you find yourself writing `dark:bg-…` on a badge, you have reached
past the token layer and broken the `fedramp` / `kumo` themes.
