# Typography

Type foundations for the **cloudflare-dashboard** design system, extracted from `https://dash.cloudflare.com`.

See also: [fonts.md](./fonts.md) (faces, loading, licensing) · [colors.css](../tokens/colors.css) (text colour tokens).

---

## 0. Read this first — provenance

This target was classified **`utility-compiled`** (`classification.json`: `utility-compiled` 1.0, `token-driven` 0.813; `utilityRatio` 0.79 across 6,796 class occurrences). Atomic classes carry the values, so per that file's own recommendation the **computed-style pass is the primary token source**.

That has two consequences you must know before trusting anything downstream:

| Artifact | What it holds | Trust for type? |
| --- | --- | --- |
| `tokens/typography.css` | Only the three `--font-*` **role stacks** | Partial — roles only, **no scale** |
| `tokens.json` → `typography` | `{}` — **empty** | No |
| `capture/_classes.json` | 900 selectors, **zero** `text-*`/`font-*` entries | No |
| `capture/computed-tokens.json` | The full resolved `--text-*`, `--leading-*`, `--tracking-*`, `--font-weight-*` set | **Yes — authoritative** |
| `capture/facts.json` → `usage.typeClass*` | Which class sits on which element, with counts | **Yes — for usage only** |

Every size, line-height, weight and tracking value in this document is transcribed from **`computed-tokens.json`**; every count is transcribed from **`facts.json`**. Nothing here is inferred from Tailwind's stock defaults — where the target happens to match stock, that is stated as a finding, not assumed.

> **Gap:** the scale below is *not currently emitted* into `tokens/typography.css` or `tokens.json`. Section 8 gives the `@theme` block that closes the gap. Until a deterministic step writes it, treat §8 as the canonical scale definition.

---

## 1. The headline trait: a shrunk bottom half

Cloudflare's dashboard is a **dense, information-first admin UI**, and the type scale says so out loud. The **bottom four steps are re-tuned smaller than stock Tailwind v4**; everything from `xl` up is left at stock values.

| Step | This system | Stock Tailwind v4 | |
| --- | --- | --- | --- |
| `--text-xs` | `12px` | `0.75rem` (12px) | same size, re-expressed in px |
| `--text-sm` | **`13px`** | `0.875rem` (14px) | **−1px** |
| `--text-base` | **`14px`** | `1rem` (16px) | **−2px** |
| `--text-lg` | **`16px`** | `1.125rem` (18px) | **−2px** |
| `--text-xl` | `1.25rem` (20px) | `1.25rem` | unchanged |
| `--text-2xl` … `--text-5xl` | unchanged | — | unchanged |

**`text-base` is 14px, not 16px.** This is the single most important fact on the page. Every mental model you carry over from a stock Tailwind project is off by one notch at the small end. `text-sm` — the workhorse, **914 of 1,060 type-class occurrences (86%)** — is **13px**.

The re-tuning is not only in the sizes. The bottom four **line-height ratios** were re-tuned too, while `xl`+ kept theirs — see §3.

---

## 2. Font roles

The source defines **three** family roles (verbatim from `computed-tokens.json`):

```css
--font-sans:  "Inter Variable", ui-sans-serif, system-ui, sans-serif,
              "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
--font-mono:  "Paper Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
              "Liberation Mono", "Courier New", monospace;
--font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
```

| Role | Lead face | Utility | Notes |
| --- | --- | --- | --- |
| `--font-sans` | **Inter Variable** | `.font-sans` | The UI face. Carries **everything** — body, headings, controls. |
| `--font-mono` | **Paper Mono** | `.font-mono` | Cloudflare's proprietary mono. Also **resets tracking to `0em`** (see §5). |
| `--font-serif` | *(system stack only)* | `.font-serif` | Defined by the framework; **no first-party face**, and no observed use. Treat as vestigial. |

### There is no separate heading family

This system has **one family**. Headings do not swap face — they move **Inter Variable's optical-size axis**:

```css
.font-heading { font-variation-settings: "opsz" 32; }
.font-title   { font-variation-settings: "opsz" 24; }
```

This is a genuine trait of the target and is easy to get wrong. `.font-heading` is **not** a `font-family` utility despite the name; it is an `opsz` axis utility on the same variable face. Optical sizing makes Inter's large-size cut slightly tighter and lower-contrast, which is what makes a 30px `h1` look "set" rather than "scaled up". It only works because the face is variable — a static Inter fallback silently ignores it and degrades gracefully.

> **Reconciliation note.** The shipped `tokens/typography.css` declares a `--font-heading` **role token**, which the source does **not** define. That token is a re-authoring convention of this design system, not a source token. If you keep it, point it at the same stack as `--font-sans` (as the shipped file already does) and use `.font-heading` / `.font-title` for the *axis*, or you will fork the family for no reason.

### Swapping the active face

The shipped `tokens/typography.css` substitutes **open-licensed look-alikes** — the commercial/first-party source faces are **not bundled** (see `font-license.json` and [fonts.md](./fonts.md)):

| Role | Source face | Shipped stand-in |
| --- | --- | --- |
| sans / heading | Inter Variable | **Inter** |
| mono | Paper Mono | **JetBrains Mono** |

To activate a licensed face, **lead the stack — never rewrite the fallbacks**:

```css
/* tokens/typography.css — swap the lead family only. */
:root {
  --font-sans: "Inter Variable", "Inter", ui-sans-serif, system-ui, -apple-system,
               "Segoe UI", Roboto, sans-serif;
  --font-mono: "Paper Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, monospace;
}
```

Because every utility resolves through `var(--font-*)`, this one edit re-points the whole system. **Do not** hardcode a family name in a component recipe.

---

## 3. The type scale

Each `text-*` utility sets a size **and** a paired line-height. Compiled shape, verbatim:

```css
.text-sm { font-size: var(--text-sm); line-height: var(--tw-leading, var(--text-sm--line-height)); }
```

The `var(--tw-leading, …)` fallback is load-bearing — see §4 for why it resolves to the paired value and not to the root's `1.5`.

**Computed line-height = size × ratio.** Root font-size is 16px (the base rule sets no `font-size`).

| Class | Role | `font-size` token | Size | Line-height token (ratio) | Computed LH | Weight¹ | Tracking¹ | Typical use (from `typeClassByTag`) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `text-5xl` | Display | `--text-5xl` | **48px** (`3rem`) | `1` | 48px | — | −0.01em | **Defined, never observed.** |
| `text-4xl` | Display | `--text-4xl` | **36px** (`2.25rem`) | `calc(2.5 / 2.25)` = 1.111 | 40px | — | −0.01em | **Defined, never observed.** |
| `text-3xl` | Heading 1 | `--text-3xl` | **30px** (`1.875rem`) | `calc(2.25 / 1.875)` = 1.2 | 36px | `font-semibold` | −0.01em | Page title. `h1 > text-3xl` ×3 — always as the `md:` half of a responsive pair. |
| `text-2xl` | Heading 2 | `--text-2xl` | **24px** (`1.5rem`) | `calc(2 / 1.5)` = 1.333 | 32px | 600 | −0.01em | Rare. `h2 > text-2xl` ×1. |
| `text-xl` | Heading 1, small | `--text-xl` | **20px** (`1.25rem`) | `calc(1.75 / 1.25)` = 1.4 | 28px | `font-semibold` | −0.01em | The **mobile** half of the `h1` pair. `h1 > text-xl` ×1. |
| `text-lg` | Heading 3 | `--text-lg` | **16px** ⚠ | `calc(1.25 / 1)` = 1.25 | 20px | `font-semibold` | −0.01em | Card / section heading. `h3 > text-lg` ×3. |
| `text-base` | Body / comfortable UI | `--text-base` | **14px** ⚠ | `calc(1.25 / .875)` = 1.429 | 20px | 400 | −0.01em | Inputs, labels, nav, prose. `button` ×31, `div` ×25, `a` ×24, `nav` ×7, `label` ×4, `input` ×4, `p` ×3, `h2` ×1, `table` ×1. **101 total.** |
| `text-sm` | **Default UI** | `--text-sm` | **13px** ⚠ | `calc(1 / .85)` = 1.176 | **15.29px** ⚠ | 400 | −0.01em | Everything. `a` ×632, `button` ×190, `span` ×43, `div` ×37, `th` ×7, `p` ×4, `td` ×1. **914 total.** |
| `text-xs` | Meta / micro | `--text-xs` | **12px** | `calc(1 / .75)` = 1.333 | 16px | 400 | −0.01em | Captions, small buttons. `button` ×13, `div` ×7, `span` ×7, `p` ×1, `a` ×1. **29 total.** |
| `text-xs/4` | Keycap | `--text-xs` | **12px** | `calc(var(--spacing) * 4)` = **1rem** | 16px | 400 | −0.01em | `kbd` ×8 — keyboard-shortcut chips, **only** on `kbd`. |

