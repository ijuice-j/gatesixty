# Buttons

The button system of **cloudflare-dashboard** (`dash.cloudflare.com`), extracted from the
post-render DOM of 8 pages (analytics, api-tokens, audit-log, billing, home-overview,
members, notifications, workers-and-pages).

Recipes: [`buttons.css`](./buttons.css) · Tokens: [`../tokens/colors.css`](../tokens/colors.css)

---

## 0. How this target actually builds buttons (read this first)

`classification.json` ranks the target **`utility-compiled`** (utility class ratio **0.79**,
semantic ratio 0.064). There is **no `--button-*` token family**. A button is a stack of
Tailwind v4 utilities layered over the `kumo` semantic colour tokens
(`--color-kumo-*`, `--text-color-kumo-*`), emitted by a React component that marks itself
with `data-kumo-component="Button"` (or `"LinkButton"`).

The one genuinely button-scoped token family is **`--kumo-button-emphasis-*`**, and it is
written **inline on every emphasis button** as `color-mix()` derivations of the brand token:

```css
--kumo-button-emphasis-bg:             color-mix(in oklch, var(--color-kumo-brand), white 30%);
--kumo-button-emphasis-ring:           color-mix(in oklch, var(--color-kumo-brand), black 10%);
--kumo-button-emphasis-gradient-start: color-mix(in oklch, var(--color-kumo-brand), white 15%);
--kumo-button-emphasis-gradient-end:   var(--color-kumo-brand);
```

Consequences for this doc:
- Colour/state claims are transcribed from `_classes.json` (class → declaration) and the
  class strings on the real elements.
- Geometry (heights, padding, radius, type) is transcribed from the utility names and
  resolved through the theme vars in `computed-tokens.json`
  (`--spacing: .25rem`, `--radius-lg: .5rem`, `--radius-md: .375rem`,
  `--text-xs: 12px`, `--text-sm: 13px`, `--text-base: 14px`).
- **The type scale is non-standard.** The target overrides Tailwind's defaults:
  `text-base` is **14px**, `text-sm` is **13px**, `text-xs` is **12px**. Do not assume 16/14/12.

> **The brand colour is blue, not orange.** `--color-kumo-brand` resolves to
> `oklch(57.72% .2324 260)` (light) / `oklch(51.948% .2324 260)` (dark) — a blue.
> The Cloudflare orange `#f6821f` lives in `--text-color-kumo-brand` and is a *text* token.
> The primary button is blue. Preserve that.

### Counts (from `facts.json`, do not re-derive)

| Fact | Value |
|---|---|
| `<button>` elements, raw across 8 pages | **417** |
| `<button>` elements, deduped (shell-aware) | **88** |
| Control heights on `<button>` | `h-8` 16 · `h-9` 26 · `h-10` 2 |
| Control heights on `<a>` | `h-8` 8 · `h-9` 6 |
| **Height ↔ type pairings** | `h-8 \| text-sm` 8 · `h-8 \| text-base` 8 · `h-9 \| text-base` 8 · `h-10 \| text-base` 2 |
| Radius usage (site-wide) | `rounded-lg` 946 · `rounded-full` 162 · `rounded` 43 · `rounded-md` 21 |
| Type usage on `<button>` | `text-sm` 190 · `text-base` 31 · `text-xs` 13 |
| Square boxes | `w-6 h-6` ×2 only — **icon buttons are not tracked as square boxes**; they are `size-N` where N = the control height |

The pairing table is the load-bearing one: **every control height pairs with a *text* class,
never with a square icon box.** A 36px button is `h-9 + text-base`, not a 36×36 icon tile —
icon-only buttons are a separate *shape modifier* (`size-9`, `p-0`, `justify-center`).

### Variant frequency (derived from the 57 `data-kumo-component="Button" | "LinkButton"` nodes)

| Variant | Instances | Distinct recipes |
|---|---|---|
| **ghost** | 32 | 7 |
| **secondary** | 16 | 5 |
| **emphasis** (primary) | 7 | 4 |
| **outline** | 2 | 2 |

