# Tabs & Segmented Controls

Recipes: [`tabs-segmented.css`](./tabs-segmented.css) · Tokens: [`../tokens/colors.css`](../tokens/colors.css)

Two variants of one component. The source ships them from a single primitive
(Base UI `Tabs`, tagged `data-kumo-component="Tabs"` / `data-kumo-part="tab"`)
and swaps only the list chrome and the indicator:

| Variant | Chrome | Indicator | Observed on |
|---|---|---|---|
| **Underline** | 1px hairline rule under the bar | 2px brand bar sliding along the rule | `audit-log.html` (page nav) |
| **Segmented** | recessed track, rounded | elevated "thumb" sliding under the labels | `billing.html`, `members.html` (md) · `audit-log.html` (sm) |

> **Provenance.** Every value here is transcribed from the post-render DOM in
> `capture/{audit-log,billing,members}.html` and the compiled rules in
> `capture/static/004-init.q2icrP6B.css`. This target is classified
> **`utility-compiled`** (`classification.json`, `computedStyleMandatory: true`) —
> utility classes carry the values, not named component tokens — so geometry is
> reported from resolved/computed values and colors from the real token vars.
> `facts.json` counts **10 deduped tab elements** across 3 of 8 pages.

---

## The accent is blue, not orange

The active indicator is `--color-kumo-brand`, which in this system resolves to
**blue** (`oklch(57.72% .2324 260)` light / `oklch(51.948% .2324 260)` dark).
Cloudflare orange (`#f6821f`) is `--text-color-kumo-brand` and is **never** used
by tabs. Do not "correct" this to orange — the data is unambiguous.

---

## Anatomy

```
.ds-tabs                                  root
└─ .ds-tabs__list          role="tablist" the bar (relative — indicator's containing block)
   ├─ .ds-tabs__tab        role="tab"     one per tab, z-index 2  ← label paints ABOVE the indicator
   ├─ .ds-tabs__tab        role="tab"     aria-selected, roving tabindex
   └─ .ds-tabs__indicator  role="presentation"  z-index 1, absolutely positioned, transform-driven
```

The indicator is **one element per list**, slid with a `transform`. It is
positioned entirely from four custom properties that the component writes to it
as an inline style on every selection change. Names preserved verbatim:

| Property | Meaning | Used by |
|---|---|---|
| `--active-tab-left` | x-offset of the active tab (px) | both |
| `--active-tab-width` | width of the active tab (px) | both |
| `--active-tab-top` | y-offset of the active tab (px) | segmented thumb |
| `--active-tab-height` | height of the active tab (px) | segmented thumb |

Because height/top are *measured*, the thumb tracks tabs of any size with no
hard-coded geometry. Before the first measurement the indicator carries
`data-rendered="false"` and is `scale(90%) opacity(0)` — so it never flashes at
the wrong position on mount.

### The tab element is a button *or* a link

Both are observed, and the distinction is semantic, not cosmetic:

- **`<button role="tab">`** — audit-log. In-place panel switching.
- **`<a role="tab" href="…">`** — billing, members. The tab *is* a route link;
  selecting it navigates. These also carry `draggable="false"` and `no-underline`.

Use links whenever the tab maps to a URL — it keeps deep-linking, back/forward,
and open-in-new-tab working.

---

## Variants, sizes, and measured geometry

Base spacing unit is `--spacing` = `0.25rem` (4px); all sizes below are
`calc(--spacing × n)`.

### Underline (observed: `audit-log`)

| Part | Utilities | Resolved |
|---|---|---|
| List | `gap-4 border-b border-kumo-hairline pb-2 h-7.5` | gap 16px · 1px `--color-kumo-hairline` bottom border · pad-bottom 8px · height 30px |
| Tab | `rounded px-2 py-3 text-base` | radius `.25rem` · padding 12px/8px · 14px type |
| Indicator | `bottom-0 h-0.5 bg-kumo-brand` | 2px bar, `--color-kumo-brand` |

Only one size is observed.

### Segmented (observed: `billing`/`members` = md, `audit-log` = sm)

| Part | **sm** | **md** (default) |
|---|---|---|
| Track height | `h-6.5` → **26px** | `h-9` → **36px** |
| Track radius | `rounded-md` → `.375rem` | `rounded-lg` → `.5rem` |
| Track fill | `bg-kumo-recessed` | `bg-kumo-recessed` |
| Track inline pad | `px-0.5` → 2px | `px-0.5` → 2px |
| Tab padding-inline | `px-2` → 8px | `px-2.5` → 10px |
| Tab radius | `rounded-sm` → `.25rem` | `rounded-md` → `.375rem` |
| Tab type | `text-xs` → **12px** | `text-base` → **14px** |
| Tab block margin | `my-0.5` → 2px | `my-0.5` → 2px |
| Thumb radius | `rounded` → `.25rem` | `rounded-md` → `.375rem` |
| Measured thumb height | 22px (in 26px track) | 32px (in 36px track) |

