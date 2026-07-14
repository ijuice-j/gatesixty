# Menus & Dropdowns

Popover menus, menu items, groups, separators, keyboard hints and switchers, extracted from **cloudflare-dashboard** (`https://dash.cloudflare.com`).

Recipes: [`menus-dropdowns.css`](./menus-dropdowns.css) · Tokens: [`../tokens/colors.css`](../tokens/colors.css)

---

## 0. Provenance — read this first

This target is classified **`utility-compiled`** (`classification.json`, score 1.0; `token-driven` 0.813). Named classes do **not** carry the values — atomic Tailwind utilities do. Consequently:

- Values below were transcribed from the **rendered DOM** (`capture/*.html`) and resolved through the token layer, per the classification's own recommendation ("the computed-style pass is the PRIMARY token source").
- `_classes.json` contains exactly **one** menu-family selector — `.min-w-[var(--kumo-dropdown-menu-trigger-width)]`. That is not a gap in the mining; it is what a utility-compiled target looks like.

**Observed vs. reconstructed.** Menus were captured in the **closed** state. Cloudflare uses portal-based popup primitives (both `id="radix-…"` and `id="base-ui-…"` triggers appear), so the floating panel never entered the DOM.

| Part | Status |
|---|---|
| Menu item, sub-item, link item (`data-kumo-part="menu-button"` / `"menu-sub-button"` / `"menu-button-link"` / `"menu-sub-button-link"`) | **Observed** |
| Groups, group labels, separators (`data-sidebar="group"` / `"group-label"` / `"separator"`) | **Observed** |
| Keyboard hint (`<kbd>`) | **Observed** |
| Every trigger — menu, select, switcher, command palette | **Observed** |
| Panel surface / radius / stacking | **Reconstructed** from the target's own tokens + trigger conventions |
| Panel **shadow geometry** (offsets, blur) | **Prescriptive** — the one honest guess. Its **colors** are exact tokens (`--color-kumo-shadow-drop`, `--color-kumo-shadow-edge`) |
| `menuitemcheckbox` / `menuitemradio` roles | **Prescriptive** — zero `role="menuitem*"` in the capture (panels were closed) |

`facts.json` observes **25 raw / 11 deduped** menu elements across 8 pages, plus `Select` (3), `Popover` (1) and `Dialog` (1) under `data-kumo-component`.

---

## 1. Anatomy

```
┌─ trigger ─────────────────────────┐   aria-haspopup="menu" aria-expanded data-state
│  [icon]  Label            [⌄]     │
└───────────────────────────────────┘
        │ opens (portal)
        ▼
┌─ .ds-menu ────────────────────────┐   surface + hairline + drop shadow, radius-lg
│  ┌ .ds-menu__group ─────────────┐ │
│  │  .ds-menu__group-label       │ │   "Observe" — subtle, same size/weight as an item
│  │  ┌ .ds-menu__item ─────────┐ │ │
│  │  │ [icon] Label      Ctrl K│ │ │   icon @50% · label truncates · kbd flushes right
│  │  └─────────────────────────┘ │ │
│  │  ┌ .ds-menu__item [active] ┐ │ │   data-active="true" → filled + strong text
│  │  └─────────────────────────┘ │ │
│  │     └ .ds-menu__sub ─────────┤ │   inline disclosure, indented 28px (pl-7)
│  │         .ds-menu__item       │ │
│  └──────────────────────────────┘ │
│  ───── .ds-menu__separator ────── │   1px --color-kumo-line, inset 8px, 12px margins
│  ┌ .ds-menu__item--danger ──────┐ │
│  └──────────────────────────────┘ │
└───────────────────────────────────┘
```

**Two structural facts that distinguish this system:**

1. **Sub-menus expand inline, they do not fly out.** The observed `<ul data-sidebar="menu-sub">` is a disclosure list indented by `pl-7` (28px), driven by `aria-expanded` + `aria-controls` on the parent row. The parent is a `<button>`, not a link.
2. **The section divider is often the group label's own bottom border**, not a separate node — `group-label` carries `border-b border-kumo-line` and drops it (`border-transparent`) once the sidebar expands. A standalone `separator` node also exists for hard breaks.