Ghost dominates: the chrome of the dashboard is quiet, and colour is spent almost
exclusively on the one emphasis button per view.

---

## 1. Anatomy

### 1.1 Text button (ghost, the common case)

```html
<button data-kumo-component="Button" type="button"
        class="… ghost h-8 …">
  <svg class="size-4 text-neutral-500" fill="currentColor" viewBox="0 0 256 256">…</svg>
  <span class="contents">          <!-- label slot; `display:contents` so the flex gap still applies -->
    <span>Ask AI</span>
  </span>
</button>
```

| Part | Rule |
|---|---|
| **Root** | `<button type="button">` — *every* observed button sets `type` explicitly. `display:flex; align-items:center; width:max-content; flex-shrink:0`. |
| **Border** | None. `border-0` on every button — the outline is a **ring** (Tailwind box-shadow), never a `border`. |
| **Icon (leading)** | `<svg>` at `size-4` (**16px**, 8/9 observed in-button icons; `size-4.5`/18px once). Phosphor-style, `fill="currentColor"`, `viewBox="0 0 256 256"`. `facts.json` icons: `dominantStyle: "fill"`, standard sizes 12/14/16/18/20/24. |
| **Label** | Wrapped in `<span class="contents">`. Never `<div>`. |
| **Gap** | The size cluster owns it: `gap-1` (xs) / `gap-1.5` (md) / `gap-2` (lg). |
| **Trailing** | Caret / kbd hints go in a trailing `<span aria-hidden="true">` coloured `--text-color-kumo-subtle`. |

### 1.2 Emphasis button (two-layer)

```html
<button data-kumo-component="Button" type="button"
        class="… relative overflow-hidden bg-(--kumo-button-emphasis-bg) !text-white
               ring ring-(--kumo-button-emphasis-ring) disabled:opacity-50 h-10 …"
        style="--kumo-button-emphasis-ring: color-mix(in oklch, var(--color-kumo-brand), black 10%);
               --kumo-button-emphasis-bg: color-mix(in oklch, var(--color-kumo-brand), white 30%);
               --kumo-button-emphasis-gradient-start: color-mix(in oklch, var(--color-kumo-brand), white 15%);
               --kumo-button-emphasis-gradient-end: var(--color-kumo-brand);">
  <span aria-hidden="true"
        class="absolute inset-0 rounded-[inherit] bg-linear-to-b
               from-(--kumo-button-emphasis-gradient-start)
               to-(--kumo-button-emphasis-gradient-end)
               translate-y-px group-hover:from-(--kumo-button-emphasis-bg)"></span>
  <span class="relative flex items-center gap-1.5">   <!-- content layer, above the overlay -->
    <span class="contents"><span>Create application</span></span>
  </span>
</button>
```

Three stacked layers:
1. **Flat fill** — `background-color: var(--kumo-button-emphasis-bg)` (brand + 30% white).
2. **Gradient overlay** — an `aria-hidden` span, `inset-0`, `border-radius: inherit`,
   linear-gradient *to bottom in oklab* from `gradient-start` (brand + 15% white) to
   `gradient-end` (pure brand), nudged `translateY(1px)` so a hairline of the lighter flat
   fill shows at the top edge (a lit bevel).
3. **Content** — `position: relative` so it paints above the overlay.

**Hover is the gradient flattening**, not a colour swap: `group-hover:from-(--…-bg)` re-points
the gradient's start to the base fill. There is no hover background change and no hover ring change.

`buttons.css` reproduces the overlay with `::before` (so plain markup works) *and* honours a
literal `.ds-btn__overlay` span for DOM parity.

### 1.3 Icon-only button

```html
<button data-kumo-component="Button" type="button" aria-label="User menu"
        aria-haspopup="menu" aria-expanded="false"
        class="… gap-1.5 rounded-lg text-base items-center justify-center p-0 size-8 …">
  <svg class="size-4 text-kumo-subtle" fill="currentColor" viewBox="0 0 256 256">…</svg>
</button>
```

