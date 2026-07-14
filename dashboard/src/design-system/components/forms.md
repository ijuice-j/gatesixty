# Form controls

Text input · Input group · Textarea · Select · Checkbox · Radio · Switch

Recipes: [`forms.css`](./forms.css) · Tokens: [`../tokens/colors.css`](../tokens/colors.css)

---

## Evidence status — read this first

The target (`dash.cloudflare.com`) was classified **`utility-compiled`**
(`classification.json`: utility ratio 0.79, 5366 utility classes vs 432 semantic).
There is no `.input {}` class to copy. The values live in Tailwind utilities on
each element, so every recipe below was reconstructed from **the utility list on
the real rendered element** plus **the compiled rule each utility resolves to**.

| Control | Status | Evidence |
|---|---|---|
| **Text input** | **OBSERVED** | 4 rendered instances, all inside an input-group |
| **Input group** (`data-slot="input-group"`) | **OBSERVED** | 4 instances; leading-addon slot on all 4 |
| **Select** (`data-kumo-component="Select"`) | **OBSERVED** | 3 instances, `role="combobox"` |
| **Field stack** (`grid gap-2`) | **OBSERVED** | wraps the Select trigger |
| **Invalid state** | **OBSERVED (rule only)** | compiled `has-[input[aria-invalid=true]]:ring-kumo-danger` exists; no invalid instance ever rendered |
| **Textarea** | 🟡 **PRESCRIPTIVE** | `textarea: 0` across all 8 pages |
| **Checkbox** | 🟡 **PRESCRIPTIVE** | see the trap below |
| **Radio** | 🟡 **PRESCRIPTIVE** | `radio: 0` |
| **Switch** | 🟡 **PRESCRIPTIVE** | `switch: 0` |
| **Visible label / helper / error** | 🟡 **PRESCRIPTIVE** | no labelled field rendered |
| **Readonly** | 🟡 **PRESCRIPTIVE** | no `readonly` attribute anywhere |

> **The checkbox trap.** `facts.json` reports `checkbox: 72` raw / `9` deduped.
> **None of them belong to this design system.** Every single one is a OneTrust
> cookie-consent widget (`.ot-switch`, `.category-switch-handler`,
> `#onetrust-*`) injected by a third-party script. Do not mine them for tokens,
> geometry, or behaviour. Cloudflare's own checkbox never rendered in the
> capture, so the checkbox recipe here is an extrapolation.

> **Native `<select>` is also 0** — but that is a false negative. The system
> ships a *custom* Select: a `<button role="combobox">` plus a visually-hidden
> `<input>` that carries the value for form submission. `facts.json` counts the
> `<select>` tag, which this pattern never uses. The Select recipe **is**
> grounded.

Prescriptive recipes use only tokens the system already ships, and every design
choice in them is justified in a comment. Treat them as proposals to review, not
as extracted fact.

---

## The system's real traits

These are the load-bearing, non-obvious decisions. Preserve them; do not
substitute conventions from another design system.

### 1. The edge is a ring, not a border

Every control is `border-0` and draws its edge with a Tailwind `ring` — an
**outset `box-shadow`**. Because box-shadow is outside the layout box, the
1px → 1.5px growth on focus **cannot shift the control by a subpixel**. If you
reimplement the edge as a `border`, focus will nudge every field in the form.

```
rest   →  box-shadow: 0 0 0 1px   var(--color-kumo-line)
focus  →  box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--color-kumo-focus) 50%, transparent)
```

### 2. The focus ring is neutral, not branded

`--color-kumo-focus` is **near-black in light, near-white in dark**
(`neutral-950` / `neutral-150`) — used at **50% alpha, 1.5px**. This is a
high-contrast neutral halo, not an accent glow.

The brand ring exists too, but it is reserved for **keyboard-only** focus:
`focus-visible:ring-2 ring-kumo-brand` (observed on Select and Button). So the
system runs a **two-tier focus model**:

| Trigger | Ring |
|---|---|
| Pointer / programmatic `:focus` | 1.5px `--color-kumo-focus` @ 50% (neutral) |
| Keyboard `:focus-visible` | 2px `--color-kumo-brand` (solid, `ring-inset` on Select) |

Do not "fix" the neutral ring to an accent colour. It is the trait.

### 3. `--color-kumo-brand` is blue; `--text-color-kumo-brand` is orange