---

## 2. Tokens this component consumes

| Role | Token | Light | Dark |
|---|---|---|---|
| Panel surface | `--color-kumo-base` | `#fff` | `neutral-925` |
| Raised surface | `--color-kumo-elevated` | `neutral-75` | `neutral-975` |
| Overlay surface | `--color-kumo-overlay` | `neutral-50` | `neutral-800` |
| Item hover / selected | `--color-kumo-tint` → `--color-kumo-control` in dark | `neutral-100` | `neutral-900` |
| Item pressed | `--color-kumo-interact` | `neutral-300` | `neutral-700` |
| Inset active fill | `--color-kumo-recessed` | `neutral-125` | `neutral-950` |
| Hairline / separator | `--color-kumo-line` | `oklch(14.5% 0 0/.1)` | `neutral-750` |
| Keyboard focus ring | `--color-kumo-brand` | `oklch(57.72% .2324 260)` | `oklch(51.948% .2324 260)` |
| Soft focus ring (50%) | `--color-kumo-focus` | `neutral-950` | `neutral-150` |
| Shadow — cast | `--color-kumo-shadow-drop` | `oklch(0% 0 0/.08)` | `oklch(0% 0 0/.3)` |
| Shadow — edge | `--color-kumo-shadow-edge` | `oklch(0% 0 0/.12)` | `oklch(100% 0 0/.1)` |
| Item label | `--text-color-kumo-default` | `neutral-900` | `neutral-100` |
| Focused / selected label | `--text-color-kumo-strong` | `neutral-950` | `neutral-50` |
| Group label, `<kbd>`, disabled | `--text-color-kumo-subtle` | `neutral-500` | `neutral-400` |
| Destructive item | `--text-color-kumo-danger` + `--color-kumo-danger-tint` | `red-700` / `red-100` | `red-400` / `red-900` |
| Placeholder (select) | `--text-color-kumo-placeholder` | `neutral-400` | `neutral-500` |

Themes switch via `:root`, `[data-mode=dark]`, `.theme-kumo`, `.theme-fedramp`. **Never write a per-theme value** — use the var.

> **The one indirection worth knowing.** The target does not hardcode the item hover fill. It publishes `[--sidebar-active-bg:var(--color-kumo-tint)]` and overrides it to `--color-kumo-control` in dark and `--color-kumo-recessed` in the inset variant. The recipe mirrors this as `--ds-menu-active-bg`. Retheme a whole menu by setting that one var.

### Geometry (all observed)

| Property | Value | Source |
|---|---|---|
| Radius | `--radius-lg` (`.5rem`) | `rounded-lg` — **946** uses vs. 21 for `rounded-md`. This system is uniformly 8px-round. |
| Item height | `min-h-8.5` → **34px** | The real menu-item height. Note: *not* on the 4px control scale. |
| Item padding | `px-3 py-0` (12px) | |
| Item gap | `gap-2.5` (10px) top level, `gap-2` (8px) sub | |
| Icon/label gap | `gap-3` (12px) | |
| Icon size | **16px**, `opacity-50` | |
| Sub-menu indent | `pl-7` (28px) | 176 uses |
| Row gap in list | `gap-y-px` (1px) | |
| Separator | 1px line, `my-3` (12px), `px-2` (8px) inset | |
| Item type | `text-sm` (**13px**), `font-medium` | `text-sm` = 914 uses, the dominant size |
| `<kbd>` type | `text-xs/4` (12px), `font-sans` | **Not monospace** |

### Motion

`--sidebar-animation-duration: 250ms` on `--sidebar-easing: cubic-bezier(0.77, 0, 0.175, 1)` for surfaces; the site-wide dominant pair is **`.2s` / `ease`** (67 and 304 uses) for item color changes. The observed keyframe **`fadeSlideIn`** (animates `opacity` + `transform`) is reused verbatim for panel entry. The target ships **41** `prefers-reduced-motion` rules — the recipe honors the same contract.

### Elevation & stacking

There is **no menu/popover z token** in this system. The only z tokens are `--z-index-modal` (9999), `--z-index-drawer` (99999), `--z-index-toast` (1000000); observed z utilities on menu-adjacent chrome top out at `z-50`. The recipe therefore exposes `--ds-menu-z: 50` — above page chrome, below a modal. **Set it explicitly if you render a menu inside a dialog.**