¹ Weight and tracking are **not** carried by the `text-*` utility. They come from the base rule (§4) unless a `font-*` / `tracking-*` utility overrides. Weights shown for headings are the ones observed in captured markup.

⚠ **The three traps.**
- **`text-lg` is 16px** — smaller than stock `text-base`. An `h3` in this system is the size of body copy in a normal one; it reads as a heading purely through weight 600 and the `20px` line box.
- **`text-base` (14px, LH 20px) and `text-lg` (16px, LH 20px) share an identical 20px line box.** This is deliberate — it lets a 16px card title and 14px body text sit on the same vertical rhythm without compensating margins. Preserve both ratios or you lose it.
- **`text-sm` computes to a 15.29px line-height** (13 × 1/0.85), the only non-integer in the scale. It is tight (1.18×) and it is on 86% of the text in the product. See §7 for the accessibility consequence.

### `text-xs/4`

`text-xs/4` is Tailwind's *arbitrary line-height* syntax: size from `--text-xs`, line-height from the **spacing** scale (`--spacing` = `0.25rem`, so `4 × 0.25rem` = `1rem` = 16px). Note this lands on **exactly the same 12px/16px box** as plain `text-xs` — it is a different expression of an identical result, reached via the spacing scale so the keycap's line box locks to the layout grid rather than to the type ramp. Use it only where you are aligning to spacing, as `kbd` does; otherwise prefer plain `text-xs`.

### Steps defined but not observed

`text-4xl` (36px) and `text-5xl` (48px) exist in the token set but appear **nowhere** in the 8 captured pages (`typeClassTotals`). A product dashboard simply has no display copy. Keep them in `@theme` for marketing/empty-state surfaces, but treat any usage as **PRESCRIPTIVE — not observed in the source**.

---

## 4. The base rule (this is where weight, leading and tracking live)

Every default that the `text-*` utilities *don't* set comes from one rule. Re-authored, verbatim in effect:

```css
/* Base UI type. Note the selector: `button` is listed explicitly because
 * form controls do not inherit font from the document in any browser. */
html,
button {
  font-family: var(--font-sans);

  line-height: 1.5;                        /* --tw-leading  */
  font-weight: var(--font-weight-normal);  /* --tw-font-weight → 400 */
  letter-spacing: -0.01em;                 /* --tw-tracking */

  /* Inter is drawn for this. Without it, text renders noticeably heavier. */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Inter character variants + contextual alternates. Preserve verbatim —
   * these select the alternate glyph set the whole product is drawn with. */
  font-feature-settings: "cv02", "cv03", "cv04", "calt";
}
```

Two details that matter:

**Global negative tracking.** The entire UI is set at **`-0.01em`**. This is *not* a named token — it is a literal in the base rule (and available as the arbitrary utility `tracking-[-0.01em]`). It is a subtle optical tightening appropriate to Inter at small sizes. Carry it into your base layer or your port will look slightly loose everywhere, in a way that's hard to diagnose.