A genuine split in the token layer, and an easy way to ship the wrong colour:

- `--color-kumo-brand` → `oklch(57.72% .2324 260)` — **blue**. Surfaces, rings, fills.
- `--text-color-kumo-brand` → `#f6821f` — **Cloudflare orange**. Text only.

The brand *focus ring* is therefore blue, not orange.

### 4. Entry and choice get different surfaces

| Control | Surface token | Why |
|---|---|---|
| Text input, textarea | `--color-kumo-control` | "type into me" — white in light, `neutral-900` in dark |
| Select trigger | `--color-kumo-base` | "press me" — same surface as Button |

Keep the split. It is how the system distinguishes an input from a picker
without any extra chrome.

### 5. `text-base` is **14px**, not 16px

The target overrides the Tailwind default: `--text-base: 14px`,
`--text-sm: 13px`, `--text-xs: 12px`. All controls use `text-base` (14px).
`text-sm` (13px) is the dominant type class overall (914 uses) and is the right
size for helper text and the `sm` control.

> **iOS zoom caveat:** Safari auto-zooms on focus for inputs under 16px. The
> target accepts this. If you cannot, raise the font-size at the viewport level
> rather than changing the token.

### 6. `disabled:text-kumo-disabled` is a dead class

It sits in the shipped markup, but **neither the utility nor a
`--text-color-kumo-disabled` token exists anywhere in the CSS**. It resolves to
nothing. The mechanism that actually works is `opacity-50` +
`pointer-events-none`. Don't cargo-cult the dead class.

---

## Anatomy

### Input group — the shape every text field actually takes

All four rendered text fields are built this way. The **wrapper owns everything
visual**; the `<input>` is stripped bare and just fills the box.

```
┌─ label[data-slot="input-group"][data-focus-mode="container"] ──────────┐
│  ring · radius · height · surface · shadow · cursor:text · overflow    │
│  ┌──────────┐ ┌──────────────────────────────┐ ┌───────────┐          │
│  │ addon-   │ │ input                        │ │ addon-end │          │
│  │ start    │ │ ring-0! bg-transparent       │ │  /suffix  │          │
│  │ 18px svg │ │ border-0 rounded-none        │ │           │          │
│  │ subtle   │ │ h-full grow px-3             │ │  subtle   │          │
│  └──────────┘ └──────────────────────────────┘ └───────────┘          │
└────────────────────────────────────────────────────────────────────────┘
        ↑ focus proxied to the wrapper via :focus-within
```

Three things to notice:

1. **The wrapper is a `<label>`.** That is what makes `cursor: text` honest —
   clicking anywhere in the box, including the icon, focuses the input.
2. **The inner input kills its own ring** (`ring-0!`, `focus:ring-0!`,
   `shadow-none`, `outline-none`). Exactly one ring is ever drawn, by the
   wrapper. `data-focus-mode="container"` is the flag for this.
3. **`overflow: hidden`** clips the addons to the 8px radius.

Slots (`addon-start` is the only one rendered, but the wrapper's compiled
`has-[[data-slot=…]]` variants prove the other two are in the API):

| Slot | Rendered? | Effect on the input |
|---|---|---|
| `input-group-addon-start` | ✅ 4× | `padding-inline-start` tightens 12px → 8px |
| `input-group-addon-end` | — (variant exists) | `padding-inline-end` tightens 12px → 8px |
| `input-group-suffix` | — (variant exists) | `field-sizing: content`, `grow-0`, `pr-0` — input shrink-wraps so the suffix hugs the value |

### Select

```
button[role="combobox"][aria-haspopup="listbox"][aria-expanded]
      [data-kumo-component="Select"][data-kumo-part="trigger"]
┌───────────────────────────────────────────────┐
│ span.value  (truncate, data-placeholder)   ⌄  │  ← 16px CaretUpDown, subtle
└───────────────────────────────────────────────┘
+ input[aria-hidden][tabindex="-1"]  ← visually hidden, carries the form value
```

---

## Tokens used

Every value in `forms.css` resolves to one of these. All are theme-aware —
`:root` / `[data-mode=dark]` swap them for free.