---

## 3. Variants

### Panel

| Class | Use |
|---|---|
| `.ds-menu` | Default. `--color-kumo-base`. |
| `.ds-menu--elevated` | On a tinted/recessed page. `--color-kumo-elevated`. |
| `.ds-menu--overlay` | Over dense content needing extra separation. `--color-kumo-overlay`. |
| `.ds-menu--inset` | Recesses the active fill (`--color-kumo-recessed`) instead of tinting it. |
| `.ds-menu--switcher` | Account/zone picker: taller rows (48px) with avatar + two-line identity. |

### Item

| Class | Use |
|---|---|
| `.ds-menu__item` | Default row. Works on `<button>` and `<a>`. |
| `.ds-menu__item--danger` | Destructive (Delete, Revoke). Danger text + danger-tint hover fill. |
| `.ds-menu__item--sm` \| `--md` \| `--lg` | 32px / **34px (default, observed)** / 36px. |

### Trigger

| Class | Use |
|---|---|
| `.ds-menu-trigger` | Standard `h-9` button with hairline ring + `shadow-xs`. |
| `.ds-menu-trigger--icon` | Square kebab/overflow button (`size-9`; `--sm` → `size-8`). |
| `.ds-menu-trigger--ghost` | No ring, no shadow — tints on hover. The user-menu avatar button. |
| `.ds-menu-trigger--emphasis` | Brand-filled action button that opens a menu. |
| `.ds-select-trigger` | `role="combobox"`, `aria-haspopup="listbox"`. Justified apart, `font-normal`, **inset** focus ring. |
| `.ds-menu-search-trigger` | Full-width "Quick search… `Ctrl K`" palette opener. `h-8`, `text-sm`, left-aligned. |

---

## 4. States — the complete table

| State | Selector | Treatment |
|---|---|---|
| **Rest** | — | Transparent fill, `--text-color-kumo-default`, icon at 50% |
| **Hover** | `:hover` | Fill `--ds-menu-active-bg`; icon → 100% |
| **Focus (keyboard)** | `:focus-visible` | Fill `--ds-menu-active-bg` **+ text → `--text-color-kumo-strong`**. No ring. |
| **Pressed** | `:active` | Fill `--color-kumo-interact` |
| **Selected / current** | `[data-active="true"]`, `[aria-selected="true"]`, `[aria-current="page"]` | Fill + strong text + check visible |
| **Open (sub-menu)** | `[aria-expanded="true"]`, `[data-state="open"]` | Fill; chevron rotates 90° |
| **Disabled** | `:disabled`, `[aria-disabled="true"]`, `[data-disabled]` | `--text-color-kumo-subtle`, `cursor: not-allowed`, **no fill on hover** |

> **The important quirk:** menu **items** carry **no focus ring**. Buttons and triggers get `focus-visible:ring-2 ring-kumo-brand`; items get a **fill + a text-weight bump to `--text-color-kumo-strong`**. Keyboard focus and hover look nearly identical — that is deliberate roving-focus behavior. **Do not** bolt a brand ring onto menu items; it is not what this system does, and inside a dense list it reads as an error state.

**Triggers**, by contrast, have a two-stage focus:
- `:focus` → a soft ring, `--color-kumo-focus` at **50%**
- `:focus-visible` → a **2px `--color-kumo-brand`** ring (inset for `.ds-select-trigger`)

---

## 5. Accessibility