The track's 2px inline padding plus the tab's 2px block margin **is** the inset
the thumb sits in — 36 − 2 − 2 = 32. That is the whole trick; nothing is
hard-coded.

Thumb chrome (both sizes): `bg-kumo-base shadow-sm ring ring-kumo-line` —
i.e. fill `--color-kumo-base`, a 1px ring in `--color-kumo-line`, and
`shadow-sm` = `0 1px 3px 0 #0000001a, 0 1px 2px -1px #0000001a`. It reads as a
card lifted off the recessed track.

---

## All states

| State | Hook | Underline | Segmented |
|---|---|---|---|
| **Default** | — | `--text-color-kumo-subtle` | `--text-color-kumo-subtle` |
| **Hover** | `:hover` | text → `--text-color-kumo-default` **+ fill `--color-kumo-tint`** | text → `--text-color-kumo-default` (**no fill**) |
| **Selected** | `[aria-selected="true"]` | text → `--text-color-kumo-default` **+ `font-medium` (500)** | text → `--text-color-kumo-default` (**weight unchanged**) |
| **Selected + hover** | `aria-selected:hover:` | keeps `--color-kumo-tint` fill | no fill |
| **Focus** | `:focus` | `outline: none` (ring colour set but width 0 — inert) | same |
| **Focus-visible** | `:focus-visible` | **2px ring, `--color-kumo-brand`** | 2px ring, `--color-kumo-brand`, **inset** |
| **Disabled** | `[aria-disabled]` | *prescriptive — see below* | *prescriptive* |
| **Indicator unmeasured** | `[data-rendered="false"]` | `scale(90%)`, `opacity: 0` | same |

Three deliberate asymmetries worth preserving:

1. **Only the underline variant takes a hover fill.** A `kumo-tint` fill behind a
   segmented tab would fight with the sliding thumb.
2. **Only the underline variant bolds the selected tab.** In the segmented
   control the thumb carries selection, so weight stays regular — which also
   avoids the label reflowing as the thumb arrives.
3. **The segmented focus ring is inset** (`focus-visible:ring-inset`). The track
   is an `overflow-x: auto` scroller; an outset ring on the first or last tab
   would be clipped.

### Focus ring, precisely

The source stacks `focus:outline-none focus:ring-kumo-focus/50
focus-visible:ring-2 focus-visible:ring-kumo-brand`. The `focus:` ring sets a
*colour* but never a width, so it renders nothing. The effective ring is
**2px `--color-kumo-brand`, on `:focus-visible` only** — keyboard users get it,
mouse users do not. The recipe authors it as an `outline` rather than a
`box-shadow` ring so it cannot be clipped by the scroller.

### Disabled — PRESCRIPTIVE

**Not observed.** Every `role="tab"` in the capture carries
`aria-disabled="false"`. The recipe's disabled treatment reuses the app-wide
convention seen on other controls (`disabled:cursor-not-allowed`,
`disabled:text-kumo-subtle`, `disabled:opacity-50`) with the real
`--text-color-kumo-inactive` token. Treat it as a house-style proposal.

> Markup elsewhere also references `disabled:text-kumo-disabled`, but **no
> `--text-color-kumo-disabled` token is defined** in `:root` or `[data-mode=dark]`
> — it is a dead class. Don't reference it.

---

## Overflow behaviour

**There are no arrow buttons.** The segmented list simply scrolls, hides its
scrollbar, and fades whichever edge still has content behind it.

The fade is driven by a **scroll timeline** — no JS, no scroll listener. Two
registered `@property` numbers are animated from the element's own x-scroll
progress and feed a `linear-gradient` mask:

```
@property --fade-left-n  / --fade-right-n   →  <number>, initial 0
@keyframes scroll-fade-x-left   0 → 1       (left edge fades IN as you scroll away from start)
@keyframes scroll-fade-x-right  1 → 0       (right edge fades OUT as you reach the end)
animation-timeline: scroll(self x)
```

Everything lives behind `@supports (animation-timeline: scroll())`, so browsers
without scroll-driven animations get a plain, unmasked, natively-scrollable list
— a clean degradation, not a broken one.

| Knob | Set on | Value | Effect |
|---|---|---|---|
| `--scroll-fade-width` | list | `3rem` | width of the fade |
| `--scroll-fade-range` | list | `3rem` default; **`1px` on the md list** | scroll distance the fade ramps over |
| `scroll-padding-inline` | list | `var(--scroll-fade-width)` | keeps a tab scrolled-into-view clear of the fade |
| `[data-overflowing]` | list | host-toggled | gates the mask on actual overflow |
| `overscroll-behavior-x` | list | `contain` | scrolling the tabs never scrolls the page |