**`--tw-leading` does not cascade.** The base rule sets `--tw-leading: 1.5`, yet a `text-sm` element gets `1.176`, not `1.5`. That is because the framework registers the slot as non-inheriting:

```css
@property --tw-leading      { syntax: "*"; inherits: false; }
@property --tw-tracking     { syntax: "*"; inherits: false; }
@property --tw-font-weight  { syntax: "*"; inherits: false; }
```

With `inherits: false`, the value set on `html` **does not reach descendants**. On any other element the var is guaranteed-invalid, so `line-height: var(--tw-leading, var(--text-sm--line-height))` falls through to the **paired** line-height. The root's `1.5` therefore applies *only* to unclassed text inheriting from `html`.

The practical rule: **a bare `leading-*` utility on a parent will not style its children.** Put `text-*` and `leading-*` on the same element. If you re-implement these `@property` rules, `inherits: false` is mandatory — flip it and every paired line-height in the system silently collapses to `1.5`.

---

## 5. Weight, leading and tracking scales

All values from `computed-tokens.json`. Weight and tracking are stock Tailwind v4; leading is stock. Only the **size** ramp was customised.

### Weight — `--font-weight-*`

| Token | Value | Utility | Use |
| --- | --- | --- | --- |
| `--font-weight-light` | `300` | `font-light` | **Avoid.** Defined, but unusable at 12–13px (see §7). |
| `--font-weight-normal` | `400` | `font-normal` | Base. All body, UI and control text. |
| `--font-weight-medium` | `500` | `font-medium` | Gentle emphasis; table headers, active nav. |
| `--font-weight-semibold` | `600` | `font-semibold` | **All observed headings** (`h1`, `h3`). The heading weight. |
| `--font-weight-bold` | `700` | `font-bold` | Strong emphasis. Not observed on headings. |

Inter Variable is declared `font-weight: 100 900`, so every step is a real interpolated instance — no synthetic bolding.

### Leading — `--leading-*`

| Token | Value | Utility |
| --- | --- | --- |
| `--leading-tight` | `1.25` | `leading-tight` |
| `--leading-snug` | `1.375` | `leading-snug` |
| `--leading-normal` | `1.5` | `leading-normal` |
| `--leading-relaxed` | `1.625` | `leading-relaxed` |
| `--leading-loose` | `2` | `leading-loose` |

Reach for these only to *override* a paired line-height. `leading-none` is **not** in the captured set.

### Tracking — `--tracking-*`

| Token | Value | Utility |
| --- | --- | --- |
| `--tracking-tight` | `-0.025em` | `tracking-tight` |
| `--tracking-normal` | `0em` | `tracking-normal` |
| `--tracking-wide` | `0.025em` | `tracking-wide` |
| `--tracking-wider` | `0.05em` | `tracking-wider` |
| `--tracking-widest` | `0.1em` | `tracking-widest` |

The base `-0.01em` sits **between** `tracking-normal` and `tracking-tight` and has no token of its own. `tracking-tighter` is **not** in the captured set.

**`.font-mono` resets tracking.** The compiled utility is two rules:

```css
.font-mono { font-family: var(--font-mono); }
.font-mono { --tw-tracking: var(--tracking-normal); letter-spacing: var(--tracking-normal); } /* → 0em */
```

Switching to mono **cancels the global −0.01em**. Correct — a monospace face is already metrically spaced and does not want optical tightening. If you re-author `.font-mono`, keep the reset.

---

## 6. Usage patterns from the captured markup

Anatomy transcribed from the post-render DOM (`capture/*.html`).

**Page title — the only responsive type in the system:**
```html
<h1 class="!mb-1.5 text-xl md:text-3xl font-semibold">
```
20px on small screens, **30px from the `md` breakpoint (768px)**. This is the *only* observed responsive type pair — every other step is fixed across all five breakpoints (640 / 768 / 1024 / 1280 / 1536px).

**Section / card heading:**
```html
<h3 class="text-kumo-default text-lg font-semibold">
```
16px / 600. Colour comes from a `--text-color-kumo-*` token, never a raw hex.