| Role | Token |
|---|---|
| Input / textarea surface | `--color-kumo-control` |
| Select trigger surface | `--color-kumo-base` |
| Select hover surface | `--color-kumo-tint` |
| Readonly surface *(prescriptive)* | `--color-kumo-recessed` |
| Listbox surface *(prescriptive)* | `--color-kumo-elevated` |
| Switch OFF track *(prescriptive)* | `--color-kumo-fill` |
| Checked fill *(prescriptive)* | `--color-kumo-contrast` |
| Rest ring | `--color-kumo-line` |
| Focus ring | `--color-kumo-focus` @ 50% |
| Hover ring | `--color-kumo-focus` @ 25% |
| Keyboard ring | `--color-kumo-brand` |
| Invalid ring | `--color-kumo-danger` |
| Value text | `--text-color-kumo-default` |
| Selected / emphasis text | `--text-color-kumo-strong` |
| Placeholder | `--text-color-kumo-placeholder` |
| Addon, chevron, helper | `--text-color-kumo-subtle` |
| Error text, required mark | `--text-color-kumo-danger` |
| Checked glyph *(prescriptive)* | `--text-color-kumo-inverse` |

Geometry comes from the Tailwind v4 theme layer the target also ships:
`--spacing` (.25rem), `--radius-lg` (.5rem), `--radius-sm` (.25rem),
`--text-base` (14px), `--text-sm` (13px), `--default-transition-duration` (.1s).

---

## Sizes

All three heights appear in `usage.controlHeights`. **`md` (36px) is the
default** and the only size any rendered field uses.

| Size | Class | Height | Type | Padding-x | Radius |
|---|---|---|---|---|---|
| `sm` | `.ds-input--sm` | `h-8` → **32px** | `text-sm` 13px | 12px | 8px |
| **`md`** | *(base)* | `h-9` → **36px** | `text-base` 14px | 12px | 8px |
| `lg` | `.ds-input--lg` | `h-10` → **40px** | `text-base` 14px | 12px | 8px |

Radius is `rounded-lg` (8px) at **every** size — it is the system's dominant
radius (946 uses). Do not scale it with the control.

Icons: **18px** in an input addon; **16px** for the Select chevron. Both
`fill: currentColor` (`fill` is the dominant icon style: 317 vs 35 stroke).

---

## States

### Text input / input group

| State | Treatment | Evidence |
|---|---|---|
| **Default** | 1px `--color-kumo-line` ring · `--color-kumo-control` surface · `shadow-xs` | OBSERVED |
| **Hover** | 1px `--color-kumo-focus` @ 25% ring | 🟡 **PRESCRIPTIVE** — the rendered field has *no* hover variant. Borrowed from the system's Button/LinkButton hover idiom (`not-disabled:hover:ring-kumo-focus/25`). Delete for byte-exact parity. |
| **Focus** | 1.5px `--color-kumo-focus` @ 50% ring, via `:focus-within` on the wrapper | OBSERVED |
| **Focus-visible** | 2px solid `--color-kumo-brand` ring | OBSERVED on Select/Button; extended to inputs |
| **Placeholder** | `--text-color-kumo-placeholder` | OBSERVED (`.kumo-input-placeholder::placeholder`) |
| **Invalid** | ring → `--color-kumo-danger` (1px rest, 1.5px focus) | OBSERVED (rule) |
| **Disabled** | `opacity: .5` + `pointer-events: none` | OBSERVED |
| **Readonly** | `--color-kumo-recessed` surface, full-contrast text, ring unchanged | 🟡 PRESCRIPTIVE |

### Select

| State | Treatment | Evidence |
|---|---|---|
| **Default** | `--color-kumo-base` surface · 1px `--color-kumo-line` ring | OBSERVED |
| **Hover** | surface → `--color-kumo-tint` (ring unchanged) | OBSERVED |
| **Open** | surface snaps back to `--color-kumo-base` | OBSERVED (`data-[state=open]:bg-kumo-base`) |
| **Focus** | 1.5px `--color-kumo-focus` @ 50% | OBSERVED |
| **Focus-visible** | 2px `--color-kumo-brand`, **inset** | OBSERVED (`focus-visible:ring-inset`) |
| **Placeholder** | value span → `--text-color-kumo-placeholder` | OBSERVED (`data-[placeholder]`) |
| **Disabled** | surface → `--color-kumo-base` @ 50%, text → `--text-color-kumo-default` @ 70%, `cursor: not-allowed` — **note it dims the surface, not the opacity** | OBSERVED |

