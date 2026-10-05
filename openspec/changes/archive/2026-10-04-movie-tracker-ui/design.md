## Context

See `proposal.md` — Why. The foundation this design builds on already exists: `src/app/globals.css` defines a shadcn-style token set as CSS variables (`--background`, `--card`, `--primary`, `--border`, `--ring`, ...) plus a `data-theme='dark'` custom variant; `src/components/layout/theme-switcher.tsx` already toggles `data-theme` and persists the choice in `localStorage`; `src/components/features/AsyncView.tsx` already models `loading` / `empty` / `error` / `success`; `src/app/(app)/layout.tsx` already renders a header + `<main>` + footer shell; `src/components/ui/button.tsx` uses `cva` + `cn`.

Constraints: presentation layer only, no new dependencies, the existing token names and `data-theme` contract must be preserved so nothing already rendering breaks. The product profile (movie tracker) is fixed, but screens do not exist yet.

## Goals / Non-Goals

**Goals:**

- A single, drop-in theme token mapping for light and dark that satisfies the matte palette and the contrast requirements in `specs/ui/accessibility`.
- A responsive navigation shell with a hard depth budget of 3, expressible as route structure.
- One shared inventory of components and state primitives that all screens compose from.

**Non-Goals:**

- Any backend behavior (film persistence, TMDB calls, statistics computation, authorization rules).
- A component library beyond what the screens require; no speculative variants.
- Reworking the `directory` reference module or the auth/login screens beyond theme token inheritance.

## Decisions

### Keep the existing CSS-variable token contract, change values only

Reuse the token names already in `globals.css` and the `data-theme` attribute; update only the values and add a few roles. Screens reference tokens, never hex.

- Why: zero migration risk, the theme switcher and `dark:` variant keep working, and `specs/ui/design-system` only requires semantic roles, not new plumbing.
- Alternative: a new `@theme`-first token system (rejected: churn for no behavioral gain).

### Token mapping

Two roles deserve note. In dark, a raw `#4A1F2B` button on the `#121212` canvas has ~1.4:1 separation, so the *brand/chrome* stays `#4A1F2B` while *actions* use a lifted maroon and *accent text* uses a light rose. In light, the maroon is reused as the action color so the brand reads consistently across themes, and the sky/beige/white anchors form the environment.

| Role | Dark | Light |
|---|---|---|
| canvas `--background` | `#121212` | `#F3E9DA` |
| surface `--card` | `#2B2B2B` | `#FFFFFF` |
| raised `--secondary`/`--muted` | `#333333` | `#D6EAF8` |
| chrome/brand | `#4A1F2B` | `#F3E9DA` + maroon accents |
| action `--primary` | `#9E4157` (white text, 6.3:1) | `#4A1F2B` (white text, 13.8:1) |
| foreground `--foreground` | `#EDEAE6` | `#2B2B2B` |
| muted `--muted-foreground` | `#A9A29B` | `#6B6259` |
| accent text `--accent-foreground` | `#D89AA6` | `#3D6A8F` |
| border `--border` | `#3D3A3B` | `#E6DAC8` |
| destructive `--destructive` | `#B0574F` | `#8A3A3A` |
| focus `--ring` | `#D89AA6` | `#3D6A8F` |

- Why: satisfies the anchors, keeps text ≥4.5:1 and control boundaries ≥3:1, and avoids toxic/neon/gradient actions.
- Alternative: keep maroon as the dark action (rejected: fails 3:1 separation and is hard to perceive); theme-local light primary blue for actions (rejected: breaks brand continuity, maroon already passes 13.8:1).

### Low-delta surfaces use border + elevation, not color

Dark surface `#2B2B2B` on `#121212` is ~1.3:1 and beige on white is ~1.2:1, so cards are separated by a 1px border plus a subtle shadow rather than by fill contrast.

- Why: matte, calm, and reliable in both themes without introducing a lighter "elevated" color that would leave the palette.
- Alternative: progressively lighter dark surfaces (rejected: drifts toward gray-blue and adds token churn).

### Theme persistence with no flash of the wrong theme

Keep the existing `localStorage` + `data-theme` mechanism and add an inline pre-hydration script in the root layout that reads the stored theme and sets `data-theme` on `<html>` before first paint; the `ThemeSwitcher` remains the runtime control.

- Why: the current switcher applies the theme in `useEffect` after mount, which flashes light on a dark preference; a pre-paint script removes the flash and keeps the persisted choice requirement.
- Alternative: cookie-based theme read on the server (viable, but adds a cookie and layout coupling for no functional gain here).

