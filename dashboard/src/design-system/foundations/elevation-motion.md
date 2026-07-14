# Elevation & Motion

Foundation doc for the **cloudflare-dashboard** design system (`https://dash.cloudflare.com`).
Covers the shadow scale, the surface-elevation ladder, the z-index ladder, and motion
conventions (durations, easings, keyframes, reduced-motion).

---

## 0. Provenance & caveats — READ FIRST

**There is no `tokens/elevation.css` and no `tokens/motion.css` in this run.** The token
extractor only emitted `tokens/colors.css` and `tokens/typography.css`. Every value below was
re-derived from the sources that *do* exist:

| Claim type | Source of truth used |
| --- | --- |
| Shadow/z/motion **token names + values** | `capture/computed-tokens.json` (resolved), cross-checked against `design-system/tokens/colors.css` |
| Compiled utility values (`shadow-xs`, `.z-modal`, …) | `capture/static/*.css` (the target's stylesheets) |
| Duration / easing / keyframe / transition-property **frequencies** | `capture/facts.json` → `motion` — the contracted facts source. Every count below is re-derived from it verbatim. |
| Which element wears which layer | the 8 post-render `capture/*.html` DOM snapshots |

> ⚠️ **How to read the "Uses" columns.** `facts.json` declares itself (`meta.contract`) the *only*
> facts source, and it carries **no class-usage data at all**: `usage.variantClasses` is `{}`, and
> there is no `duration-*` / `transition-*` / `shadow-*` / `ring-*` / `z-*` count anywhere in it.
> So every **utility-class "Uses" figure in this doc comes from the DOM snapshots, not from
> `facts.json`, and is not verifiable against it.** Read those numbers as *ordinal* — which
> utilities are the workhorses and which are one-offs — never as audited totals. Figures I
> attribute explicitly to `facts.json` (`motion.durations`, `motion.easings`,
> `motion.transitionProps`, `motion.keyframeNames`, `motion.prefersReducedMotionRules`,
> `usage.elementTotalsDeduped`, `icons.*`) are the ones that *are* ground-truth-exact, and I say so
> at each.

`capture/classification.json` classifies this target as **`utility-compiled`** (score 1.0;
`token-driven` 0.813) with `computedStyleMandatory: true`. So for elevation and motion the
**computed/compiled values are primary** and the named-token layer is thin — I say so explicitly
at each point where it matters.

The DOM snapshots were captured with **dark mode active** (`computed-tokens.json` resolves
`--color-kumo-shadow-drop` to the `[data-mode=dark]` value). Light-mode values below come from
the `:root` block of `tokens/colors.css` and are equally exact.

Anything marked **PRESCRIPTIVE** was *not* mined and is a recommendation, not an observation.

---

# PART 1 — ELEVATION

## 1.1 The core idea: this system elevates with **surface color**, and only lightly with shadow

This is the single most important trait to preserve, and it falls straight out of the values.

**In light mode**, `--color-kumo-elevated` (`oklch(98% 0 0)`) is *darker* than
`--color-kumo-base` (`#fff`) and darker than `--color-kumo-canvas` (`oklch(98.75% 0 0)`).
Lightness cannot be signalling "higher" — so **lift is carried by the shadow**, and the shadow
tokens are near-black (`oklch(0% 0 0 / .08)`).

**In dark mode**, the surfaces are strictly monotone-lighter as they rise
(canvas `10%` → elevated `12%` → recessed `15%` → base `17%` → control `21%` → overlay `26.9%`),
and `--color-kumo-shadow-edge` **flips from black to white** (`oklch(100% 0 0 / .1)`) — it stops
being a shadow and becomes a **top light rim**. Dark-mode lift is carried by *lightness plus a
rim*, not by a drop shadow.

**Consequence:** do not hardcode "elevated = lighter." Use the surface tokens and the shadow
tokens together and let the theme selector do the flip. That's exactly what the tokens are for.

## 1.2 Surface tokens (the elevation ladder) — MINED, value-exact

Ordered by conceptual depth. Values are verbatim from `tokens/colors.css`.

| # | Token | `:root` (light) | `[data-mode=dark]` | What sits here |
| --- | --- | --- | --- | --- |
| −1 | `--color-kumo-canvas` | `oklch(98.75% 0 0)` | `oklch(10% 0 0)` | The page/app background behind everything |
| −1 | `--color-kumo-recessed` | `oklch(96% 0 0)` | `oklch(15% 0 0)` | Wells, inset areas, code blocks, table zebra |
| 0 | `--color-kumo-base` | `#fff` | `oklch(17% 0 0)` | Cards, panels, the default resting surface |
| 0 | `--color-kumo-control` | `#fff` | `oklch(21% .006 285.885)` | Inputs, comboboxes, form control fields |
| +1 | `--color-kumo-elevated` | `oklch(98% 0 0)` | `oklch(12% 0 0)` | Raised sub-surfaces on top of `base` |
| +2 | `--color-kumo-overlay` | `oklch(97.5% 0 0)` | `oklch(26.9% 0 0)` | Floating layers: menus, popovers, drawers, dialogs |

Observed in the DOM: the right-hand **drawer** panel is `bg-kumo-overlay`; the sidebar sets
`[--sidebar-bg: var(--color-kumo-base)]`.

## 1.3 Shadow **color** tokens — MINED, value-exact

The system does *not* ship a `--shadow-md` / `--shadow-lg` / `--shadow-xl` scale. It ships shadow
**colors**, and components compose the `box-shadow` geometry from them.

| Token | `:root` (light) | `[data-mode=dark]` | Role |
| --- | --- | --- | --- |
| `--color-kumo-shadow-drop` | `oklch(0% 0 0 / .08)` | `oklch(0% 0 0 / .3)` | The soft cast shadow below the element |
| `--color-kumo-shadow-edge` | `oklch(0% 0 0 / .12)` | `oklch(100% 0 0 / .1)` | The tight 1px contact/rim ring. **Black in light, white in dark.** |
| `--color-kumo-tip-shadow` | `oklch(92.8% .006 264.531)` (gray-200) | `transparent` | Tooltip/popover arrow **fill-side** shadow |
| `--color-kumo-tip-stroke` | `transparent` | `oklch(26.9% 0 0)` (neutral-800) | Tooltip/popover arrow **stroke**. Light and dark use exactly one of the pair — the other is `transparent`. |

`tip-shadow` / `tip-stroke` are applied as SVG paint, not `box-shadow` — the compiled CSS shows
`fill: var(--color-kumo-tip-shadow)` and `fill: var(--color-kumo-tip-stroke)` on the arrow path.
That's how a triangular arrow gets a border that matches the panel across themes.

## 1.4 The composed elevation shadow — MINED verbatim from the compiled stylesheet

The target composes its one real elevation shadow inline, as a Tailwind arbitrary value:

```
shadow-[0_0_1px_0.5px_var(--color-kumo-shadow-edge),0_1px_2px_var(--color-kumo-shadow-drop)]
```

which compiles to:

```css
box-shadow:
  0 0 1px 0.5px var(--color-kumo-shadow-edge),   /* contact rim  */
  0 1px 2px     var(--color-kumo-shadow-drop);   /* cast shadow  */
```

Re-authored as a named recipe (this is what you should actually use):

```css
/* ---------------------------------------------------------------------------
 * .ds — Elevation recipes
 * Composed from the mined shadow-COLOR tokens. Theme flip is automatic:
 * in dark, --color-kumo-shadow-edge is white, so the rim reads as a top light
 * edge instead of a contact shadow. Do not fork these per theme.
 * ------------------------------------------------------------------------ */

.ds {
  /* The single mined elevation shadow, promoted to a token so recipes can
     reference it by name instead of re-typing the arbitrary value. */
  --ds-shadow-elevated:
    0 0 1px 0.5px var(--color-kumo-shadow-edge),
    0 1px 2px     var(--color-kumo-shadow-drop);
}

/* Level 0 — flush. Cards, table rows, section panels. No shadow at all;
   separation comes from --color-kumo-line / --color-kumo-hairline borders. */
.ds .ds-elevation-0 {
  background-color: var(--color-kumo-base);
  box-shadow: none;
}

/* Level 1 — controls. Buttons, links styled as buttons, input groups,
   combobox triggers. Mined as `shadow-xs` (47 uses). */
.ds .ds-elevation-control {
  background-color: var(--color-kumo-control);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* = Tailwind shadow-xs */
}

/* Level 2 — floating surfaces. Menus, popovers, tooltips, dropdowns.
   This is the kumo composed shadow — the theme-aware one. */
.ds .ds-elevation-floating {
  background-color: var(--color-kumo-overlay);
  box-shadow: var(--ds-shadow-elevated);
}

/* Level 3 — modal. Dialogs lifted off the whole page.
   Mined as `shadow-2xl` on div[role="dialog"]. */
.ds .ds-elevation-modal {
  background-color: var(--color-kumo-overlay);
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); /* = Tailwind shadow-2xl */
}
```

## 1.5 The literal shadow scale actually in use — MINED

Utility usage counted across all 8 captured pages, with the compiled value pulled from
`capture/static/*.css` and the element that wears it pulled from the DOM.

| Utility | Compiled `box-shadow` | Uses | Worn by (observed) |
| --- | --- | --- | --- |
| `shadow-none` | `none` | 36 (+8 as `group-data-[state=collapsed]/sidebar:shadow-none`) | Cards, flush panels, the collapsed sidebar |
| `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | **47** | `button`, `a`, `label[data-slot=input-group]`, `button[role=combobox]`, `span`, `div` |
| `shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | 3 | `div[role=presentation]` (a floating panel) |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | 1 | `div[role=dialog]` |
| `shadow-[0_100px_var(--color-bg-secondary)]` | `0 100px var(--color-bg-secondary)` | 6 | A scroll-fade / bleed trick, **not** an elevation |

Named shadow token in the theme layer — **there is exactly one**:

| Token | Value |
| --- | --- |
| `--drop-shadow-sm` | `0 1px 2px #00000026` (a `filter: drop-shadow()` value, for SVG/irregular shapes) |

Related Tailwind v4 plumbing vars are present and should be left alone:
`--tw-shadow: 0 0 #0000`, `--tw-shadow-alpha: 100%`, `--tw-ring-shadow: 0 0 #0000`,
`--tw-inset-shadow`, `--tw-inset-ring-shadow`, `--tw-ring-offset-shadow`,
`--tw-drop-shadow-alpha`, `--tw-text-shadow-alpha`.

> **The scale is deliberately shallow: 4 rungs — none / xs / sm / 2xl.** There is no
> `md`, `lg`, or `xl` in use anywhere. Do not add rungs. If you need "more elevated," go up a
> **surface** token, not up a shadow.

### Rings do the work that shadows do elsewhere

Ring usage dwarfs shadow usage, and rings are `box-shadow` under the hood in Tailwind v4 — so
they belong in this doc. Mined counts:

| Ring utility | Uses | Purpose |
| --- | --- | --- |
| `ring-kumo-focus/50` | **80** | The focus ring. See [`./colors.md`](./colors.md) for `--color-kumo-focus`. |
| `ring` (1px, currentColor) | 72 | Generic hairline ring |
| `ring-kumo-line` | 45 | Card / panel border-as-ring |
| `ring-neutral-800` | 13 | |
| `ring-[1.5px]` | 8 | Thicker emphasis ring |
| `ring-(--kumo-button-emphasis-ring)` | 7 | `color-mix(in oklch, var(--color-kumo-brand), black 10%)` — the emphasis button's ring |
| `ring-kumo-hairline/70`, `ring-kumo-fill`, `ring-inset`, `ring-0!` | 1–4 each | |

**Because rings and shadows share the `box-shadow` property, they must be transitioned
together** — which is exactly why `transition-[color,box-shadow,outline]` appears 112 times
(see §2.4).

## 1.6 Z-index ladder — MINED

### The named token layer (3 tokens, `tokens/colors.css` `:root`)

| Token | Value | Consumer (mined from compiled CSS) |
| --- | --- | --- |
| `--z-index-modal` | `9999` | `.z-modal { z-index: var(--z-index-modal) }` |
| `--z-index-drawer` | `99999` | *No compiled consumer found* — token defined, unused in the captured CSS |
| `--z-index-toast` | `1000000` | `[role=region]:has([data-kumo-component=Toast]) { z-index: var(--z-index-toast) }` |

Toasts also self-stack *inside* their region:
`.z-[calc(1000-var(--toast-index))]` → `z-index: calc(1000 - var(--toast-index))` — newer toasts
get a lower `--toast-index` and therefore sit on top.

### The utility layer actually in the DOM (counts across 8 pages)

| `z-*` | Count | Observed on |
| --- | --- | --- |
| `-z-10` | 7 | Decorative fills sent *behind* content |
| `z-0` | 11 | Stacking-context roots |
| `z-[1]` / `z-1` | 4 / 16 | `div[role=region]`, `input`, `div[role=presentation]` — intra-component layering |
| `z-2` | 10 | `button[role=tab]`, `a[role=tab]` — active tab lifts over the tablist border |
| `z-10` | **176** | The workhorse. In-card overlays, rails, connector lines (`bg-kumo-line z-10`) |
| `z-15` | 1 | one-off |
| `z-[19]` | 1 | one-off |
| `z-20` | 10 | `<header>` — the sticky app top bar |
| `z-50` | 8 | The sidebar wrapper / app shell region |
| `z-[110]` | 1 | `div[role=dialog]` |
| `z-[1150]` | 8 | The right-hand **drawer** (`fixed`, `bg-kumo-overlay`, `border-l border-kumo-line`) |
| `z-[1190]` | 8 | The **collapsed sidebar** (`group-data-[state=collapsed]/sidebar:z-[1190]`) |
| `999` (raw CSS) | — | `.__react_component_tooltip` — a legacy vendor tooltip |

### The normalized ladder to build against

The source's ladder is **fragmented** — see the warning below. This is the coherent version;
the token names and the three token values are mined, the intermediate rungs are the observed
utility values re-labeled. Use this.

```css
/* ---------------------------------------------------------------------------
 * .ds — Z-index ladder
 * Three rungs are real tokens from the source (modal/drawer/toast). The rest
 * are the observed utility values, named. Reference these; never type a bare
 * z-index number into a component.
 * ------------------------------------------------------------------------ */
.ds {
  --ds-z-below:      -10;  /* decorative, behind content        (obs. -z-10)  */
  --ds-z-base:         0;  /* normal flow                       (obs. z-0)    */
  --ds-z-raised:       1;  /* intra-component lift              (obs. z-1)    */
  --ds-z-tab:          2;  /* active tab over tablist border    (obs. z-2)    */
  --ds-z-content:     10;  /* rails, in-card overlays           (obs. z-10)   */
  --ds-z-header:      20;  /* sticky app header                 (obs. z-20)   */
  --ds-z-shell:       50;  /* sidebar / app-shell region        (obs. z-50)   */
  --ds-z-dropdown:   110;  /* menus, popovers, comboboxes       (obs. z-[110])*/
  --ds-z-drawer:  var(--z-index-drawer,  99999); /* MINED TOKEN */
  --ds-z-modal:   var(--z-index-modal,    9999); /* MINED TOKEN */
  --ds-z-toast:   var(--z-index-toast,  1000000);/* MINED TOKEN */
}

.ds .ds-layer-header   { z-index: var(--ds-z-header); }
.ds .ds-layer-shell    { z-index: var(--ds-z-shell); }
.ds .ds-layer-dropdown { z-index: var(--ds-z-dropdown); }
.ds .ds-layer-modal    { z-index: var(--ds-z-modal); }
.ds .ds-layer-drawer   { z-index: var(--ds-z-drawer); }
.ds .ds-layer-toast    { z-index: var(--ds-z-toast); }
```

> ⚠️ **The source's ladder is inconsistent and you should not copy it literally.**
> `--z-index-modal` is `9999`, but the actual `div[role=dialog]` in the DOM wears `z-[110]` —
> the token is not what the dialog uses. Meanwhile the drawer (`1150`) and the collapsed sidebar
> (`1190`) sit *above* that dialog on ad-hoc arbitrary values, and `--z-index-drawer` (`99999`)
> has no consumer in the captured CSS at all. Modal < drawer is almost certainly not the intent.
> **In the normalized ladder above I kept the mined token values but you must pick one system:**
> either drive everything off the three tokens, or drive everything off the small integers. Do
> not mix, which is what the source does.

## 1.7 Blur tokens (backdrops / scrims) — MINED

| Token | Value |
| --- | --- |
| `--blur-xs` | `4px` |
| `--blur-sm` | `8px` |
| `--blur-md` | `12px` |
| `--blur-xl` | `24px` |

No `--blur-lg` was mined. **No `backdrop-filter` declaration was found in `_classes.json`** — so
while the blur scale exists, a blurred modal scrim is **PRESCRIPTIVE**, not observed. The
observed dialog scrim behavior isn't in the capture (dialogs were closed at capture time).

## 1.8 Elevation do / don't

**Do**
- Pair a surface token with a shadow recipe: `bg-kumo-overlay` + the composed elevation shadow.
- Use `ring-kumo-line` for a card's edge instead of a shadow. Flush-with-a-hairline is the
  default look here (`shadow-none` is used 44×).
- Let `--color-kumo-shadow-edge` flip itself. In dark it *should* look like a light rim.
- Transition `box-shadow` and `color` and `outline` together — they interact on focus.

**Don't**
- Don't invent `shadow-md` / `shadow-lg` / `shadow-xl`. They are not in this system.
- Don't hardcode `rgb(0 0 0 / …)` in a component — reference `--color-kumo-shadow-drop` /
  `--color-kumo-shadow-edge` so dark mode works.
- Don't assume "elevated = lighter." In light mode `--color-kumo-elevated` is *darker* than
  `--color-kumo-base`.
- Don't reach for a new arbitrary z-index. Every one in the source (`1150`, `1190`, `110`, `19`,
  `15`) is a bug waiting to happen.

