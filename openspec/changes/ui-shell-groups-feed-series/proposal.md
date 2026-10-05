## Why

The prototype's shell, profile/settings split, group cards, home activity, and media library have drifted from the agreed product behavior, and the library has no series support at all. This change realigns them in one pass so navigation, settings, groups, discovery, and both media types behave consistently.

## What Changes

- **Shell**: the sidebar becomes collapsible to an icon-only rail (toggle beside the brand, state persisted); the product is named "Смотровик"; a brand favicon/app icon is added.
- **Account**: the top-right identity shows the name, the tag, or both per a Settings preference instead of the email; clicking it opens a menu with Профиль / Настройки / Выйти.
- **BREAKING**: the theme switch is removed from the top bar and exists only in Settings.
- **BREAKING**: Profile shows only Statistics and Активность (renamed from "Недавние записи"); every settings entry point moves into Settings, which holds theme, identity display, and privacy.
- **Home**: "Последняя активность" becomes a vertical scrolling feed of friends' and groups' activity only (the user's own history moves to the profile). In the prototype, group activity is synthesized; profile-hidden friends are excluded; series watch events are included. Home search now covers films and series.
- **Groups**: the whole card links to the group; statistics are removed from cards while the group detail screen keeps them; cards show the description plus free-form tags rendered as badges; tag text participates in the existing group search box.
- **Series**: a new `/series` route with a sidebar entry below "Мои фильмы" and a sixth mobile tab provides a "Мои сериалы" library mirroring My Films (add/edit/delete/search/filters/sort and whole-row expansion). The rating mode is chosen when adding: "по сериям" (rate episodes; season and series averages are computed immediately over rated episodes only; the season level is skipped for single-season series) or "целиком" (one whole-series rating, no season/episode expansion). Ratings and comments exist at every level, and at least one rating is required to add a series. The mode can be changed later behind a "previous ratings will be deleted" confirmation that clears the old ratings on acceptance.
- **BREAKING**: navigation grows from six sections and five mobile tabs to seven sections and six mobile tabs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui/navigation`: seven primary sections including My Series; six mobile tabs; collapsible rail; no theme switch in the top bar; identity/account menu with sign-out; the series route alongside My Films.
- `ui/design-system`: theme selection becomes Settings-only; a persisted identity-display preference (name / tag / both) is introduced.
- `ui/screens`: Home social activity feed and series-aware search; Profile reduced to statistics and activity; Settings as the settings hub; Groups card behavior and tag search; the new My Series screen and its rating model.

## Impact

- **Presentation layer only.** No backend, TMDB, or persistence-format changes; records and preferences stay in `localStorage`. The unique user tag item is deferred and out of scope, so no database change is made.
- **Data additions (presentation):** a Series model with seasons and episodes plus per-level ratings and comments; a social activity feed derived from `otherUsers[].recent` plus synthesized group events; `Group.tags`; a series record store.
- **Affected code:** `src/components/layout/*` (sidebar-rail, top-bar, account-menu, sections, nav-links), `src/app/layout.tsx` (title and app icon), `src/app/(app)/layout.tsx`, new `src/app/(app)/series/*`, new series view/data/store under `src/components/features/movie-tracker/`, and `SettingsView`, `ProfileView`, `GroupCard`, `GroupsView`, `HomeView`, `data.ts`, `types.ts`, `ThemeSelect`, `ThemeSwitcher`.
- **Tests:** `tests/unit/navigation.test.tsx` (sections, tabs, collapsible rail, top bar), `tests/unit/theme.test.tsx` (theme now Settings-only), `tests/unit/screens.test.tsx` (profile, settings, groups, series, home feed), `tests/unit/search.test.tsx` (series in Home search).
- **Sequencing:** `search-via-filters` (complete, unarchived) and `refine-search-and-my-films` (in progress) already modify `ui/navigation` and `ui/screens`; archive both before this change so its deltas apply to the intended base.
- **Out of scope:** unique user tag (deferred); navigation placement choice top vs side (dropped).