**Keycap:**
```html
<kbd class="ml-auto font-sans text-xs/4 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
```
Note `font-sans` is applied **explicitly** — `kbd` defaults to monospace in every UA stylesheet, and this system wants keycaps in the UI face.

**Controls.** From `buttonHeightTypePairs`, buttons pair height with size as: `h-8 | text-sm` ×8, `h-8 | text-base` ×8, `h-9 | text-base` ×8, `h-10 | text-base` ×2. So `text-sm` (13px) is the compact-button size and `text-base` (14px) the default — a button is **never** smaller than 13px.

**Icons alongside text.** Icon sizes cluster at **12px (196 uses), 16px (42), 14px (22)** (`facts.json` → `icons.sizesByUse`). Pair `size-3` (12px) or `size-3.5` (14px) with `text-sm`, and `size-4` (16px) with `text-base`. Do not drop a 20px icon next to 13px text.

### Two things `facts.json` does **not** tell you

- **Family-utility usage is not tallied.** `typeClassTotals` counts size classes only. The absence of `font-mono` from it is **not** evidence that mono is unused — it was never counted. The only family utility visible in captured markup is the `font-sans` on `kbd` above.
- **`type-dark` is not a typography class.** It appears in `typeClassTotals` (×2) and `typeClassByTag` (`div > type-dark` ×2), but `_classes.json` shows what it actually is:
  ```
  .__react_component_tooltip.type-dark { color: #fff; background-color: #222; }
  ```
  It is **react-tooltip's colour variant**, caught by a `type-*` prefix match. **Ignore it. It is not part of the type scale**, and the real total of typography-class occurrences is **1,060**, not 1,062. (It also reveals a legacy react-tooltip stylesheet with hardcoded `#222`/`#fff`, bypassing the token layer entirely — out of scope here, but worth a look when you author the tooltip recipe.)

---

## 7. Accessibility

**⚠ The bottom four steps are in `px` and will not respond to the user's font-size preference.** `--text-xs`/`sm`/`base`/`lg` are `12px`/`13px`/`14px`/`16px`; `--text-xl` and up are `rem`. A user who sets a larger default font size in their browser sees **no change at all** in 86% of the product's text, then a jump in headings. Page **zoom** still scales everything (so WCAG **1.4.4 Resize Text** is not strictly failed), but the preference-based path is broken and the scale is internally inconsistent.

If you can afford one deviation from the source, **make it this one** — convert the bottom four to `rem` and keep the rendered default identical:

```css
@theme {
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.8125rem;  /* 13px */
  --text-base: 0.875rem;   /* 14px */
  --text-lg:   1rem;       /* 16px */
}
```
Identical at the 16px default; now scales with user preference. §8 ships the px values for fidelity — this is the documented, recommended override.

**Other notes:**

- **`text-sm`'s 1.176 line-height is tight.** WCAG **1.4.12 Text Spacing** requires content to survive a user-forced `line-height: 1.5` (and `letter-spacing: 0.12em`). Authoring at 1.176 is allowed, but **containers must not be height-locked** — test with the text-spacing bookmarklet before shipping fixed-height rows or badges.
- **12px is the floor.** `text-xs` is the smallest step; never go below it, and never use it for anything a user must read to complete a task (use it for meta, timestamps, captions).
- **Never pair `font-light` (300) with `text-xs`/`text-sm`.** 300 weight at 12–13px on a light background falls apart, especially with `-webkit-font-smoothing: antialiased` thinning the stems. The token exists; it has no safe use in this system.
- **Weight is not an accessible-name mechanism.** `h3` reads as a heading only because it is `<h3>` — 16px/600 is visually near-identical to 14px body. Keep the heading *levels* semantic and sequential; do not pick a `text-*` step because it "looks like" a heading.
- **Contrast pairs with the colour layer**, not this one. Always take text colour from `--text-color-kumo-*` (see [colors.css](../tokens/colors.css)). `--text-color-kumo-subtle` and `--text-color-kumo-placeholder` are the low-contrast tokens — verify them against **1.4.3** at 12–13px, where they are most at risk.
- **Respect `prefers-reduced-motion`** for any text that animates (the source ships 8 such rules).