## 1.9 Elevation accessibility notes

- **Shadow is never the only signal.** `--color-kumo-shadow-drop` at `0.08` alpha in light mode
  is far below any contrast threshold — it is decoration. Every elevated surface in this system
  *also* changes background color and/or carries a `ring-kumo-line`. Keep it that way: a user
  with a high-contrast or forced-colors setting will lose the shadow entirely.
- **`forced-colors` mode drops `box-shadow` outright.** Since focus is expressed as
  `ring-kumo-focus/50` (a `box-shadow`), you must keep a real `outline` for focus-visible.
  Note the mined `transition-[color,box-shadow,outline]` — `outline` is already in the mix; do
  not delete it. **PRESCRIPTIVE:** add an explicit
  `@media (forced-colors: active) { outline: 2px solid CanvasText }` fallback on focusable
  elements. No `forced-colors` rules were found in the capture.
- **Layer order must match DOM/reading order** where possible. The `z-[1190]` collapsed sidebar
  sitting above the `z-[110]` dialog is a **focus-trap hazard**: a screen-reader or keyboard user
  in a modal can visually see, and potentially tab to, chrome that is supposed to be inert. Use
  the normalized ladder and `inert`/`aria-hidden` on background content when a modal is open.

---

# PART 2 — MOTION

## 2.1 Named motion tokens — MINED, value-exact

