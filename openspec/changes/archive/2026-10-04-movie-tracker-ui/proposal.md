## Why

`bootstrap-project` fixed the engineering foundation (Next.js App Router, `app -> modules -> core`, tokenized Tailwind theme, `AsyncView` states, `data-theme` switcher) and recorded the project profile as a movie tracker, but the product has **no defined visual or UX layer**. Themes, palette, navigation, screens, states, components, motion, and accessibility are currently unspecified, so any screen built next would be invented ad-hoc and drift from the agreed acceptance criteria. This change captures the interface design once, as behavior specs plus a design document, so implementation has a single, reviewable target.

## What Changes

- Define two themes (light/dark) built on the existing `globals.css` token variables and `data-theme` mechanism, with a persisted switch reachable from every main screen.
- Fix a strictly matte palette per theme — dark: deep dark-maroon `#4A1F2B`, gray `#2B2B2B`, near-black `#121212`; light: matte light-sky `#D6EAF8`, white `#FFFFFF`, beige `#F3E9DA` — and derive accessible foreground/action/border tokens (no toxic, acid, or neon colors; no gradients on primary actions).
- Define the section map (Home/Search, My Films, Profile, Friends, Groups, Settings), a responsive shell (desktop sidebar rail + top bar; mobile top bar + bottom tab bar), and a hard navigation-depth budget: every key screen is at most 3 transitions from Home.
- Specify the key screens and states: home/search, film results, film card with "watched" add, rating + comment form (0–10 with decimal), own/other profile, statistics (count, average, genres, years), hidden profile/statistics, friends (search, requests, list), groups (list, group card, admin panel), and privacy/theme settings.
- Specify the shared component inventory and its visual anatomy.
- Specify loading, empty, error, and privacy-restricted interface states, reusing the existing `AsyncView` contract.
- Specify the allowed motion set only (fade, slide, hover, skeleton) at 150–250 ms and reduced-motion behavior; explicitly exclude parallax, bounce, and complex transitions.
- Specify accessibility requirements: contrast, visible focus, keyboard operation, and clear labels/microcopy.

## Capabilities

### New Capabilities

- `ui/design-system`: the two themes, the matte color tokens and their contrast guarantees, the persisted theme switch, and the allowed motion tokens.
- `ui/navigation`: the section information architecture, the maximum-depth rule from Home, and the responsive navigation shell (desktop and mobile).
- `ui/screens`: the required screens and their composition — discovery/search, film card and rating/comment form, profiles and statistics, friends, groups with admin panel, and settings.
- `ui/interface-states`: the loading, empty, error, and privacy-restricted states each screen must present.
- `ui/accessibility`: the contrast, focus, keyboard, labeling, and touch-target requirements that apply across all screens.

### Modified Capabilities

- None. The project has no existing specs; `bootstrap-project` specifications are not yet synced into `openspec/specs/`.

## Impact

- **Scope**: presentation layer only. No business logic, data model, TMDB integration, or authorization behavior is specified or changed.
- **Affected code (future implementation)**: `src/app/globals.css` (theme token values), `src/app/layout.tsx` and `src/app/(app)/layout.tsx` (theme bootstrap, nav shell), `src/components/layout/*` (header, footer, theme switcher), `src/components/ui/*` (new design-system primitives), and new `src/components/features/*` screens. New routes under `src/app/(app)/*`.
- **Dependencies**: no new dependencies expected — Tailwind v4, shadcn-style primitives, `lucide-react`, and `class-variance-authority` are already present.
- **Compatibility**: additive. The existing token names and `data-theme` contract are preserved; only values and shell composition change. No **BREAKING** changes.
- **Deferred (non-goals)**: backend feature behavior (film storage, group membership rules, statistics computation, TMDB calls), the `directory` reference module, and the rename of the stale `package.json` `name` field.