Icon-only = **the same size cluster, plus `items-center justify-center p-0 size-N`**, where
`size-N` equals the control height (`size-6.5` / `size-8` / `size-9`). The `text-*` class
stays in the stack even though there is no text — the icon inherits `currentColor`, and
icon glyphs are usually `--text-color-kumo-subtle`, brightening to `--text-color-kumo-default`
on hover. **All 14 icon-only instances carry an `aria-label`.**

### 1.4 Link button

`<a data-kumo-component="LinkButton" href="…">` — identical recipe plus `no-underline!` and
`flex items-center`. 14 instances, present in all four variants. External ones add
`rel` + `target` (2 instances).

---

## 2. Sizes

Three size clusters ship with the component. Each is one contiguous run of utilities in the
compiled class string:

| Size | Height | Utility cluster | Padding | Gap | Radius | Type | Icon-only box |
|---|---|---|---|---|---|---|---|
| **xs** (compact) | **26px** | `h-6.5 gap-1 rounded-md px-2 text-xs` | 8px | 4px | **6px** (`--radius-md`) | **12px** (`--text-xs`) | `size-6.5` |
| **md** *(default)* | **36px** | `h-9 gap-1.5 rounded-lg px-3 text-base` | 12px | 6px | 8px (`--radius-lg`) | **14px** (`--text-base`) | `size-9` |
| **lg** | **40px** | `h-10 gap-2 rounded-lg px-4 text-base` | 16px | 8px | 8px (`--radius-lg`) | **14px** (`--text-base`) | not observed |

Plus one **override-derived** size that is too common to ignore:

| Size | Height | Origin |
|---|---|---|
| **sm** | **32px** (`h-8` / `size-8`) | Not a built-in cluster — consumers append `h-8` *after* the size cluster. It is nonetheless the most-used button height in the capture (`h-8` ×16 vs `h-9` ×26 on `<button>`, and **24 of 57** component instances). Promoted to a first-class `.ds-btn--sm`. |

`h-8` pairs with **both** type sizes (`text-sm` ×8 and `text-base` ×8 per `facts.json`).
`text-base` (14px) is the component default; use `.ds-btn--type-sm` for the 13px pairing
(seen on search/trigger rows).

**xs is the only size that changes the radius** (6px instead of 8px). Everything else in the
product is `rounded-lg` — 946 uses site-wide.

---

## 3. Variants

### 3.1 `emphasis` — primary / CTA (7 instances)

```
relative overflow-hidden shadow-xs
bg-(--kumo-button-emphasis-bg) !text-white
ring ring-(--kumo-button-emphasis-ring)
disabled:opacity-50
```

| Property | Token |
|---|---|
| Background | `--kumo-button-emphasis-bg` = brand + 30% white |
| Gradient | `--kumo-button-emphasis-gradient-start` (brand + 15% white) → `--kumo-button-emphasis-gradient-end` (`--color-kumo-brand`) |
| Ring (1px) | `--kumo-button-emphasis-ring` = brand + 10% black |
| Label | `--color-white` — **white in both themes** (forced with `!`) |
| Elevation | `shadow-xs` |
| Hover | gradient start → `--kumo-button-emphasis-bg` |
| Disabled | `opacity: .5` (label stays white) |

One per view. It is the only variant that spends colour.

### 3.2 `secondary` — surfaced default (16 instances)

```
shadow-xs bg-kumo-base !text-kumo-default ring ring-kumo-line
not-disabled:hover:bg-kumo-tint
disabled:bg-kumo-base/50 disabled:!text-kumo-default/70
data-[state=open]:bg-kumo-base
```

| Property | Token |
|---|---|
| Background | `--color-kumo-base` (white in light, `oklch(17% 0 0)` in dark) |
| Ring (1px) | `--color-kumo-line` (`oklch(14.5% 0 0/.1)` light, `oklch(32% 0 0)` dark) |
| Label | `--text-color-kumo-default` |
| Elevation | `shadow-xs` |
| Hover | `--color-kumo-tint` |
| Open (menu/select trigger) | stays `--color-kumo-base` — **it does not remain tinted** |
| Disabled | bg `--color-kumo-base` @ 50%, label `--text-color-kumo-default` @ 70% |