- **Roles.** Panel `role="menu"`; rows `role="menuitem"` (or `menuitemcheckbox` / `menuitemradio`). A select-style popup is `role="listbox"` with `role="option"` rows — the observed Select trigger is `role="combobox" aria-haspopup="listbox"`.
- **Trigger contract.** `aria-haspopup="menu"` + `aria-expanded` + `aria-controls` pointing at the panel id. All observed triggers do this correctly.
- **Inline sub-menus** are a disclosure pattern, **not** `role="menu"` nesting: the parent `<button>` carries `aria-expanded` + `aria-controls` → the child `<ul>`. Keep it that way; announcing a nested menubar for an inline expander misleads screen-reader users.
- **Keyboard.** `↑`/`↓` move, `→`/`←` open/close sub-menus, `Enter`/`Space` activate, `Esc` closes and **returns focus to the trigger**, `Home`/`End` jump, type-ahead jumps to first match. Let Radix/Base UI own this — do not reimplement.
- **Focus must be visible.** The item fill *is* the focus indicator. If you retheme `--ds-menu-active-bg` to something very low-contrast against the panel, you have destroyed the only focus affordance. Verify a ≥3:1 non-text contrast ratio between the fill and the panel surface.
- **Keyboard hints are decorative.** Wrap the shortcut so it is not read as part of the label — the visible `<kbd>` should be `aria-hidden="true"` with the real binding announced via `aria-keyshortcuts` on the trigger.
- **Disabled rows** use `aria-disabled="true"` (kept focusable and announced) rather than the `disabled` attribute wherever discoverability matters.
- **Target size.** The 34px row exceeds the 24×24 CSS-px minimum of WCAG 2.2 (2.5.8), and the `::before` bleed adds 1px on each edge. `--sm` (32px) still passes; do not go below it.
- **Contrast.** `--text-color-kumo-subtle` (neutral-500 / neutral-400) is used for group labels and `<kbd>`. It clears 4.5:1 for the 12–13px text it carries — keep it off anything smaller.

---

## 6. Do / Don't

**Do**

- Use `rounded-lg` (`--radius-lg`). It is this system's near-universal radius (946 : 21 over `rounded-md`).
- Dim leading icons to `opacity: 0.5` and let them brighten on hover/selected. That contrast between glyph and label is the target's signature.
- Right-flush keyboard hints with `margin-left: auto` and set them in **`font-sans`**, not mono.
- Reserve the trailing check rail permanently so labels don't shift when selection moves.
- Retheme via `--ds-menu-active-bg` — one var, all states.
- Truncate long labels. The observed label is always `truncate`.
- Consume `--kumo-dropdown-menu-trigger-width` as a **`min-width`** so the panel can grow past its trigger but never shrink under it.

**Don't**

- Don't put a focus ring on menu **items** (see §4). Rings belong to triggers.
- Don't set a menu `<kbd>` in a monospace font — the target explicitly forces `font-sans`.
- Don't uppercase or shrink group labels. They are the same 13px `font-medium` as an item, differentiated **only by color**.
- Don't render sub-menus as flyouts. This system expands them inline at a 28px indent.
- Don't fill a disabled row on hover — disabled must beat hover in the cascade.
- Don't reach for `--z-index-modal` for a menu. It will paint over dialogs. Use `--ds-menu-z`.
- Don't hardcode `#fff` for the panel. `--color-kumo-base` is white in light and `neutral-925` in dark.

---

## 7. Using this in Tailwind CSS v4 + shadcn/ui

### 7.1 Wire the tokens into `@theme`

The mined tokens land in two places: the **semantic** `--color-kumo-*` / `--text-color-kumo-*` tokens (themed via `:root` / `[data-mode=dark]`) and the **scale** tokens (`--radius-*`, `--spacing`, `--text-*`, `--z-index-*`). Import them, then bridge to shadcn's expected names:

```css
/* app.css */
@import "tailwindcss";
@import "./tokens/colors.css";
@import "./tokens/typography.css";
@import "./components/menus-dropdowns.css";

/* next-themes toggles `.dark`; the mined tokens key off [data-mode=dark].
   Bridge the two so one switch drives both. */
@custom-variant dark (&:where(.dark, .dark *, [data-mode="dark"], [data-mode="dark"] *));

.dark { color-scheme: dark; }

@theme inline {
  /* shadcn's popover slots, backed by the real Cloudflare tokens */
  --color-popover:         var(--color-kumo-base);
  --color-popover-foreground: var(--text-color-kumo-default);
  --color-accent:          var(--color-kumo-tint);      /* item hover/selected */
  --color-accent-foreground: var(--text-color-kumo-strong);
  --color-muted-foreground: var(--text-color-kumo-subtle);
  --color-border:          var(--color-kumo-line);
  --color-ring:            var(--color-kumo-brand);
  --color-destructive:     var(--text-color-kumo-danger);

  --radius: var(--radius-lg);   /* 8px — the system radius */
}
```