---

## 8. Using this in Tailwind CSS v4 + shadcn/ui

Good news: **the source *is* Tailwind v4** (`@property --tw-*` slots, paired `--text-*--line-height` vars, LightningCSS). The port is close to lossless — define the theme and the framework regenerates the exact utilities.

### 8.1 The `@theme` block

Drop this into `app/globals.css`. This is the **canonical scale definition** for this design system (it is the gap noted in §0). Values transcribed from `computed-tokens.json`.

```css
@import "tailwindcss";

@theme {
  /* ---- Font roles ------------------------------------------------------
   * Open-licensed stand-ins. To use the source faces, lead the stack with
   * the licensed family (see §2). Do not rewrite the fallbacks.           */
  --font-sans:  "Inter", ui-sans-serif, system-ui, -apple-system,
                "Segoe UI", Roboto, sans-serif;
  --font-mono:  "JetBrains Mono", ui-monospace, SFMono-Regular,
                Menlo, Consolas, monospace;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;

  /* ---- Size ramp -------------------------------------------------------
   * xs–lg are RE-TUNED for dense UI (base = 14px, NOT 16px).
   * xl and up are stock Tailwind v4.
   * NOTE: px matches the source exactly. See §7 for the recommended
   * rem conversion of these first four steps.                             */
  --text-xs:   12px;
  --text-sm:   13px;
  --text-base: 14px;
  --text-lg:   16px;
  --text-xl:   1.25rem;   /* 20px */
  --text-2xl:  1.5rem;    /* 24px */
  --text-3xl:  1.875rem;  /* 30px */
  --text-4xl:  2.25rem;   /* 36px — defined, not observed */
  --text-5xl:  3rem;      /* 48px — defined, not observed */

  /* ---- Paired line-heights ---------------------------------------------
   * Ratios, multiplied by font-size. xs–lg re-tuned; xl+ stock.
   * base (14/20) and lg (16/20) deliberately share a 20px line box.       */
  --text-xs--line-height:   calc(1 / 0.75);      /* 12 → 16px    */
  --text-sm--line-height:   calc(1 / 0.85);      /* 13 → 15.29px */
  --text-base--line-height: calc(1.25 / 0.875);  /* 14 → 20px    */
  --text-lg--line-height:   calc(1.25 / 1);      /* 16 → 20px    */
  --text-xl--line-height:   calc(1.75 / 1.25);   /* 20 → 28px    */
  --text-2xl--line-height:  calc(2 / 1.5);       /* 24 → 32px    */
  --text-3xl--line-height:  calc(2.25 / 1.875);  /* 30 → 36px    */
  --text-4xl--line-height:  calc(2.5 / 2.25);    /* 36 → 40px    */
  --text-5xl--line-height:  1;                   /* 48 → 48px    */

  /* ---- Weight / leading / tracking (all stock v4) ---------------------- */
  --font-weight-light:    300;
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;  /* the heading weight */
  --font-weight-bold:     700;

  --leading-tight:   1.25;
  --leading-snug:    1.375;
  --leading-normal:  1.5;
  --leading-relaxed: 1.625;
  --leading-loose:   2;

  --tracking-tight:  -0.025em;
  --tracking-normal:  0em;
  --tracking-wide:    0.025em;
  --tracking-wider:   0.05em;
  --tracking-widest:  0.1em;
}
```

### 8.2 The base layer

Without this, nothing looks right — this is where the family, the −0.01em tracking and the Inter feature settings come from.

```css
@layer base {
  /* `button` is explicit: form controls don't inherit font. */
  html, button {
    font-family: var(--font-sans);
    line-height: 1.5;
    font-weight: var(--font-weight-normal);
    letter-spacing: -0.01em;               /* global optical tightening */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: "cv02", "cv03", "cv04", "calt";
  }

  /* Monospace cancels the global tracking — mono is already metrically spaced. */
  .font-mono { letter-spacing: var(--tracking-normal); }
}
```