This is also the base for **every menu / select / combobox trigger** (add `.ds-btn--trigger`).

### 3.3 `ghost` — the workhorse (32 instances)

```
text-kumo-default hover:bg-kumo-tint shadow-none bg-inherit
```

| Property | Token |
|---|---|
| Background | `inherit` — **not `transparent`** |
| Ring | none at rest |
| Label | `--text-color-kumo-default` |
| Hover | `--color-kumo-tint` |
| Elevation | none (`shadow-none`) |

`bg-inherit` matters: a ghost button inside an elevated card takes the card's surface, so it
reads as part of the card rather than punching a hole through it.

### 3.4 `outline` — quiet bordered (2 instances — the rarest real variant)

```
bg-transparent text-kumo-default ring ring-kumo-line transition-colors
not-disabled:hover:text-kumo-strong
not-disabled:hover:ring-kumo-focus/25
```

| Property | Token |
|---|---|
| Background | `transparent` |
| Ring (1px) | `--color-kumo-line` → hover `--color-kumo-focus` @ 25% |
| Label | `--text-color-kumo-default` → hover `--text-color-kumo-strong` |
| Transition | **the only variant that declares one** (`transition-colors`) |

Hover strengthens the *label and ring*; the surface never fills.

### 3.5 Modifiers

| Modifier | Utilities | Use with |
|---|---|---|
| **icon** | `items-center justify-center p-0 size-N` | any variant; **requires `aria-label`** |
| **trigger** | `justify-between font-normal focus-visible:ring-inset` | `secondary`; menus, selects, comboboxes |
| **block** | `w-full block overflow-x-clip` | sidebar quick-search; full-bleed rows |

### 3.6 Not observed (PRESCRIPTIVE if you need them)

- **`danger` / destructive button.** `--color-kumo-danger`, `--color-kumo-danger-tint`,
  `--text-color-kumo-danger` all exist, but **no button uses them** in the capture — the only
  danger usage is `has-[input[aria-invalid=true]]:ring-kumo-danger` on inputs. If you add a
  destructive variant, mirror `emphasis` with `--color-kumo-danger` in place of
  `--color-kumo-brand`; do not invent a new token.
- **Loading / busy button.** No `aria-busy`, no `animate-spin` inside any button.
- **Pressed / `:active`.** No `active:` utility on any button. There is no pressed treatment.
- **Toggle / segmented / split button, button group.** Not observed.
- **`success` / `warning` / `info` buttons.** Not observed (those tokens serve badges & banners).

---

## 4. States

Every state below is compiled into the class string on **every** button, regardless of variant.

| State | Utility | Result |
|---|---|---|
| **Rest** | — | per variant (§3) |
| **Hover** | `hover:bg-kumo-tint` / `not-disabled:hover:*` | ghost & secondary tint the surface; outline strengthens label+ring; emphasis flattens its gradient. Secondary/outline guard hover with `not-disabled:`. |
| **Focus** (any, incl. mouse) | `focus:outline-none focus:ring-kumo-focus/50` | UA outline removed, existing ring **recoloured** to `--color-kumo-focus` @ 50%. Width is unchanged (so ghost shows nothing here). |
| **Focus-visible** (keyboard) | `focus-visible:ring-2 focus-visible:ring-kumo-brand` | **2px ring in `--color-kumo-brand`.** This is the real focus indicator. On triggers it is `ring-inset`. |
| **Open** (menu/select) | `data-[state=open]:bg-kumo-base` | holds the resting surface; `aria-expanded` flips to `true` |
| **Disabled** | `disabled:cursor-not-allowed disabled:text-kumo-subtle` (+ per-variant) | `cursor:not-allowed`, label `--text-color-kumo-subtle`; emphasis → `opacity:.5`; secondary → bg 50% / label 70% |
| **Active / pressed** | — | **none** |
| **Loading** | — | **none** (PRESCRIPTIVE recipe provided in `buttons.css`) |