> **Note — the Tailwind scale layer.** `--radius-*`, `--spacing`, `--text-*`, `--z-index-*` and `--ease-*` are `@theme` vars in the real target: theme-independent scale, not theme-scoped colour. `tokens/colors.css` emits them at **`:root`**, so the `calc(var(--spacing) * n)` geometry in this recipe resolves as-is. No promotion step is required.

### 7.2 Component mapping

| This doc | shadcn/ui | Notes |
|---|---|---|
| Panel | `DropdownMenuContent` | Also `PopoverContent`, `SelectContent`, `CommandList` |
| Item | `DropdownMenuItem` | `data-highlighted` is Radix's hover+focus signal |
| Selected item | `DropdownMenuCheckboxItem` / `RadioItem` | Supplies the trailing check |
| Group label | `DropdownMenuLabel` | Override shadcn's default: this system does **not** uppercase or shrink it |
| Separator | `DropdownMenuSeparator` | Add the `px-2` inset — shadcn's default is full-bleed |
| Keyboard hint | `DropdownMenuShortcut` | Force `font-sans`; shadcn defaults to tracking-widest |
| Sub-menu | `Collapsible` + `SidebarMenuSub` | **Not** `DropdownMenuSub` — this system expands inline |
| Switcher | `DropdownMenu` on a `SidebarMenuButton` | The `kumo-user-dropdown-button` pattern |
| Palette trigger | `CommandDialog` opener | The observed "Quick search… Ctrl K" button |

Radix publishes `--radix-dropdown-menu-trigger-width`; Cloudflare renames it to `--kumo-dropdown-menu-trigger-width`. Map whichever your primitive emits.

### 7.3 CVA variants

```ts
// components/ui/menu-variants.ts
import { cva, type VariantProps } from "class-variance-authority";

export const menuContent = cva(
  [
    "z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto",
    "rounded-lg p-1 flex flex-col gap-px",
    "text-[13px] text-[var(--text-color-kumo-default)]",
    // hairline + cast shadow, both from the real shadow-color tokens
    "shadow-[0_0_0_1px_var(--color-kumo-shadow-edge),0_4px_12px_var(--color-kumo-shadow-drop)]",
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
  ],
  {
    variants: {
      surface: {
        base:     "bg-[var(--color-kumo-base)]",
        elevated: "bg-[var(--color-kumo-elevated)]",
        overlay:  "bg-[var(--color-kumo-overlay)]",
      },
    },
    defaultVariants: { surface: "base" },
  }
);

export const menuItem = cva(
  [
    "group relative flex w-full min-w-0 items-center gap-2.5 rounded-lg",
    "px-3 py-0 text-[13px] font-medium outline-none cursor-pointer select-none",
    "text-[var(--text-color-kumo-default)]",
    "transition-[color,background-color] duration-200 ease-[ease]",
    // Radix collapses hover + keyboard focus into data-highlighted — exactly the
    // target's model, where items get a FILL and no ring.
    "data-[highlighted]:bg-[var(--color-kumo-tint)] dark:data-[highlighted]:bg-[var(--color-kumo-control)]",
    "data-[highlighted]:text-[var(--text-color-kumo-strong)]",
    "active:bg-[var(--color-kumo-interact)]",
    "data-[state=open]:bg-[var(--color-kumo-tint)]",
    "data-[disabled]:pointer-events-none data-[disabled]:text-[var(--text-color-kumo-subtle)] data-[disabled]:cursor-not-allowed",
    // icons: dimmed, brightening on highlight
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-50 data-[highlighted]:[&_svg]:opacity-100",
  ],
  {
    variants: {
      size: {
        sm: "min-h-8 gap-2 text-xs",
        md: "min-h-[34px]",   // the observed min-h-8.5
        lg: "min-h-9 gap-3",
      },
      tone: {
        default: "",
        danger: [
          "text-[var(--text-color-kumo-danger)]",
          "data-[highlighted]:bg-[var(--color-kumo-danger-tint)]",
          "data-[highlighted]:text-[var(--text-color-kumo-danger)]",
          "[&_svg]:text-[var(--text-color-kumo-danger)]",
        ],
      },
    },
    defaultVariants: { size: "md", tone: "default" },
  }
);

export type MenuItemProps = VariantProps<typeof menuItem>;
```