The Select's disabled treatment is deliberately *different* from the input's
(surface-dim vs opacity-dim). Both are preserved.

---

## Label, helper, and error

🟡 **The whole pattern is PRESCRIPTIVE.** No field with a visible label rendered.
The observed fields are icon-only search boxes named by `aria-label`.

```html
<div class="ds-field">                          <!-- grid gap-2 → 8px (OBSERVED) -->
  <label class="ds-label" for="zone">Zone name</label>
  <input class="ds-input" id="zone"
         aria-describedby="zone-help" />
  <p class="ds-helper" id="zone-help">Lowercase letters, numbers and hyphens.</p>
</div>
```

Error swaps the helper and flips the ring — **both**, never just one:

```html
<div class="ds-field">
  <label class="ds-label" for="zone" data-required>Zone name</label>
  <input class="ds-input" id="zone"
         aria-invalid="true"
         aria-describedby="zone-err" />
  <p class="ds-error" id="zone-err">Zone name is already taken.</p>
</div>
```

> The invalid hook the target compiled is literally `input[aria-invalid=true]`.
> The attribute must be the **string `"true"`** — `aria-invalid` alone, or
> `aria-invalid="invalid"`, will not match. React: `aria-invalid={!!error}`
> renders `"true"`/`"false"` correctly; `aria-invalid={error}` does not.

When both helper and error are present, point `aria-describedby` at **both**
ids, space-separated: `aria-describedby="zone-help zone-err"`.

---

## Accessibility

**Naming**
- Every control needs an accessible name. The observed fields use `aria-label`
  because they have no visible label — acceptable for a search box with an icon,
  **not** acceptable for a form field. Prefer a visible `<label for>`.
- If you keep the `<label data-slot="input-group">` wrapper *and* want a visible
  label, you cannot nest two labels. Make the group a `<div>` and put the
  `<label for>` above it.
- A placeholder is **not** a label. It vanishes on input, fails
  low-vision users, and `--text-color-kumo-placeholder` (`neutral-400` light) is
  well under 4.5:1 by design.

**Validation**
- `aria-invalid="true"` on the control + `aria-describedby` → the error element.
- Put the error in a live region (`role="alert"` or `aria-live="polite"`) only if
  it appears *after* the user has moved on; on submit, moving focus to the first
  invalid field is better than announcing.
- Never signal validity with colour alone — the danger ring must be accompanied
  by the error text.

**Focus**
- The ring is the *only* focus indicator (`outline: none` everywhere). Never
  remove it without a replacement.
- **Contrast check:** the pointer-focus ring is a neutral at **50% alpha** and
  **1.5px**. WCAG 2.2 §1.4.11 requires 3:1 for non-text indicators. It passes in
  both themes over the control surface — but if you place a field on a non-token
  background, **re-measure it**. The 2px solid `--color-kumo-brand`
  focus-visible ring is the safer keyboard indicator; ship it.
- Disabled controls use `pointer-events: none`, so they are not focusable and
  cannot show a tooltip explaining *why*. If the reason matters, use
  `aria-disabled="true"` + `readonly` instead of `disabled`, keeping the control
  in the tab order.

**Forced colors**
- The rings are box-shadows, and **box-shadows are dropped in forced-colors
  mode** — every control would lose its edge. `forms.css` restores a real
  `border: 1px solid ButtonBorder` and an `outline: 2px solid Highlight` under
  `@media (forced-colors: active)`. Keep that block.

**Checkbox / radio / switch (prescriptive)**
- Hit target: the 16px box is below the 24px WCAG 2.2 §2.5.8 minimum on its own.
  The `.ds-choice` row makes the **label** part of the target, which satisfies
  it. Never ship a bare 16px box with no label.
- A radio needs `role="radiogroup"` + a group label (`aria-labelledby`). A lone
  radio is meaningless.
- Switch = **immediate commit**. Checkbox = **staged until submit**. If your
  control needs a Save button, it is a checkbox, not a switch.
- Indeterminate is a *property*, not an attribute: `el.indeterminate = true`.

**Motion**
- The capture ships 8 `prefers-reduced-motion` rules. `forms.css` honours the
  same contract — the switch thumb still lands correctly, it just doesn't slide.

---

## Do / Don't

✅ **Do**
- Draw edges with `box-shadow` rings, so focus never shifts layout.
- Keep the focus ring neutral (`--color-kumo-focus`) for pointer focus and brand
  for `:focus-visible`.