### Defaults

| Token | Value | Notes |
| --- | --- | --- |
| `--default-transition-duration` | `.1s` | Tailwind v4's `transition` default. **100ms.** |
| `--default-transition-timing-function` | `cubic-bezier(.4, 0, .2, 1)` | i.e. `ease-in-out` |

### Easing scale (3 tokens — that's all there is)

| Token | Value | Use for |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0, 0, .2, 1)` | **Entrances.** Things arriving. |
| `--ease-in` | `cubic-bezier(.4, 0, 1, 1)` | **Exits.** Things leaving. |
| `--ease-in-out` | `cubic-bezier(.4, 0, .2, 1)` | **Moves.** Things that start and end on-screen. |

No `--ease-linear` token; `linear` is used as a raw keyword. Per `facts.json` →
`motion.easings`, the raw-CSS easing picture is dominated by two keywords —
**`ease` 304**, **`linear` 28** — with the named curves far behind:
`cubic-bezier(.77,0,.175,1)` 6 (the sidebar's easeInOutQuart), `cubic-bezier(.21,1.02,.73,1)` 6
(the toast overshoot), `cubic-bezier(.4,0,.2,1)` 6 (= `--ease-in-out`), and a long tail of
3-and-under one-offs including `cubic-bezier(.36,.07,.19,.97)` 3 (shake),
`cubic-bezier(.34,1.56,.64,1)` 3 (a back-out overshoot), `cubic-bezier(.4,0,1,1)` 3
(= `--ease-in`) and `cubic-bezier(0,0,.2,1)` 3 (= `--ease-out`).

That `ease` outnumbers everything else ~10:1 is a **fact about the source, not a recommendation**:
the bare `ease` keyword is mostly legacy/vendor CSS. New code should reach for the three
`--ease-*` tokens. `linear` (28) is legitimate — it's what infinite spins want.

### Named animation tokens

| Token | Value |
| --- | --- |
| `--animate-spin` | `spin 1s linear infinite` |
| `--animate-pulse` | `pulse 2s cubic-bezier(.4, 0, .6, 1) infinite` |
| `--animate-ping` | `ping 1s cubic-bezier(0, 0, .2, 1) infinite` |
| `--animate-refresh` | `refresh .5s ease-in-out infinite` |

Note `--animate-pulse` uses `cubic-bezier(.4, 0, .6, 1)` — a **symmetric** curve that has no
matching `--ease-*` token. It exists only inside these animation shorthands.

### Tailwind plumbing (leave alone)

`--tw-duration: initial`, `--tw-ease: initial`.

## 2.2 Component-scoped motion variables — MINED

These are set on component roots (some as inline `style` attributes) and consumed via Tailwind's
arbitrary-property syntax. They are a **good pattern** — copy it.

| Variable | Value(s) observed | Consumer |
| --- | --- | --- |
| `--sidebar-animation-duration` | `250ms` | `duration-(--sidebar-animation-duration)` — the rail's width / padding / transform / `grid-template-*` transitions. Written inline on `[data-sidebar-wrapper]`; re-emitted at [`../components/navigation.css`](../components/navigation.css) line 54 and documented in [`../components/navigation.md`](../components/navigation.md). **The single most-used timing value in the app's chrome.** |
| `--sidebar-easing` | `cubic-bezier(0.77, 0, 0.175, 1)` (easeInOutQuart) | `ease-(--sidebar-easing)` — the same rail. `navigation.css` line 55. `facts.json` → `motion.easings` counts this curve **6×** in raw CSS. |
| `--shimmer-duration` | `1.35s`, `1.50s`, `1.69s`, `1.70s` | `.skeleton-line:after` |
| `--shimmer-delay` | `0.01s`, `0.19s`, `0.30s`, `0.41s` | `.skeleton-line:after` |
| `--row-delay` | default `0s` | `.animate-fade-slide-in` stagger |
| `--toast-index` | integer | `z-[calc(1000-var(--toast-index))]` |

> The variables and their **values** are exact (inline `style` attributes in the DOM snapshots;
> the sidebar pair is also in `components/navigation.css`). How *many* elements consume each one
> is **not in `facts.json`** and I do not quote a number — see the §0 warning. "Most-used" here is
> an ordinal claim from the snapshots, not a count.

The skeleton shimmer **randomizes duration and delay per line** — four distinct
duration values and four distinct delay values were observed across the pages. That's a deliberate
de-synchronization so a stack of skeleton rows doesn't pulse in lockstep. Preserve it.

## 2.3 The de-facto duration scale

Two mines, and they have to be read differently — one is exact, one is not.

### (a) `duration-*` utilities in the DOM — **qualitative, NOT verifiable against `facts.json`**

`facts.json` carries no utility-class counts (`usage.variantClasses` is `{}`), so this table has
**no Uses column** — only the rungs that exist and what each one drives, in rough descending order
of how often the snapshots show them. Do not cite a number for any of these.

| Utility | ms | What it drives |
| --- | --- | --- |
| `duration-150` | 150 | The default. Every `transition-[color]`. The most common rung by a wide margin. |
| `duration-(--sidebar-animation-duration)` | 250 | Sidebar collapse/expand |
| `duration-200` | 200 | Transforms, opacity, chevron rotation |
| `duration-100` | 100 | Micro-feedback (matches `--default-transition-duration`, `.1s`) |
| `duration-250` | 250 | Sidebar, hardcoded rather than via the var |
| `duration-300` | 300 | Drawer slide (`transition-[width,transform] duration-300 ease-in-out`) |

### (b) Raw-CSS durations — **exact**, `facts.json` → `motion.durations`

| Value | Count |
| --- | --- |
| `.2s` | **67** |
| `.1s` | **41** |
| `.4s` | 35 |
| `.15s` | 33 |
| `0s` | 31 |
| `.5s` | 22 |
| `.25s` | 19 |
| `1.5s` | 16 |
| `.3s` | 12 |
| `2s` | 11 |
| `1s` | 9 |
| `75ms` · `.6s` · `.7s` · `.16s` · `300ms` | 6 each |
| `0.3s` | 4 |
| `5s` · `150ms` | 3 each |
| `400ms` · `0.25s` | 2 each |
| `0.16s` · `1ms` | 1 each |

Read the two together and the shape holds: `.2s`/`.15s`/`.1s`/`.25s` are the interaction band and
they dominate; `0s` (31) is motion being *switched off* (reduced-motion and `transition-none`
resets); `1.5s`/`2s`/`5s` are the **infinite loops** (shimmer, pulse, spin), not transitions.
`.4s` (35) and `.5s` (22) are mostly **entrance/exit keyframes** (`slide-down`/`slide-up` at
`400ms`, `--animate-refresh` at `.5s`, `bounce-in` at `.4s`) — the mine does not separate
`animation-duration` from `transition-duration`, so do not read them as long transitions.

Note the DOM utility `duration-300` and the raw-CSS `300ms` are **different populations**: raw CSS
uses `300ms` only **6×** (`facts.json` → `motion.durations["300ms"]`).

**The scale to build against:**

```css
/* ---------------------------------------------------------------------------
 * .ds — Motion scale
 * Durations are the observed rungs; easings are the three mined --ease-* tokens.
 * ------------------------------------------------------------------------ */
