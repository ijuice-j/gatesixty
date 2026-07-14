# Known issues

An honest record of what in this package is **verified** and what is **not**, so nothing here
gets trusted further than it earned. Written after the run, not generated.

## Verified — trust these

| Artifact | Evidence |
|:--|:--|
| `tokens/colors.css`, `tokens.json` | `verify-refs` **PASS**. 586 tokens × 4 themes. Every value is script-mined — from the Phase 2b computed-style pass (`getComputedStyle`, so every `oklch` / `color-mix` / `var()` chain is resolved) or from the raw CSS. No agent hand-wrote a value. |
| `components/*.css` (8 recipes) | Rendered in `preview/index.html` in **both** themes. Body background resolves to `oklch(0.9875 0 0)` light / `oklch(0.1 0 0)` dark — byte-exact matches for the target. |
| `tokens/index.css` (Tailwind v4 + shadcn bridge) | Drift-audited against `colors.css`: 95 identical duplicates, 24 novel, 7 intentional bridge remaps, **0 tokens pinned to a wrong-theme value**. |
| IP / licensing | `ip-audit.js` **PASS**. No font binaries (Cloudflare's proprietary **Paper Mono** is never bundled). No brand assets. No verbatim paste of compiled CSS. |
| `PROVENANCE.md` | Machine-generated from the run's own artifacts. Every figure is read from `capture/` + `design-system/`, none typed by hand. |

## NOT fully verified — read with care

**`foundations/usage/*.md` and `foundations/usage-guidelines.md`.**

Three adversarial remediation loops failed to converge on these (scores 40→72→58, then 34→72).
At the point of writing, `doc-lint` reports:

- **84 rules missing a provenance tag.** The remediation rewrote rule lines and dropped their
  `OBSERVED` / `DERIVED` / `PRESCRIPTIVE` tags. An untagged rule is *unaudited*, not wrong —
  but you cannot tell which is which without re-deriving it yourself.
- **14 cited counts** not literally present in `facts.json`. Several are legitimately *derived*
  (e.g. `1060` = `1062` total − `2` `type-dark`), and `doc-lint` only accepts verbatim matches —
  so this is partly a linter limitation, not necessarily a doc error. It has not been
  case-by-case verified.
- 2 raw hex (`#333`), 1 undefined token (`--color-kumo-active`).

**The specific claims the adversarial verifier caught, which you should NOT rely on:**

`facts.json` has `usage.statusIntent = {}` and `usage.variantClasses = {}` — both **empty**. So
the fact bundle contains **no** badge variant/shape/label breakdown, **no** per-page badge
attribution, **no** popover category, **no** height↔variant evidence, **no** icon-size-by-context
cross-tab, **no** per-page type-class attribution, and **no** radius-by-element cross-tab.

Any guideline that asserts one of those as `OBSERVED` is over-claiming. The **raw totals** are
real and re-derivable (`badge` = 136 raw / 17 deduped, `rounded-lg` = 946, icons 42@16px /
196@12px, buttons 47–59 per page); the *context and attribution* layered on top of them often is
not.

## Facts worth keeping straight

These were each re-derived from `facts.json` by hand and are correct:

- **Control heights are `h-8` / `h-9` / `h-10`** (32/36/40px). `h-12` and `h-14` are **icon boxes
  and row heights**, not text-control heights — do not build a 48px hero button on `h-12`.
  (`controlHeightsByTag`: `button {h-8:16, h-9:26, h-10:2}`, `a {h-8:8, h-9:6}`.)
- **`h-9` never pairs with `text-sm`.** `buttonHeightTypePairs` = `{h-8|text-sm: 8,
  h-8|text-base: 8, h-9|text-base: 8, h-10|text-base: 2}`.
- **In-control gap is `gap-1.5`** (n=75). `gap-2` (n=1572) is the gap *between* adjacent things.
- **The action colour is blue, not orange.** `--color-kumo-brand` = `oklch(57.72% .2324 260)`.
  The Cloudflare orange `#f6821f` exists **only** as `--text-color-kumo-brand`. Never fill a
  button with it.
- **Dark themes off `[data-mode=dark]`**, not `.dark`. Bare `.dark` occurs **zero** times in the
  target's CSS.
- **`textarea`, `select`, `radio`, `switch` were never observed** (n=0). Any rule about them is
  necessarily `PRESCRIPTIVE`.
- **The target ships dead classes.** `ring-kumo-ring` (billing) and `disabled:text-kumo-disabled`
  (4 of 8 pages) reference tokens that were never defined, so Tailwind never compiled a utility
  for them — they are **inert in production**. Documented in `foundations/colors.md`; never cite
  them as real tokens.