The md list's `--scroll-fade-range: 1px` makes the mask snap in the instant the
list overflows at all, rather than ramping over 3rem.

The host must toggle `[data-overflowing]` when content overflows (e.g. a
`ResizeObserver` comparing `scrollWidth` to `clientWidth`).

---

## Accessibility

Observed wiring — keep it:

- `role="tablist"` on the list, `role="tab"` on each tab,
  `role="presentation"` on the indicator (it is pure decoration).
- `aria-selected="true"` on exactly one tab; `"false"` on the rest.
- **Roving tabindex:** the selected tab has `tabindex="0"`, all others
  `tabindex="-1"`. The tablist is one tab stop; arrow keys move between tabs.
- `aria-disabled` present on every tab (always `false` in the capture).
- `data-orientation="horizontal"` — only horizontal is observed. **Vertical is
  prescriptive**; if you add it, set `aria-orientation="vertical"` and swap the
  arrow keys to Up/Down.

Expected keyboard behaviour (`Tab` → into the list; then):
`←`/`→` move, `Home`/`End` jump to first/last, `Space`/`Enter` activate when
activation is manual. Base UI provides this — don't reimplement it.

Things to get right yourself:

- **No `role="tabpanel"` exists anywhere in the capture.** The link-style tabs
  (billing, members) navigate routes instead of toggling panels, so there is no
  panel to label. If you build *button* tabs that swap content in place, you
  must add `role="tabpanel"`, `aria-labelledby` → the tab's `id`, and
  `tabindex="0"` on the panel so keyboard users can reach its content.
- **Contrast:** the resting label is `--text-color-kumo-subtle`
  (`oklch(55.6% 0 0)` light / `oklch(70.8% 0 0)` dark), which is deliberately low.
  It is only ever used for *unselected* tabs; never reuse it for the selected
  tab or for body copy that must meet 4.5:1.
- **Selection is not colour-only.** The underline variant also shifts weight to
  500; the segmented variant adds a filled, ringed, shadowed thumb. Preserve at
  least one non-colour cue.
- **Reduced motion:** the target ships 8 `prefers-reduced-motion` rules. The
  recipe drops the indicator transition (it jumps instead of sliding) and
  neutralises the mount `scale`. Selection must stay legible without animation.

---

## Do / Don't

**Do**

- Use **underline** for page-level / primary navigation and **segmented** for
  compact, in-context view switches (Structured ↔ JSON) — that is exactly how
  the source deploys them.
- Render tabs as `<a href>` when they map to routes; keep deep-links working.
- Let the indicator be measured. Never hard-code its width or offset.
- Keep labels on one line (`white-space: nowrap`) and let the list scroll.
- Toggle `[data-overflowing]` so the edge fade appears only when it means
  something.

**Don't**

- Don't use orange for the active indicator. The accent here is
  `--color-kumo-brand` (blue).
- Don't add a hover fill to segmented tabs, or bold the selected segmented tab —
  both fight the thumb.