.ds {
  /* Durations — 5 rungs, nothing between them. */
  --ds-duration-instant: 100ms; /* = --default-transition-duration. Micro-feedback. */
  --ds-duration-fast:    150ms; /* THE DEFAULT. Hover/active color changes.          */
  --ds-duration-normal:  200ms; /* Transforms, opacity, rotation.                    */
  --ds-duration-slow:    250ms; /* Sidebar collapse/expand. Layout-affecting.        */
  --ds-duration-slower:  300ms; /* Drawer slide. The largest transition in the app.  */

  /* Easings — reference the mined tokens, do not redefine the curves. */
  --ds-ease-enter: var(--ease-out);    /* cubic-bezier(0, 0, .2, 1)   */
  --ds-ease-exit:  var(--ease-in);     /* cubic-bezier(.4, 0, 1, 1)   */
  --ds-ease-move:  var(--ease-in-out); /* cubic-bezier(.4, 0, .2, 1)  */
  /* The sidebar's own dramatic curve; keep it scoped to large chrome moves. */
  --ds-ease-chrome: cubic-bezier(0.77, 0, 0.175, 1);
}
```

**Rule of thumb, straight from the data:** the bigger the thing that moves, the longer it takes.
Color: 150ms. Transform: 200ms. Sidebar: 250ms. Drawer: 300ms. **No *transition* rung goes past
300ms** — the values above that in `motion.durations` (`.4s`, `.5s`, `1.5s`, `2s`, `5s`) are
keyframe animations and loops, not transitions.

## 2.4 Transition properties — **Enumerate, don't use `transition-all`.**

### (a) `transition-*` utilities in the DOM — **qualitative**

> Same caveat as §2.3a and §0: `facts.json` holds no utility-class counts, so the figures below
> are DOM-snapshot tallies and are **not verifiable against the contracted facts source**. Use
> them for *rank*, not for citation.

| Utility | Uses (DOM snapshots — unverifiable) |
| --- | --- |
| `transition-[color]` | **696** |
| `transition-none` | 224 |
| `transition-[transform,rotate,opacity]` | 176 |
| `transition-[grid-template-rows]` | 176 |
| `transition-transform` | 138 |
| `transition-[color,box-shadow,outline]` | **112** |
| `transition-colors` | 59 |
| `transition-opacity` | 26 |
| `transition-[padding]` | 24 |
| `transition-[grid-template-rows,margin,border-color]` | 24 |
| `transition-[rotate,opacity]` | 18 |
| `transition-[width]` | 16 |
| `transition-[color,background,border,box-shadow]` | 8 |
| `transition-[grid-template-columns]`, `transition-[margin]`, `transition-[width,padding]`, `transition-[margin-right]`, `transition-[width,transform]` | 8 each |
| **`transition-all`** | **8** |

Three things jump out and all three are worth copying:

1. **`transition-all` is a rounding error in the utility layer** — a handful of uses against
   well over a thousand enumerated ones. Properties are listed explicitly, almost always. This is
   a performance and correctness discipline — `transition-all` will animate properties you didn't
   mean to.
2. **`transition-[grid-template-rows]`** — collapsible sections are animated by
   transitioning `grid-template-rows` from `0fr` to `1fr`. That's the modern
   animate-to-auto-height technique, and it is one of the most common transitions in the app.
   (Corroborated in raw CSS: `motion.transitionProps["grid-template-rows"]` = **9**.)
3. **`transition-[color,box-shadow,outline]`** is the *control focus/hover* bundle.
   `box-shadow` is there because the ring is a box-shadow; `outline` is there for
   forced-colors/high-contrast. Ship all three together on every interactive control.

### (b) Raw-CSS `transition-property` values — **exact**, `facts.json` → `motion.transitionProps`

| Property | Count |
| --- | --- |
| `opacity` | **64** |
| `none` | 41 |
| `color` | 37 |
| `border-color` | 36 |
| `transform` | 34 |
| `background-color` | 33 |
| `width` | 30 |
| `box-shadow` | 27 |
| `all` | 25 |
| `height` | 24 |
| `outline-color` · `text-decoration-color` · `fill` · `stroke` · `--tw-gradient-from` · `--tw-gradient-via` | 15 each |
| `--tw-gradient-to` · `scale` · `rotate` · `margin` · `padding` | 12 each |
| `left` · `top` · `grid-template-rows` · `none!important` | 9 each |
| `background` | 7 |
| `translate` | 6 |
| long tail (`shimmer`, `filter`, `backdrop-filter`, `clip-path`, `display`, `grid-template-columns`, `max-width`, `stroke-dashoffset`, …) | 3 each |

Three things this table says that the utility table does not:

- **`opacity` (64) is the single most-transitioned property in the target.** Fades are the
  house move — more than color, more than transform.
- **`box-shadow` (27) is transitioned nearly as often as `transform` (34).** That is the rings
  (§1.5) being animated on focus/hover; it confirms the `[color, box-shadow, outline]` bundle.
- **`all` (25) is real in the raw CSS** even though the utility layer almost never uses
  `transition-all`. The `all` uses are legacy/vendor stylesheets. Don't take them as licence —
  see the discipline note above.

## 2.5 Keyframes — MINED, exact

`facts.json` → `motion.keyframeCount` is **48**, and `motion.keyframeNames` is the full 48-entry
list. It is a big, sedimented pile: the app's own animations, three UI libraries' animations
(`rdp-*` from react-day-picker, `rcSliderTooltip*` from rc-slider, `resizeanim`), and outright
vendor code (`maplibregl-*`, `onetrust-fade-in`). **Most of those 48 are loaded and never fire.**

Grouped from `motion.keyframeNames`:

| Group | Names |
| --- | --- |
| **App entrances / feedback** | `fadeSlideIn`, `bounce-in`, `fade-in`, `fadeIn`, `fadeOut`, `fade-move-up`, `slide-down`, `slide-up`, `slideFromTop`/`Bottom`/`Left`/`Right`, `slideToTop`/`Bottom`/`Left`/`Right`, `toast-bump`, `shake`, `float` |
| **App loading / loops** | `pulse-sparkline`, `shimmer`, `skeleton`, `loading-bar`, `pulse-fade`, `kumo-chart-wave`, `dash-animation`, `dash-flow-forward`, `schemaDrawIn`, `scroll-fade-x-left`, `scroll-fade-x-right`, `right`, `c_k1` |
| **Tailwind** | `spin`, `pulse`, `ping`, `refresh` |
| **Third-party UI libs** | `rdp-fade_in`, `rdp-fade_out`, `rdp-slide_in_left`, `rdp-slide_in_right`, `rdp-slide_out_left`, `rdp-slide_out_right`, `rcSliderTooltipZoomDownIn`, `rcSliderTooltipZoomDownOut`, `resizeanim` |
| **Vendor — do not adopt** | `maplibregl-spin`, `maplibregl-user-location-dot-pulse`, `onetrust-fade-in` |

### The two keyframes worth lifting

Two of the 48 names are unmistakably **first-party product motion**: `fadeSlideIn` and
`pulse-sparkline`. Neither carries a library prefix (`rdp-`, `rcSlider`, `maplibregl-`,
`onetrust-`) or a Tailwind name (`spin` / `pulse` / `ping` / `refresh`); both are wired to the
app's own variables (`--row-delay`, the sparkline placeholder), and `pulse-sparkline` is one of
the only `animate-*` utilities that actually shows up in the captured DOM. Those are the two to
lift:

```css
/* Row/card entrance. Staggered via --row-delay. */
@keyframes fadeSlideIn {
  from { opacity: 0.01; transform: translateY(4px); }
  to   { opacity: 1;    transform: translateY(0); }
}
.ds .ds-animate-fade-slide-in {
  opacity: 0.01;
  transform: translateY(4px);
  animation: fadeSlideIn 0.3s var(--ease-out) forwards;
  animation-delay: var(--row-delay, 0s); /* set per row to stagger a list */
}