### Navigation shell as route-group structure

Primary sections map to routes under the existing `src/app/(app)` group, whose layout owns the shell. Desktop renders a persistent sidebar rail; mobile renders a bottom tab bar from the same section list, so both shells derive from one source of truth. The shell renders as server components with a small client island only for the active-link and menu behavior.

Route-to-depth map (Home is depth 0):

```
/                         Home/Search           0
/search                   Results               1
/film/[tmdbId]            Film card             2
/films                    My Films              1
/films/[id]               Record                2
/films/stats              My statistics         2
/me  /me/stats            Profile / statistics  1 / 2
/u/[handle]               Other profile         2
/friends  /friends/requests  Friends / requests 1
/groups  /groups/[id]     Groups / group card   1 / 2
/groups/[id]/admin        Group admin           3
/settings  /settings/privacy  Settings / privacy 1 / 2
```

The rating and comment form is a modal/sheet over `/film/[tmdbId]` and therefore also depth 3, not a separate route.

- Why: depth is a property of the route tree, so the budget is verifiable by inspecting routes rather than by convention.
- Alternative: a single client-side router view (rejected: loses RSC streaming and the existing App Router structure).

### Motion via CSS custom properties

Define `--dur-fast: 150ms`, `--dur: 200ms`, `--dur-slow: 250ms` and `--ease: cubic-bezier(.2,.6,.2,1)`, and wrap all transitions in `@media (prefers-reduced-motion: reduce)` to collapse to near-zero. Only `fade`, `slide`, `hover`, and skeleton `pulse` keyframes are defined.

- Why: one place enforces the 150–250 ms bound and the reduced-motion requirement.
- Alternative: utility classes only (rejected: durations would drift per component).

### States reuse `AsyncView`, with shared empty/skeleton primitives

Extend the existing `AsyncView` contract with shared `EmptyState`, `Skeleton*`, and `ErrorState` primitives and use them on every async surface; privacy-restricted states are a distinct `variant` of the same primitives rather than new screens.

- Why: the spec requires consistent coverage across screens; reuse guarantees it and matches the code already present.
- Alternative: per-screen bespoke states (rejected: violates the consistency requirement).

### Accessibility baked into primitives

Focus uses the `--ring` token with `focus-visible` + offset; icon-only controls take an `aria-label`; async result/error changes announce through `aria-live`; interactive targets are sized to 44px in the shared components.

- Why: implementing these once in primitives satisfies `specs/ui/accessibility` everywhere and avoids per-screen regressions.
- Alternative: addressing a11y per screen (rejected: inconsistent and easy to forget).

## Risks / Trade-offs

- Low surface-to-canvas contrast in both themes may read as "flat" → Mitigation: consistent 1px borders plus subtle shadow, and rely on the maroon chrome and accent text for hierarchy.
- A pre-paint theme script must stay in sync with the `data-theme` contract → Mitigation: keep the script minimal (read `localStorage`, set the attribute) and covered by an e2e smoke test.
- Maroon-on-dark action (`#9E4157`) sits right at ~3:1 boundary separation → Mitigation: pair buttons with a subtle border and verify with an automated contrast check in CI.
- Depth budget can silently regress as routes are added → Mitigation: record the route-depth map in this design and add a review check; a lint-style route assertion is possible later.
- Token renaming could leak if a screen hardcodes a color → Mitigation: the spec forbids hardcoded colors; add a lint/review check for raw hex in components.

## Migration Plan

1. Update `globals.css` token values and add motion custom properties plus reduced-motion handling.
2. Add the pre-paint theme script to the root layout.
3. Add the design-system primitives (empty/skeleton/error states, rating input, filter chips, stat card, privacy toggle, list items) under `src/components/ui` and `src/components/features`.
4. Replace the current header with the responsive shell (sidebar rail + bottom tabs) driven by one section list.
5. Add the screen routes in the depth map and compose them from the primitives.
6. Verify contrast, focus, keyboard, and reduced-motion in both themes.

Rollback: the change is additive and token-value-only; reverting the CSS values and shell files restores current behavior, and no data or migration is involved.

## Open Questions

- Rating input step: 0.5 with a slider (faster) vs 0.1 (finer). Both satisfy the "decimal part" requirement; pick during implementation.
- Whether a separate "watch later" list is in scope; the current specs only cover marking films as watched, so it is treated as out of scope here and can arrive as its own change.
- The stale `package.json` `name: "birthday-platform"` is unrelated to this UI change and should be corrected separately.