- Let the input-group **wrapper** own the ring; strip the inner input completely.
- Keep `--color-kumo-control` for entry and `--color-kumo-base` for choice.
- Use `rounded-lg` (8px) at every control size.
- Set `aria-invalid="true"` **and** render an error message.
- Wrap checkbox/radio in `.ds-choice` so the label is part of the hit target.

❌ **Don't**
- Swap the ring for a `border` — the 1px → 1.5px focus growth will jitter the form.
- Make the focus ring orange. `--text-color-kumo-brand` (#f6821f) is a **text**
  token; the brand *surface* token is blue.
- Draw two rings (wrapper + inner input). Kill the inner one.
- Copy the OneTrust cookie-banner checkbox. It is not part of this system.
- Ship `disabled:text-kumo-disabled` — it resolves to nothing.
- Use a placeholder as a label.
- Assume `text-base` is 16px. Here it is **14px**.
- Scale the radius with the control size.

---

## Using this in Tailwind CSS v4 + shadcn/ui

### 1. Token layer

Import the mined tokens, then bridge them onto the shadcn semantic names in
`@theme`. shadcn components read `--input`, `--ring`, `--background`,
`--destructive` etc.; the kumo tokens are the source of truth.

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tokens/colors.css";
@import "../design-system/tokens/typography.css";

@theme inline {
  --color-background:  var(--color-kumo-canvas);
  --color-foreground:  var(--text-color-kumo-default);
  --color-input:       var(--color-kumo-line);      /* control edge  */
  --color-ring:        var(--color-kumo-focus);     /* focus ring    */
  --color-destructive: var(--color-kumo-danger);
  --color-muted-foreground: var(--text-color-kumo-subtle);

  /* The target overrides the type scale — carry it across or your controls
     will render 16px instead of 14px. */
  --text-base: 14px;
  --text-sm: 13px;
  --text-xs: 12px;

  --radius: 0.5rem;                                  /* rounded-lg */
}
```

### 2. Dark mode with `next-themes`

The mined tokens key off `[data-mode=dark]`; `next-themes` writes `.dark`.
Bridge them once rather than rewriting either side:

```css
.dark { color-scheme: dark; }
:root:has(.dark), .dark { /* re-declare via the attribute the tokens expect */ }
```

Cleanest: configure `next-themes` to write the attribute the tokens already use.

```tsx
<ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
```

Now `[data-mode=dark]` resolves with zero token edits, and `.dark`-based shadcn
variants keep working if you also pass `attribute={["class", "data-mode"]}`.

### 3. Components to use

| This recipe | shadcn/ui | Notes |
|---|---|---|
| `.ds-input` | `Input` | |
| `.ds-input-group` | `InputGroup` (or compose `Input` + a wrapper) | matches the observed anatomy exactly |
| `.ds-textarea` | `Textarea` | |
| `.ds-select` | `Select` | shadcn's Radix Select already renders `role="combobox"` + hidden input — same shape as the target's Base UI Select |
| `.ds-checkbox` | `Checkbox` | |
| `.ds-radio` | `RadioGroup` / `RadioGroupItem` | |
| `.ds-switch` | `Switch` | |
| `.ds-field` / `.ds-label` / `.ds-error` | `Form` + `FormField` / `FormLabel` / `FormMessage` | react-hook-form wires `aria-invalid` + `aria-describedby` for you |

Icons: **`lucide-react`**. The target's own glyphs are Phosphor-style fills; the
lucide equivalents are `Search` (input addon, `size={18}`),
`ChevronsUpDown` (select chevron, `size={16}`), `Check` and `Minus` (checkbox
tick / indeterminate).

### 4. CVA variants

```ts
import { cva, type VariantProps } from "class-variance-authority";

export const inputVariants = cva(
  [
    // box — the ring is a box-shadow, so focus never shifts layout
    "flex w-full min-w-0 items-center rounded-lg border-0 px-3 shadow-xs",
    // surface + type (text-base is 14px in this system)
    "bg-kumo-control text-kumo-default font-sans text-base",
    "placeholder:text-kumo-placeholder",
    // rest ring
    "ring ring-kumo-line outline-none",
    // pointer focus → neutral 1.5px ring at 50%
    "focus:ring-kumo-focus/50 focus:ring-[1.5px] focus:outline-none",
    // keyboard focus → 2px brand ring
    "focus-visible:ring-2 focus-visible:ring-kumo-brand",
    // invalid — attribute must be the string "true"
    "aria-[invalid=true]:ring-kumo-danger",
    // disabled — opacity is the real mechanism; text-kumo-disabled is dead
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    // readonly (prescriptive)
    "read-only:bg-kumo-recessed read-only:cursor-default",
    "transition-[box-shadow,background-color,color]",
  ],
  {
    variants: {
      size: {
        sm: "h-8 text-sm",
        md: "h-9",            // default — the only size the target renders
        lg: "h-10",
      },
    },
    defaultVariants: { size: "md" },
  },
);
export type InputVariants = VariantProps<typeof inputVariants>;
```

The input **group**, which is what every real field uses:

```ts
export const inputGroupVariants = cva(
  [
    "relative flex w-full items-center gap-0 overflow-hidden rounded-lg",
    "cursor-text border-0 px-0 shadow-xs",
    "bg-kumo-control text-kumo-default font-sans text-base",
    "ring ring-kumo-line outline-none",
    // focus is proxied from the inner input to the wrapper
    "focus-within:ring-kumo-focus/50 focus-within:ring-[1.5px]",
    "has-[input[aria-invalid=true]]:ring-kumo-danger",
    "has-[input:disabled]:pointer-events-none has-[input:disabled]:opacity-50",
  ],
  {
    variants: { size: { sm: "h-8", md: "h-9", lg: "h-10" } },
    defaultVariants: { size: "md" },
  },
);

// the inner control: strip it completely — the wrapper draws the only ring
export const inputGroupControl =
  "relative z-1 flex h-full min-w-0 grow items-center border-0 bg-transparent " +
  "rounded-none px-3 font-sans text-base text-ellipsis shadow-none " +
  "ring-0! outline-none focus:ring-0! focus:outline-none " +
  "placeholder:text-kumo-placeholder";
```

Register the kumo colour utilities once so `ring-kumo-line`, `bg-kumo-control`
etc. compile:

```css
@theme inline {
  --color-kumo-line:    var(--color-kumo-line);
  --color-kumo-control: var(--color-kumo-control);
  --color-kumo-base:    var(--color-kumo-base);
  --color-kumo-tint:    var(--color-kumo-tint);
  --color-kumo-focus:   var(--color-kumo-focus);
  --color-kumo-brand:   var(--color-kumo-brand);
  --color-kumo-danger:  var(--color-kumo-danger);
  --color-kumo-recessed:var(--color-kumo-recessed);
  /* text-* utilities read --text-color-*; alias the ones you use */
}
```

### 5. Composed example

```tsx
import { Search } from "lucide-react";

<div className="grid gap-2">
  <label htmlFor="zone" className="text-base font-medium text-kumo-default">
    Zone name
  </label>

  <div className={inputGroupVariants({ size: "md" })}>
    <span
      data-slot="input-group-addon-start"
      className="-order-1 relative z-[1] flex shrink-0 items-center gap-1.5
                 pl-2 pr-0 text-base text-kumo-subtle pointer-events-none
                 *:pointer-events-auto"
    >
      <Search size={18} />
    </span>
    <input
      id="zone"
      className={inputGroupControl}
      placeholder="example.com"
      aria-invalid={!!error}                {/* renders the string "true" */}
      aria-describedby={error ? "zone-err" : "zone-help"}
    />
  </div>

  {error ? (
    <p id="zone-err" className="text-sm text-kumo-danger">{error}</p>
  ) : (
    <p id="zone-help" className="text-sm text-kumo-subtle">
      Lowercase letters, numbers and hyphens.
    </p>
  )}
</div>
```

### 6. Gotchas when porting

- **`aria-invalid={error}`** where `error` is a string renders `aria-invalid="…"`,
  which the `[aria-invalid=true]` selector will not match. Coerce: `!!error`.
- **shadcn's default `Input`** applies `border` + `focus-visible:ring-[3px]`.
  Both fight this system — override to `border-0` and the 1.5px/2px two-tier
  ring, or you lose the trait *and* get layout shift on focus.
- **`ring` in Tailwind v4** is 1px (it was 3px in v3). The recipes assume v4.
- **Don't set `--text-base` to 16px** to dodge the iOS zoom. It changes every
  control, badge and table cell in the system.