/* Sparkline / chart loading placeholder. */
@keyframes pulse-sparkline {
  0%, 100% { opacity: 0.8; }
  50%      { opacity: 0.3; }
}
.ds .ds-animate-pulse-sparkline {
  animation: pulse-sparkline 1.5s var(--ease-in-out) infinite;
}
```

Note the entrance starts at `opacity: 0.01`, not `0` — that keeps the element composited from
frame one and avoids a paint pop. Small detail, worth preserving.

### Skeleton shimmer

```css
.ds .ds-skeleton-line::after {
  animation:
    shimmer
    var(--shimmer-duration, 1.5s)
    var(--shimmer-delay, 0s)
    infinite
    var(--ease-in-out);
}
```

### Notes on the rest of the 48

The ones worth knowing about, with their geometry as it appears in the compiled stylesheet:
`bounce-in` (`.4s ease-out`, `scale .6 → 1.2 → 1`), `fade-move-up` (`translateY(8px) scale(.5)` →
rest), `float` (`translateY(-8px)` at 50%), and `slide-down` / `slide-up`
(`400ms cubic-bezier(.21, 1.02, .73, 1)` — an overshoot curve used only for toasts and gated
behind `motion-safe`; `facts.json` counts that curve **6×** in `motion.easings` and `400ms` **2×**
in `motion.durations`).
`loading-bar`, `pulse-fade`, `kumo-chart-wave`, `dash-animation` and `dash-flow-forward` are chart
and diagram loaders. `skeleton` and `shimmer` are the two skeleton loops.

**Vendor and third-party — do not adopt:** `maplibregl-spin`,
`maplibregl-user-location-dot-pulse`, `onetrust-fade-in`, the six `rdp-*` calendar animations, the
two `rcSliderTooltip*` ones, and `resizeanim`. They are in the bundle because a dependency put
them there, not because the design system chose them.

Only two `animate-*` utilities appear in the captured DOM at all — `animate-pulse` and
`animate-pulse-sparkline` (DOM snapshots; `facts.json` has no utility counts, so no figure is
quoted). Everything else is loaded but idle: most of it is dialog/toast/calendar motion that
wasn't triggered at capture time. **48 keyframes shipped, ~2 firing on a resting page** is itself
the finding — do not port the pile.

The one exotic easing in the system, `cubic-bezier(.36, .07, .19, .97)` (`facts.json` →
`motion.easings`: **3**), is the classic **shake** curve — error/invalid-input feedback.

## 2.6 Reduced motion — MINED. **This is done properly; copy it exactly.**

`facts.json` → `motion.prefersReducedMotionRules` is **41** — forty-one rules inside
`@media (prefers-reduced-motion: reduce)` blocks. That is a serious compliance surface, not a
token gesture. Here is what they do.

### The pattern: don't just kill the animation — land it in its resting state

```css
@media (prefers-reduced-motion: reduce) {
  /* Entrance: jump straight to the FINAL state, not the initial one.
     Without `opacity: 1; transform: none` the row would stay stuck at
     opacity .01, translateY(4px) — invisible. This is the bug the source
     correctly avoids. */
  .ds .ds-animate-fade-slide-in {
    opacity: 1;
    transform: none;
    animation: none;
  }

  /* Loop: freeze at a legible mid-value, not at whatever frame 0 happens to be. */
  .ds .ds-animate-pulse-sparkline {
    opacity: 0.5;
    animation: none;
  }

  /* Feedback shake: just stop. Nothing to restore. */
  .ds .ds-animate-shake {
    animation: none;
  }
}
```

Tailwind's `motion-reduce:` / `motion-safe:` variants carry the rest. **No Uses column** — these
are utility classes, and `facts.json` has no utility counts (§0):

| Variant utility | Compiles to |
| --- | --- |
| `motion-reduce:transition-none` | `@media (prefers-reduced-motion: reduce) { transition-property: none }`. The workhorse — it is on essentially every animated piece of chrome. Consistent with `motion.transitionProps` counting `none` **41×** and `none!important` **9×**, and `motion.durations` counting `0s` **31×**. |
| `motion-reduce:animate-none` | `animation: none` |
| `motion-reduce:translate-x-0` | `--tw-translate-x: 0` — cancels a slide-in's offset |
| `motion-safe:transition-opacity` | Only fades when motion is welcome |
| `motion-safe:duration-200` | |
| `motion-safe:animate-pulse` | |
| `motion-safe:animate-[slide-down_400ms_cubic-bezier(0.21,1.02,0.73,1)_forwards]` | Toast entrance — **opt-in only** |

**The load-bearing observation:** the sidebar — the single most-animated thing in the app
(everything in the rail runs on `--sidebar-animation-duration`) — carries
`motion-reduce:transition-none` throughout. The biggest motion in the product is the one most
carefully gated, and `facts.json` → `motion.prefersReducedMotionRules` = **41** says the same
discipline is applied in the raw CSS, not just in the utility layer.

**Rules:**
- Every `transition-*` on a chrome/layout element gets `motion-reduce:transition-none`.
- Every **entrance** animation gets a `prefers-reduced-motion: reduce` block that sets the
  **final** state explicitly. `animation: none` alone is a bug.
- Every **overshoot/bounce** curve (`slide-down`, `bounce-in`, `shake`, `float`) goes behind
  `motion-safe:` — opt-in, never opt-out.
- **Never** put essential state behind motion. If a thing only becomes visible via an animation,
  a reduced-motion user will never see it.

## 2.7 Motion do / don't

**Do**
- Default to `150ms` + `--ease-out` for hover/focus color changes. That is the system's voice.
- Enumerate transition properties: `transition-[color,box-shadow,outline]`, never
  `transition-all`.
- Animate collapsibles with `grid-template-rows: 0fr → 1fr` — 176 uses say this is the house
  technique.
- Scope a component's timing to CSS vars on its root (`--sidebar-animation-duration`) so the
  whole component retimes from one place.
- De-synchronize repeated loaders (per-row `--shimmer-delay`, `--row-delay`).

**Don't**
- Don't exceed **300ms** for a transition. No transition rung in the mined data does; the longer
  values in `motion.durations` are keyframe animations and loops.
- Don't use `transition-all`. It is a rounding error in the utility layer, and its 25 raw-CSS
  appearances (`motion.transitionProps.all` = 25) are legacy/vendor — treat it as a code smell.
- Don't use an overshoot/bounce curve for anything but a toast entrance.
- Don't animate `left` / `top` / `height` / `width` when `transform` will do. `facts.json` →
  `motion.transitionProps` shows `width` **30**, `height` **24**, `left` **9**, `top` **9** — a
  non-trivial amount of layout-thrashing, mostly legacy/vendor. `transform` (**34**) is the one to
  reach for; note `opacity` (**64**) outranks them all — fade first, move second.
- Don't ship an entrance animation without its reduced-motion resting state.

## 2.8 Motion accessibility notes

- **WCAG 2.2 SC 2.3.3 (Animation from Interactions, AAA)** — honored via the
  `prefers-reduced-motion: reduce` blocks above. The **41** mined rules
  (`facts.json` → `motion.prefersReducedMotionRules`) are the compliance surface. With 48
  keyframes in the bundle, 41 reduce-rules is roughly one gate per animation — port that ratio,
  not just the pattern.
- **SC 2.2.2 (Pause, Stop, Hide)** — the infinite loops (`--animate-spin`, `--animate-pulse`,
  `pulse-sparkline`, `shimmer`) are all **loading indicators**, which are exempt as long as they
  stop when loading completes. Don't repurpose them for decoration.
- **Vestibular safety** — the only large-displacement motion is the sidebar/drawer, and both are
  gated. `float` and `kumo-chart-wave` are the ones to watch; keep them `motion-safe:`.
- **No flashing.** Nothing in the mined keyframes approaches 3 Hz. The fastest loop is
  `--animate-refresh` at `.5s` (2 Hz) but it's a rotation, not a luminance flash — fine.
- **Focus must not depend on a transition.** `transition-[color,box-shadow,outline]` is a
  *sweetener*; the focus ring must be fully present at `duration: 0`.

---

# PART 3 — Using this in Tailwind CSS v4 + shadcn/ui

## 3.1 `@theme` — register the scales

Tailwind v4 generates utilities from `@theme` namespaces. Drop this next to your
`tokens/colors.css` import. Names are preserved from the source; the `--ds-*` ones are the
normalized additions.

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design-system/tokens/colors.css";      /* brings the kumo tokens + the 3 z tokens */
@import "../design-system/tokens/typography.css";

/* next-themes writes .dark on <html>. The mined tokens key off [data-mode=dark].
   Bridge them once, here, so both selectors resolve. */
@custom-variant dark (&:where(.dark, .dark *, [data-mode=dark], [data-mode=dark] *));

@theme {
  /* --- Shadows. Only 4 rungs. Do not add more. --------------------------- */
  --shadow-xs:  0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm:  0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  /* The kumo composed shadow, promoted to a first-class utility: `shadow-elevated` */
  --shadow-elevated:
    0 0 1px 0.5px var(--color-kumo-shadow-edge),
    0 1px 2px     var(--color-kumo-shadow-drop);
  --drop-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.15);

  /* --- Z-index. `z-modal`, `z-drawer`, `z-toast`, `z-dropdown`… ----------- */
  --z-index-dropdown: 110;
  /* --z-index-modal / --z-index-drawer / --z-index-toast come from colors.css */

  /* --- Durations. `duration-fast`, `duration-normal`… --------------------- */
  --duration-instant: 100ms;
  --duration-fast:    150ms;
  --duration-normal:  200ms;
  --duration-slow:    250ms;
  --duration-slower:  300ms;

  /* --- Easings. --ease-in / --ease-out / --ease-in-out are already in
         colors.css; add the chrome curve. `ease-chrome` --------------------- */
  --ease-chrome: cubic-bezier(0.77, 0, 0.175, 1);

  /* --- Animations. `animate-fade-slide-in`, `animate-pulse-sparkline` ----- */
  --animate-fade-slide-in:   fadeSlideIn 0.3s var(--ease-out) forwards;
  --animate-pulse-sparkline: pulse-sparkline 1.5s var(--ease-in-out) infinite;
}

@keyframes fadeSlideIn {
  from { opacity: 0.01; transform: translateY(4px); }
  to   { opacity: 1;    transform: translateY(0); }
}
@keyframes pulse-sparkline {
  0%, 100% { opacity: 0.8; }
  50%      { opacity: 0.3; }
}

/* Reduced motion — the resting-state pattern from §2.6. Non-negotiable. */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-slide-in   { opacity: 1; transform: none; animation: none; }
  .animate-pulse-sparkline { opacity: 0.5; animation: none; }
}
```