### Motion

The Button component **declares no transition**. Hover colour changes are instantaneous
everywhere except `outline` (`transition-colors`) and the sidebar quick-search
(`transition-[color,background,border,box-shadow] duration-250`). `facts.json` motion:
most common duration `.2s` (×17), easing `ease` (×15); Tailwind's
`--default-transition-duration` is `.1s` with `cubic-bezier(.4, 0, .2, 1)`.
If you want a fade, opt in with `.ds-btn--animated` — don't change the base.
8 `prefers-reduced-motion` rules exist in the target; honour it.

---

## 5. Accessibility

**Observed in the capture — keep these.**

- **`type="button"` is always explicit.** Every `<button data-kumo-component="Button">` sets it,
  which prevents accidental form submits.
- **Icon-only buttons always carry `aria-label`.** 14/14 instances
  (attribute set `aria-label, data-kumo-component, type`). No exceptions.
- **Menu triggers** carry `aria-haspopup="menu"`, `aria-expanded`, `id`, `tabindex="0"`, and a
  `data-state` that mirrors `aria-expanded`. **Select triggers** additionally use
  `role="combobox"` + `aria-haspopup="listbox"`, with the placeholder marked
  `data-[placeholder]` and coloured `--text-color-kumo-placeholder`.
- **`focus:outline-none` is never unpaired.** It is always accompanied by a ring
  (`focus:ring-kumo-focus/50`, then `focus-visible:ring-2 focus-visible:ring-kumo-brand`).
  Removing the ring utilities would leave keyboard users with no focus indicator.
- **Decorative layers are hidden.** The emphasis gradient overlay and the trigger caret are
  `aria-hidden="true"`.
- **Icons inherit `currentColor`** — they cannot desync from the label colour, including in
  the disabled state.

**Watch-outs.**

- **Hit target.** `xs` is **26px** tall — above the 24×24 CSS-px floor of WCAG 2.5.8 (AA) but
  below the 44×44 target of 2.5.5 (AAA). Reserve `xs` for dense toolbars where a larger
  spacing-inclusive target exists around it; never use it for a primary action.
- **`focus` vs `focus-visible`.** Because `:focus` only recolours the ring at the *variant's*
  width, a focused-by-mouse **ghost** button shows nothing. That's intentional (the pointer
  already tells the user where they are) — but it means the keyboard `focus-visible` rule is
  the only visible indicator. Do not weaken it.
- **Disabled buttons stay in the tab order** unless you also remove them; `disabled` on a
  `<button>` removes it, but `aria-disabled` on an `<a class="ds-link-btn">` does **not** —
  `buttons.css` adds `pointer-events: none` for that case, and you must also drop `href` or
  intercept the click.
- **Emphasis label is forced white in both themes** (`!text-white`). Check contrast if you
  ever re-point `--color-kumo-brand`: white on the light-theme brand
  (`oklch(57.72% .2324 260)` + 30% white) is the tightest pair in the system.
- **Ghost on an unexpected surface.** `bg-inherit` means the hover tint
  (`--color-kumo-tint`) is the only thing that reads. On a surface already close to
  `--color-kumo-tint` (e.g. a recessed panel), the hover affordance disappears — use
  `secondary` there.

---

## 6. Do / Don't

**Do**

- Use **one `emphasis` button per view.** The capture averages **<1 per page** (7 across 8 pages).
- Reach for **`ghost` by default** (32/57). Secondary when the action needs a surface;
  emphasis only for the page's single primary action.
- Give every icon-only button an `aria-label` and `size-N` matching its size cluster.
- Keep the **ring**, not a border: `border-0` + box-shadow ring, so the ring can grow to 2px on
  focus without shifting layout.
- Let the emphasis button's colours derive from `--color-kumo-brand` via the four
  `--kumo-button-emphasis-*` `color-mix()`es — re-theming then costs one token.
- Use `text-base` (14px) as the button type; drop to `text-sm` (13px) only for the `h-8`
  search/trigger pairing that the product already ships.