### 7.4 Usage

```tsx
import { MoreHorizontal, Settings, Trash2, LogOut } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { menuContent, menuItem } from "./menu-variants";

export function ActionsMenu() {
  return (
    <DropdownMenu>
      {/* Observed trigger: size-9, hairline ring, holds bg-kumo-base while open */}
      <DropdownMenuTrigger
        aria-label="Actions"
        className="size-9 shrink-0 inline-flex items-center justify-center rounded-lg
                   bg-[var(--color-kumo-base)] text-[var(--text-color-kumo-default)]
                   shadow-[0_0_0_1px_var(--color-kumo-line),0_1px_2px_var(--color-kumo-shadow-drop)]
                   hover:not-disabled:bg-[var(--color-kumo-tint)]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-kumo-brand)]
                   data-[state=open]:bg-[var(--color-kumo-base)]
                   disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={4} className={menuContent()}>
        {/* Same 13px/medium as an item — differentiated by COLOR only */}
        <DropdownMenuLabel className="px-3 mt-2 mb-2 text-[13px] font-medium
                                      text-[var(--text-color-kumo-subtle)] truncate">
          Manage
        </DropdownMenuLabel>

        <DropdownMenuItem className={menuItem()}>
          <Settings />
          <span className="flex-1 min-w-0 truncate">Settings</span>
          {/* font-sans, NOT mono; aria-hidden — the binding lives on the trigger */}
          <DropdownMenuShortcut
            aria-hidden
            className="ml-auto font-sans text-xs/4 tracking-normal
                       text-[var(--text-color-kumo-subtle)] whitespace-nowrap"
          >
            <span className="opacity-50">Ctrl</span>&nbsp;S
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem className={menuItem()} disabled>
          <LogOut />
          <span className="flex-1 min-w-0 truncate">Sign out everywhere</span>
        </DropdownMenuItem>

        {/* Inset separator — stops short of the panel's rounded corners */}
        <DropdownMenuSeparator className="my-3 mx-2 h-px bg-[var(--color-kumo-line)]" />

        <DropdownMenuItem className={menuItem({ tone: "danger" })}>
          <Trash2 />
          <span className="flex-1 min-w-0 truncate">Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 7.5 Inline sub-menu (the correct pattern here)

Do **not** use `DropdownMenuSub`. Compose `Collapsible` with `SidebarMenuSub`, which reproduces the observed `aria-expanded` + `aria-controls` disclosure at a 28px indent:

```tsx
<Collapsible defaultOpen className="group/collapsible">
  <CollapsibleTrigger className={menuItem()}>
    <Globe />
    <span className="flex-1 min-w-0 truncate">Domains</span>
    <ChevronRight className="ml-auto size-4 opacity-50 transition-transform
                             group-data-[state=open]/collapsible:rotate-90" />
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* pl-7 = the observed 28px indent that aligns child labels under the parent's */}
    <ul className="flex flex-col gap-px m-0 p-0 pl-7 list-none overflow-hidden">
      <li><a href="/domains/overview" className={menuItem({ size: "sm" })}>Overview</a></li>
    </ul>
  </CollapsibleContent>
</Collapsible>
```

### 7.6 Icons

`lucide-react`, sized **16px** (`size-4`) at `opacity-50`. The target's own icon set is `fill`-dominant (317 fill vs. 35 stroke) at 12/14/16px; Lucide is stroke-based, so it will read slightly lighter — nudge to `strokeWidth={2}` at 16px to match the observed density.

### 7.7 Dark mode

`next-themes` with `attribute="class"`. The `@custom-variant dark` bridge in §7.1 makes `.dark` and `[data-mode=dark]` equivalent, so the mined tokens flip with no per-component work. The only dark-specific behavior in this component is the hover fill swapping `--color-kumo-tint` → `--color-kumo-control`, which the recipe already handles.