That gives you, for free: `shadow-xs` `shadow-sm` `shadow-2xl` `shadow-elevated`,
`z-modal` `z-drawer` `z-toast` `z-dropdown`, `duration-fast` `duration-normal` `duration-slow`
`duration-slower` `duration-instant`, `ease-chrome`, `animate-fade-slide-in`
`animate-pulse-sparkline`.

## 3.2 Dark mode with `next-themes`

`next-themes` sets `class="dark"` on `<html>`; the mined tokens key off `[data-mode=dark]`. The
`@custom-variant` above bridges them, but the **tokens themselves** need the same treatment —
either re-emit the dark block under `.dark`, or point `next-themes` at the attribute:

```tsx
// app/providers.tsx — cleanest option: don't fight the source's selector.
<ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

Once that's set, `--color-kumo-shadow-edge` flips from black to white on its own and
`shadow-elevated` becomes a light rim in dark mode with **zero component changes**. That is the
entire payoff of the shadow-color-token design — don't defeat it by writing
`dark:shadow-something`.

## 3.3 shadcn/ui component mapping

The elevation ladder maps cleanly onto shadcn primitives. Patch these classes into the generated
components.

| shadcn component | Layer | Classes to apply |
| --- | --- | --- |
| `Card` | 0 (flush) | `bg-kumo-base ring-1 ring-kumo-line shadow-none rounded-lg` |
| `Button` | control | `shadow-xs transition-[color,box-shadow,outline] duration-fast ease-out` |
| `Input`, `InputGroup` | control | `bg-kumo-control shadow-xs transition-[color,box-shadow,outline] duration-fast` |
| `DropdownMenuContent`, `SelectContent`, `PopoverContent`, `Command` | floating | `bg-kumo-overlay shadow-elevated z-dropdown` |
| `TooltipContent` | floating | `bg-kumo-overlay shadow-elevated z-dropdown` + arrow uses `fill-kumo-tip-shadow` / `stroke-kumo-tip-stroke` |
| `DialogContent`, `AlertDialogContent` | modal | `bg-kumo-overlay shadow-2xl z-modal` |
| `Sheet` / `Drawer` (vaul) | drawer | `bg-kumo-overlay border-l border-kumo-line z-drawer transition-[width,transform] duration-slower ease-in-out motion-reduce:transition-none` |
| `Sonner` / `Toaster` | toast | `z-toast` + `motion-safe:animate-[slide-down_400ms_cubic-bezier(0.21,1.02,0.73,1)_forwards]` |
| `Sidebar` | shell | `z-shell transition-[width] duration-slow ease-chrome motion-reduce:transition-none` |
| `Tabs` (`TabsTrigger`) | tab | `z-[2]` on the active trigger |
| `Skeleton` | — | shimmer with per-instance `--shimmer-delay` / `--shimmer-duration` |
| `Accordion`, `Collapsible` | — | `grid transition-[grid-template-rows] duration-normal ease-in-out` with `grid-rows-[0fr]` → `grid-rows-[1fr]` |

`radix`/`shadcn` `Dialog`, `Popover`, `Tooltip`, `DropdownMenu`, `Tabs`, `Sheet`, `Skeleton`,
`Toast`, `Sidebar` and `Command` all correspond to element families **observed** in
`facts.json` → `usage.elementTotalsDeduped` (`dialog` 25, `tooltip` 27, `menu` 11, `tab` 10,
`button` 88, `input` 15). `Switch`, `RadioGroup`, `Select` and `Textarea` are in
`usage.notObserved` — any elevation/motion guidance for those is **PRESCRIPTIVE**.

## 3.4 CVA: elevation as a variant axis

```ts
// components/ui/surface.tsx
import { cva, type VariantProps } from "class-variance-authority";