**Don't**

- **Don't hardcode `#f6821f`** (the orange) as a button colour. It is `--text-color-kumo-brand`,
  a text token. The button brand is **blue** (`--color-kumo-brand`).
- **Don't make icon buttons "square boxes" from a separate scale.** They are a size cluster
  plus `p-0 justify-center size-N` where N *is* the control height. `facts.json` records only
  two `w-6 h-6` boxes site-wide.
- **Don't add a `border`.** Every button is `border-0`; a border would double up with the ring
  and shift the 1px→2px focus transition.
- **Don't swap `bg-inherit` for `bg-transparent` on ghost** — you lose the "part of the card"
  read.
- **Don't invent a `rounded-md` on md/lg buttons.** Only `xs` uses the 6px radius.
- **Don't remove `focus:outline-none` without also removing the ring utilities**, and never the
  reverse.
- **Don't add a hover *background* to `emphasis`.** Its hover is the gradient flattening; adding
  a bg change double-signals.
- **Don't build a destructive button by tinting `emphasis` red ad hoc** — no destructive variant
  is observed; if you add one, derive it from `--color-kumo-danger` the same way emphasis
  derives from `--color-kumo-brand`.

---

## 7. Using this in Tailwind CSS v4 + shadcn/ui

### 7.1 Theme wiring (`app/globals.css`)

```css
@import "tailwindcss";

/* 1. The token layer, verbatim. Light = :root, dark = [data-mode=dark]. */
@import "../design-system/tokens/colors.css";
@import "../design-system/tokens/typography.css";

/* 2. Teach Tailwind the dark variant. The source switches on [data-mode=dark];
      next-themes writes .dark by default. Support BOTH so either wiring works. */
@custom-variant dark (&:where(.dark, .dark *, [data-mode="dark"], [data-mode="dark"] *));

/* 3. Register the tokens the button utilities need. A theme key IS the utility name,
      so it must differ from the token it points at: `--color-kumo-base: var(--color-kumo-base)`
      is a circular custom-property reference and computes to nothing — the same reason
      ../design-system/tokens/index.css refuses to re-declare --font-sans. `inline` keeps the
      var() reference, so the theme selectors keep working. */
@theme inline {
  /* Surfaces / line / focus / brand → bg-base, bg-tint, ring-line, ring-focus, ring-brand.
     Same namespace the rest of the system uses; the full surface set is in
     ../design-system/foundations/colors.md §13.2. */
  --color-base:  var(--color-kumo-base);
  --color-tint:  var(--color-kumo-tint);
  --color-line:  var(--color-kumo-line);
  --color-focus: var(--color-kumo-focus);
  --color-brand: var(--color-kumo-brand);

  /* Ink → text-ink-default / -strong / -subtle / -placeholder. The target's ink lives in
     --text-color-kumo-*. Do NOT mint --color-kumo-default / -strong (no such tokens) or
     --color-kumo-subtle — that name is already taken: the target aims it at a dot-grid
     background, where it resolves to nothing (../design-system/foundations/colors.md §11.3). */
  --color-ink-default:     var(--text-color-kumo-default);
  --color-ink-strong:      var(--text-color-kumo-strong);
  --color-ink-subtle:      var(--text-color-kumo-subtle);
  --color-ink-placeholder: var(--text-color-kumo-placeholder);

  /* The target's non-standard type scale — 14/13/12, not Tailwind's 16/14/12.
     Literals, not self-references — safe, and they also beat a stock shadcn
     globals.css that ships Tailwind's defaults. */
  --text-base: 14px;
  --text-sm:   13px;
  --text-xs:   12px;

  --radius-lg: 0.5rem;
  --radius-md: 0.375rem;
}
```

With next-themes, either set `attribute="data-mode"` (matches the source exactly) or keep the
default `class` — the `@custom-variant` above covers both.

**The port's class names are not the source's.** §§0–6 quote the target's own utilities
(`bg-kumo-base`, `text-kumo-default`) because that is what the captured DOM says. Those names
cannot be re-registered as-is, so the recipes below rename the namespace. **The values are
identical** — only the utility prefix changes.