### 8.3 Optical-size utilities

Tailwind has no `opsz` primitive, so register the two the source uses. These are **no-ops unless the active face is variable with an `opsz` axis** (Inter Variable has one; static Inter does not) — they degrade silently and safely.

```css
@layer utilities {
  /* Not font-family utilities — they move Inter Variable's optical-size axis. */
  .font-heading { font-variation-settings: "opsz" 32; } /* h1 / h2 */
  .font-title   { font-variation-settings: "opsz" 24; } /* h3 / card titles */
}
```

### 8.4 Component recipes (scoped under `.ds`)

Semantic classes over the raw utilities, for the `scope-components.js` pass. Every value goes through a token var — no literals.

```css
/* Authored under .ds — scope-components.js enforces this root. */
.ds .ds-heading-1 {
  font-size: var(--text-xl);                              /* 20px, mobile */
  line-height: var(--text-xl--line-height);
  font-weight: var(--font-weight-semibold);
  font-variation-settings: "opsz" 32;
}
@media (width >= 48rem) {                                 /* md — 768px */
  .ds .ds-heading-1 {
    font-size: var(--text-3xl);                           /* 30px */
    line-height: var(--text-3xl--line-height);
  }
}

.ds .ds-heading-3 {
  font-size: var(--text-lg);                              /* 16px */
  line-height: var(--text-lg--line-height);               /* 20px box */
  font-weight: var(--font-weight-semibold);
  font-variation-settings: "opsz" 24;
  color: var(--text-color-kumo-default);
}

.ds .ds-body {                                            /* 14px — comfortable */
  font-size: var(--text-base);
  line-height: var(--text-base--line-height);             /* 20px box, matches h3 */
}

.ds .ds-ui {                                              /* 13px — THE default */
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
}

.ds .ds-meta {                                            /* 12px — captions */
  font-size: var(--text-xs);
  line-height: var(--text-xs--line-height);
  color: var(--text-color-kumo-subtle);
}

.ds .ds-kbd {                                             /* keycap */
  font-family: var(--font-sans);                          /* override UA monospace */
  font-size: var(--text-xs);
  line-height: calc(var(--spacing) * 4);                  /* 1rem, on the spacing grid */
  white-space: nowrap;
}
```

### 8.5 `class-variance-authority` variants

```ts
// components/ui/text.tsx
import { cva, type VariantProps } from "class-variance-authority";

export const textVariants = cva("", {
  variants: {
    variant: {
      // Display — PRESCRIPTIVE: defined in the token set, not observed in the source.
      display: "text-4xl font-semibold font-heading",
      // Page title — the only responsive step in the system.
      h1: "text-xl md:text-3xl font-semibold font-heading",
      h2: "text-2xl font-semibold font-heading",
      h3: "text-lg font-semibold font-title",   // 16px
      body: "text-base",                        // 14px
      ui: "text-sm",                            // 13px — the default
      meta: "text-xs text-kumo-subtle",         // 12px
      code: "font-mono text-sm",                // tracking auto-resets to 0
    },
    tone: {
      default:  "text-kumo-default",
      strong:   "text-kumo-strong",
      subtle:   "text-kumo-subtle",
      inactive: "text-kumo-inactive",
      danger:   "text-kumo-danger",
      success:  "text-kumo-success",
    },
  },
  defaultVariants: { variant: "ui", tone: "default" },
});

type TextProps = VariantProps<typeof textVariants> & {
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
};

// `as` is decoupled from `variant` on purpose: pick the TAG for document
// structure and the VARIANT for size. Never pick a heading tag for its size.
export function Text({ as: Tag = "span", variant, tone, className, ...props }: TextProps) {
  return <Tag className={textVariants({ variant, tone, className })} {...props} />;
}
```

### 8.6 What this changes in stock shadcn/ui