- Don't put an outset focus ring on segmented tabs; the scroller clips it. Inset.
- Don't add arrow buttons. This system scrolls and fades.
- Don't nest a second tab level inside a tab panel. Only one level is observed.
- Don't animate the indicator's `left`/`width` — transform the single indicator
  element (that's why `--active-tab-left` is applied as a `translate`).

---

## Using this in Tailwind CSS v4 + shadcn/ui

### 1. Theme attribute — read this first

This system's dark selector is **`[data-mode=dark]`**, not `.dark`. shadcn/ui
and `next-themes` default to a `.dark` class, so you must either point
`next-themes` at the attribute:

```tsx
// app/providers.tsx
<ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

…or, if you keep the `.dark` class, alias it in your token layer:

```css
/* app/globals.css — after importing tokens/colors.css */
.dark { /* re-declare, or: */ }
:root:is(.dark, [data-mode="dark"]) { /* … */ }
```

Pick one. Mixing them silently half-themes the app.

### 2. Wire the tokens into `@theme`

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tokens/colors.css";
@import "../design-system/tokens/typography.css";
@import "../design-system/components/tabs-segmented.css";

@theme inline {
  --color-kumo-brand: var(--color-kumo-brand);
  --color-kumo-recessed: var(--color-kumo-recessed);
  --color-kumo-base: var(--color-kumo-base);
  --color-kumo-line: var(--color-kumo-line);
  --color-kumo-hairline: var(--color-kumo-hairline);
  --color-kumo-tint: var(--color-kumo-tint);
}
```

This gives you `bg-kumo-recessed`, `ring-kumo-line`, `border-kumo-hairline` etc.
as first-class Tailwind v4 utilities — the same class names the source uses.

### 3. Component: `shadcn/ui` Tabs + a measured indicator

`npx shadcn@latest add tabs` gives you Radix `@radix-ui/react-tabs`, which has
**no moving indicator** — Radix styles the active tab itself. To reproduce this
design you add one indicator element and feed it the four `--active-tab-*` vars.

```tsx
// components/ui/tabs.tsx
"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tabsList = cva("ds-tabs__list", {
  variants: {
    variant: {
      underline: "ds-tabs__list--underline",
      segmented: "ds-tabs__list--segmented",
    },
    size: { sm: "ds-tabs__list--sm", md: "ds-tabs__list--md" },
  },
  defaultVariants: { variant: "segmented", size: "md" },
});

const tabsTrigger = cva("ds-tabs__tab", {
  variants: {
    variant: {
      underline: "ds-tabs__tab--underline",
      segmented: "ds-tabs__tab--segmented",
    },
    size: { sm: "ds-tabs__tab--sm", md: "ds-tabs__tab--md" },
  },
  defaultVariants: { variant: "segmented", size: "md" },
});
```

Measure the active tab and publish the vars — this is the whole indicator:

```tsx
function useActiveTabRect(listRef: React.RefObject<HTMLDivElement>, value: string) {
  const [style, setStyle] = React.useState<React.CSSProperties>({});
  const [rendered, setRendered] = React.useState(false);

  React.useLayoutEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>('[data-state="active"]');
    if (!list || !tab) return;

    const measure = () => {
      setStyle({
        "--active-tab-left": `${tab.offsetLeft}px`,
        "--active-tab-width": `${tab.offsetWidth}px`,
        "--active-tab-top": `${tab.offsetTop}px`,
        "--active-tab-height": `${tab.offsetHeight}px`,
      } as React.CSSProperties);
      setRendered(true);
      // gate the edge fade on real overflow
      list.toggleAttribute("data-overflowing", list.scrollWidth > list.clientWidth);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    ro.observe(tab);
    return () => ro.disconnect();
  }, [listRef, value]);

  return { style, rendered };
}
```

```tsx
export function Tabs({ variant = "segmented", size = "md", value, ...props }) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const { style, rendered } = useActiveTabRect(listRef, value);

  return (
    <TabsPrimitive.Root className="ds-tabs" value={value} {...props}>
      <TabsPrimitive.List ref={listRef} className={cn(tabsList({ variant, size }))} style={style}>
        {props.tabs.map((t) => (
          <TabsPrimitive.Trigger
            key={t.value}
            value={t.value}
            disabled={t.disabled}
            className={cn(tabsTrigger({ variant, size }))}
          >
            {t.icon ? <t.icon aria-hidden className="size-3.5" /> : null}
            {t.label}
          </TabsPrimitive.Trigger>
        ))}

        {/* the sliding indicator — decoration only */}
        <div
          role="presentation"
          data-rendered={rendered}
          className={cn(
            "ds-tabs__indicator",
            variant === "underline"
              ? "ds-tabs__indicator--underline"
              : cn("ds-tabs__indicator--thumb",
                  size === "sm" ? "ds-tabs__indicator--sm" : "ds-tabs__indicator--md"),
          )}
        />
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
```

Notes on mapping to Radix:

- Radix exposes **`data-state="active"`**, not `aria-selected`, as its styling
  hook — but it *also* emits `aria-selected` on the trigger, so the recipe's
  `[aria-selected="true"]` selectors work unchanged. Either hook is fine; don't
  wire both.
- Radix sets `disabled` on the trigger (and `data-disabled`), so the recipe's
  `:disabled` selector applies. Remember this treatment is **prescriptive**.
- Radix already implements roving tabindex, `Home`/`End`, and arrow-key
  navigation. Use `activationMode="manual"` if you don't want arrow keys to
  immediately switch panels.
- For **link tabs** (the billing/members pattern) Radix `Tabs` is the wrong
  primitive — it owns selection state. Render a plain
  `<nav role="tablist">` of `<Link role="tab" aria-selected>` elements and reuse
  the exact same `ds-tabs__*` classes; the CSS keys on `aria-selected`, not on
  Radix internals.

### 4. Icons

Icons via **`lucide-react`**. The capture's dominant icon sizes are 12px and
16px (`facts.json` → `sizesByUse`), so `className="size-3"` / `size-4` matches;
`size-3.5` (14px) is the natural fit next to 14px `text-base` labels. Always
`aria-hidden` on a decorative tab icon — the label already names the tab.