export const surfaceVariants = cva("rounded-lg", {
  variants: {
    elevation: {
      // Level -1 — wells, insets, code blocks.
      recessed: "bg-kumo-recessed shadow-none",
      // Level 0 — the default. Flush, separated by a hairline ring.
      flat:     "bg-kumo-base ring-1 ring-kumo-line shadow-none",
      // Level 1 — controls.
      control:  "bg-kumo-control shadow-xs",
      // Level 2 — menus, popovers, tooltips. Theme-aware composed shadow.
      floating: "bg-kumo-overlay shadow-elevated",
      // Level 3 — dialogs.
      modal:    "bg-kumo-overlay shadow-2xl",
    },
    interactive: {
      // Ship color + box-shadow + outline together. See §2.4.
      true:  "transition-[color,box-shadow,outline] duration-fast ease-out " +
             "focus-visible:ring-2 focus-visible:ring-kumo-focus/50 " +
             "motion-reduce:transition-none",
      false: "",
    },
  },
  defaultVariants: { elevation: "flat", interactive: false },
});

export type SurfaceProps = VariantProps<typeof surfaceVariants>;
```

## 3.5 Icons — `lucide-react`

Motion applies to icons via `transition-transform duration-normal` — `transition-transform` is one
of the most-used transition utilities in the snapshots, and `facts.json` →
`motion.transitionProps` backs it in raw CSS (`transform` **34**, plus `rotate` **12** and `scale`
**12**). The canonical case is a disclosure chevron:

```tsx
import { ChevronDown } from "lucide-react";