shadcn components hardcode Tailwind type classes, and **those classes now resolve to smaller sizes**. Audit these — they will silently shrink, which is usually correct (it is what makes the port look like the target) but must be a decision, not an accident:

| shadcn component | Class it ships | Stock renders | **Here it renders** |
| --- | --- | --- | --- |
| `Button` | `text-sm` | 14px | **13px** |
| `Input`, `Label` | `text-sm` | 14px | **13px** ⚠ source uses `text-base` (14px) on `input`/`label` — **override to `text-base`** to match. |
| `CardTitle` | `text-lg` / `text-2xl` | 18px / 24px | **16px** / 24px |
| `DialogTitle` | `text-lg` | 18px | **16px** |
| `TableHead` | `text-sm` | 14px | **13px** ✓ matches (`th > text-sm`) |
| `Badge` | `text-xs` | 12px | 12px ✓ |

The one real correction is **`Input` / `Label`**: the source sets those at `text-base` (14px), while shadcn ships `text-sm` (13px here). Patch the primitives rather than every call site.

### 8.7 Dark mode

**Typography is theme-invariant** — no size, weight, leading or tracking token changes between themes. Only text *colour* does; that lives entirely in [colors.css](../tokens/colors.css).

One bridge to mind: the mined colour tokens key on **`[data-mode="dark"]`**, while `next-themes` emits a `.dark` class by default. Either configure next-themes to write the attribute the tokens expect —

```tsx
<ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
```

— or alias the selector once in CSS:

```css
:root.dark { /* re-declare or @apply the [data-mode="dark"] token block */ }
```

Pick one. Do not hand-write per-theme colour values in a component; the whole point of the var indirection is that typography recipes never know which theme is active.

### 8.8 Icons

`lucide-react`, sized to sit with the text (from `icons.sizesByUse` — 12px dominates at 196 uses):

```tsx
import { ChevronRight } from "lucide-react";

<span className="inline-flex items-center gap-1.5 text-sm">
  Analytics
  <ChevronRight className="size-3" aria-hidden />   {/* 12px with 13px text */}
</span>
```
Pair `size-3` (12px) / `size-3.5` (14px) with `text-sm`, and `size-4` (16px) with `text-base`. Always `aria-hidden` on decorative icons — the text is the accessible name.

---

## 9. Do / Don't

**Do**
- Reach for **`text-sm` (13px) by default.** It is 86% of the product. `text-base` is the *comfortable* size, not the default one.
- Keep the base rule's **`-0.01em` tracking** and **Inter feature settings** — they are the product's voice, and their absence is hard to diagnose after the fact.
- Put `text-*` and `leading-*` **on the same element** (`--tw-leading` does not inherit).
- Use **`font-semibold` (600)** for headings. It is the only heading weight observed.
- Let `.font-mono` **reset tracking to 0**.
- Take text colour from `--text-color-kumo-*`; let the theme layer do its job.
- Match icon size to text size (12–14px icons with 13px text).

**Don't**
- **Don't assume `text-base` is 16px.** It is 14px. Re-check any layout you ported from a stock Tailwind project.
- **Don't treat `.font-heading` as a family swap.** It is an `opsz` axis utility on the same face.
- **Don't hardcode a font family, size or line-height** in a component. Go through `var(--font-*)` / `var(--text-*)` so the face swap in §2 keeps working.
- **Don't set `inherits: true`** on the `--tw-leading` / `--tw-tracking` / `--tw-font-weight` `@property` slots — every paired line-height in the system collapses to `1.5`.
- **Don't pair `font-light` (300) with `text-xs`/`text-sm`.**
- **Don't go below 12px**, and don't put task-critical text at 12px.
- **Don't height-lock containers around `text-sm`** — its 1.18 line-height leaves no room when a user forces WCAG 1.4.12 text spacing.
- **Don't use `text-4xl`/`text-5xl` and claim source fidelity** — they are defined but never observed. Mark such usage prescriptive.
- **Don't mistake `type-dark` for a type class.** It is a react-tooltip colour variant.