| Source class | Port class | Resolves to |
|---|---|---|
| `bg-kumo-base` | `bg-base` | `--color-kumo-base` |
| `bg-kumo-tint` | `bg-tint` | `--color-kumo-tint` |
| `ring-kumo-line` | `ring-line` | `--color-kumo-line` |
| `ring-kumo-focus/50` | `ring-focus/50` | `--color-kumo-focus` |
| `ring-kumo-brand` | `ring-brand` | `--color-kumo-brand` |
| `text-kumo-default` / `-strong` / `-subtle` | `text-ink-default` / `-strong` / `-subtle` | `--text-color-kumo-*` |
| `text-kumo-placeholder` | `text-ink-placeholder` | `--text-color-kumo-placeholder` |

Two token families need **no** registration and keep their real names: the four
`--kumo-button-emphasis-*` vars (consumed through Tailwind's arbitrary syntax,
`bg-(--kumo-button-emphasis-bg)`) and `--color-kumo-danger` (§3.6 derives it with `color-mix()`,
not a utility). Both resolve straight from `colors.css`.

### 7.2 `components/ui/button.tsx` (shadcn/ui + class-variance-authority)

shadcn's stock Button is a `cva` over `Slot`; swap its variant table for this one. The
`compoundVariants` block encodes the icon-only rule (**size-N = the control height**).

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // BASE — the shared prefix of every captured button.
  [
    "group inline-flex w-max shrink-0 items-center font-medium select-none border-0",
    "cursor-pointer",
    "focus:outline-none focus:ring-focus/50",
    "focus-visible:ring-2 focus-visible:ring-brand",
    "disabled:cursor-not-allowed disabled:text-ink-subtle",
    "[&_svg]:shrink-0 [&_svg]:size-4",   // lucide at 16px, the dominant in-button icon size
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary. The 4 emphasis props are set inline (see `emphasisStyle` below)
        // because they are color-mix() derivations of --color-kumo-brand.
        emphasis:
          "relative overflow-hidden shadow-xs bg-(--kumo-button-emphasis-bg) !text-white " +
          "ring ring-(--kumo-button-emphasis-ring) disabled:opacity-50",
        secondary:
          "shadow-xs bg-base !text-ink-default ring ring-line " +
          "not-disabled:hover:bg-tint " +
          "disabled:bg-base/50 disabled:!text-ink-default/70 " +
          "data-[state=open]:bg-base",
        ghost:
          "bg-inherit text-ink-default shadow-none hover:bg-tint",
        outline:
          "bg-transparent text-ink-default ring ring-line transition-colors " +
          "not-disabled:hover:text-ink-strong not-disabled:hover:ring-focus/25",
      },
      size: {
        xs: "h-6.5 gap-1 rounded-md px-2 text-xs [&_svg]:size-3.5",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-base",   // override-derived, but the most used
        md: "h-9 gap-1.5 rounded-lg px-3 text-base",   // component default
        lg: "h-10 gap-2 rounded-lg px-4 text-base",
      },
      iconOnly: { true: "justify-center p-0", false: "" },
    },
    compoundVariants: [
      // Icon-only: the square box side == the control height. Never a separate scale.
      { iconOnly: true, size: "xs", class: "size-6.5" },
      { iconOnly: true, size: "sm", class: "size-8" },
      { iconOnly: true, size: "md", class: "size-9" },
      { iconOnly: true, size: "lg", class: "size-10" }, // PRESCRIPTIVE: lg icon not observed
    ],
    defaultVariants: { variant: "ghost", size: "md", iconOnly: false },
  },
);