<ChevronDown
  className="size-4 transition-transform duration-normal ease-in-out
             motion-reduce:transition-none
             group-data-[state=open]:rotate-180"
/>
```

Loading spinners use `animate-spin` (`--animate-spin: spin 1s linear infinite`):

```tsx
import { Loader2 } from "lucide-react";
<Loader2 className="size-4 animate-spin" />
```

Mined icon sizes are `12 / 14 / 16 / 18 / 24 / 28 / 48` px (`facts.json` → `icons.sizesByUse`;
**12px dominates at 196 of 476 total svg uses**). In Tailwind that's `size-3` / `size-3.5` /
`size-4` / `size-4.5` / `size-6` / `size-7` / `size-12`. Note the dominant icon style is `fill`
(317) over `stroke` (35) — lucide is stroke-based, so expect a visual delta from the source; see
[`./iconography.md`](./iconography.md).

## 3.6 A worked example — Dialog

```tsx
<DialogContent
  className={cn(
    // elevation
    "bg-kumo-overlay shadow-2xl ring-1 ring-kumo-line rounded-lg",
    // layer
    "z-modal",
    // motion — entrance only when motion is welcome
    "motion-safe:animate-fade-slide-in",
    "transition-opacity duration-normal ease-out motion-reduce:transition-none",
  )}
/>
```

and its overlay/scrim — **PRESCRIPTIVE** (no scrim was captured; dialogs were closed):

```tsx
<DialogOverlay className="fixed inset-0 z-modal bg-black/50 motion-safe:animate-in motion-safe:fade-in-0" />
```

---

## Appendix — Quick reference

**Shadows (4 rungs):** `shadow-none` · `shadow-xs` · `shadow-elevated` · `shadow-2xl`
**Shadow colors:** `--color-kumo-shadow-drop` · `--color-kumo-shadow-edge` ·
`--color-kumo-tip-shadow` · `--color-kumo-tip-stroke`
**Surfaces (low→high):** `canvas` · `recessed` · `base` / `control` · `elevated` · `overlay`
**Z ladder:** `-10` · `0` · `1` · `2` · `10` · `20` · `50` · `110` · `9999` (modal) ·
`99999` (drawer) · `1000000` (toast)
**Durations (transitions):** `100` · `150` (default) · `200` · `250` · `300` ms. Nothing longer.
Raw-CSS top rungs (`facts.json` → `motion.durations`): `.2s` 67 · `.1s` 41 · `.4s` 35 · `.15s` 33 ·
`0s` 31 — the values above `.3s` are keyframes/loops, not transitions.
**Easings:** `--ease-out` (enter) · `--ease-in` (exit) · `--ease-in-out` (move) ·
`cubic-bezier(0.77,0,0.175,1)` (chrome). Raw CSS: `ease` 304 · `linear` 28.
**Most-transitioned properties** (`facts.json` → `motion.transitionProps`): `opacity` 64 ·
`none` 41 · `color` 37 · `border-color` 36 · `transform` 34.
**Keyframes:** 48 shipped (`motion.keyframeCount`), ~2 firing on a resting page —
`fadeSlideIn`, `pulse-sparkline`. **Reduced-motion rules:** 41.
**Always:** enumerate transition properties · `motion-reduce:transition-none` on chrome ·
resting state in `prefers-reduced-motion: reduce`