// The emphasis token family, derived from the brand token (theme-reactive).
const emphasisStyle = {
  "--kumo-button-emphasis-bg": "color-mix(in oklch, var(--color-kumo-brand), white 30%)",
  "--kumo-button-emphasis-ring": "color-mix(in oklch, var(--color-kumo-brand), black 10%)",
  "--kumo-button-emphasis-gradient-start":
    "color-mix(in oklch, var(--color-kumo-brand), white 15%)",
  "--kumo-button-emphasis-gradient-end": "var(--color-kumo-brand)",
} as React.CSSProperties;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, iconOnly, asChild = false, style, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        type={asChild ? undefined : props.type ?? "button"}  // always explicit, as in the source
        className={cn(buttonVariants({ variant, size, iconOnly }), className)}
        style={variant === "emphasis" ? { ...emphasisStyle, ...style } : style}
        {...props}
      >
        {variant === "emphasis" ? (
          <>
            {/* decorative gradient overlay — aria-hidden, exactly as the source */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[inherit] translate-y-px
                         bg-linear-to-b from-(--kumo-button-emphasis-gradient-start)
                         to-(--kumo-button-emphasis-gradient-end)
                         group-hover:from-(--kumo-button-emphasis-bg)"
            />
            <span className="relative flex items-center gap-1.5">{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
```

### 7.3 Usage

```tsx
import { Plus, Settings, ChevronDown } from "lucide-react";

// The one primary action on the page.
<Button variant="emphasis" size="lg"><Plus />Create application</Button>

// Default toolbar action.
<Button variant="ghost" size="sm"><Settings />Configure</Button>

// Icon-only — aria-label is mandatory.
<Button variant="ghost" size="sm" iconOnly aria-label="User menu"><Settings /></Button>

// Link button — `asChild` gives you <a> with the button recipe (source: LinkButton).
<Button asChild variant="secondary" size="md" className="no-underline">
  <a href="/workers">Open Workers</a>
</Button>

// Select / menu trigger — secondary + the trigger modifier.
<Button
  variant="secondary" size="md" role="combobox" aria-expanded={open}
  className="justify-between font-normal focus-visible:ring-inset w-40"
>
  Category
  <ChevronDown aria-hidden className="text-ink-subtle" />
</Button>
```

### 7.4 Mapping to the rest of shadcn/ui

| shadcn/ui | Wire it to |
|---|---|
| `Button` | this `cva` (§7.2) |
| `DropdownMenuTrigger` / `PopoverTrigger` | `<Button asChild variant="secondary">` — Radix supplies `data-state="open"`, which the `data-[state=open]:bg-base` utility already handles |
| `SelectTrigger` | `secondary` + `justify-between font-normal focus-visible:ring-inset`; placeholder → `data-[placeholder]:text-ink-placeholder` |
| `AlertDialogAction` (destructive) | **not observed** — derive from `--color-kumo-danger` (§3.6) |
| `Toggle` / `ToggleGroup` | **not observed** — PRESCRIPTIVE |
| Icons | `lucide-react` at `size-4` (16px). The source ships fill-based Phosphor icons; lucide is stroke-based, so expect a slightly lighter optical weight — bump `strokeWidth` to `2` if it reads too thin next to the 14px label. |
| Dark mode | `next-themes` with `attribute="data-mode"` (exact parity) or the default `.dark` class (covered by the `@custom-variant` in §7.1) |

### 7.5 Gotchas when porting

1. **`text-base` is 14px here.** If you skip the `@theme` override in §7.1, every button grows
   2px of type and the height↔type pairings stop matching the source.
2. **`ring` is 1px, `ring-2` is 2px** — the focus state grows the ring, so don't add
   `ring-offset-*` (the source never does; there is no offset ring anywhere).
3. **`bg-inherit` on ghost, not `bg-transparent`** — shadcn's stock ghost uses transparent.
4. **`shadow-xs` isn't in the mined token set** (no `elevation.css` was emitted). The recipes
   fall back to Tailwind v4's own `--shadow-xs` (`0 1px 2px 0 rgb(0 0 0 / .05)`); if you later
   mine an elevation token, point `--ds-btn-shadow` at it.
5. **`h-6.5` / `size-6.5` / `h-8.5`** are half-step spacing utilities — they work out of the box
   in Tailwind v4 (`--spacing: .25rem` × 6.5 = 26px), no config needed.
