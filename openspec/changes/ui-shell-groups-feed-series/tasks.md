## 1. Base sequencing

- [x] 1.1 Archive `search-via-filters` and then `refine-search-and-my-films`; verify `openspec list --specs` shows the updated `ui/navigation` and `ui/screens` and `openspec validate "ui-shell-groups-feed-series"` reports no missing-base issue.

## 2. Display preferences foundation

- [x] 2.1 Add a preferences helper in `src/components/layout/` for `theme`, `identity-display` (`name` | `tag` | `both`), and `rail-collapsed`, reading/writing `localStorage` with SSR-safe defaults; verify unit tests cover defaults and round-trips.
- [x] 2.2 Refactor `ThemeSelect` (Settings) and the new identity/rail readers onto the helper without changing existing theme behavior; verify `tests/unit/theme.test.tsx` still passes after updates.

## 3. Navigation shell

- [x] 3.1 Add the `series` section (`/series`, "Мои сериалы", `inTabBar: true`) directly below `films` in `sections.ts`; verify `tests/unit/navigation.test.tsx` is updated to expect seven sections and that My Series follows My Films.
- [x] 3.2 Extend `NavLinks` with an icon-only rendering for the collapsed rail that keeps an accessible name per item; verify keyboard focus reaches every item and each exposes a name.
- [x] 3.3 Add the collapse toggle beside the brand in `SidebarRail`, wired to the persisted `rail-collapsed` preference; verify collapsing hides labels, expanding restores them, and the state survives a reload.
- [x] 3.4 Update `MobileTabBar` to six tabs including My Series; verify `tests/unit/navigation.test.tsx` asserts six tabs and the active section.
- [x] 3.5 Update the `TopBar` composition (identity + account menu, no theme switch, no global search); verify `tests/unit/navigation.test.tsx` asserts no searchbox and no theme switch in the top bar.

## 4. Account identity, sign-out, and theme placement

- [x] 4.1 Rework `AccountMenu` to show name/tag/both per the identity preference, drop the email, and add a "Выйти" item calling `signOut`; verify menu contents and that sign-out invokes the auth action in a test.
- [x] 4.2 Pass `name` and `tag` from the app layout into `TopBar`/`AccountMenu` instead of `email`; verify the email never renders for any identity preference.
- [x] 4.3 Remove `ThemeSwitcher` from the top bar and delete the top-bar usage while keeping `ThemeSelect` in Settings; verify `tests/unit/theme.test.tsx` reflects theme selection only from Settings.

## 5. Settings hub and profile trim

- [x] 5.1 Add the identity-display control (name / tag / both) to `SettingsView` alongside theme and privacy; verify selecting each option updates the top-bar identity via the preference.
- [x] 5.2 Reduce `ProfileView` (own profile) to identity, statistics, and "Активность", removing the Settings and Privacy buttons and renaming "Недавние записи"; verify `tests/unit/screens.test.tsx` shows no settings/privacy controls on the profile.

## 6. Branding and app icon

- [x] 6.1 Set the browser title and navigation brand to "Смотровик" in `src/app/layout.tsx` and `SidebarRail`; verify the rendered title and brand text.
- [x] 6.2 Add `src/app/icon.svg` (clapperboard mark); verify the built app references a favicon/app icon.

## 7. Groups cards and tag search

- [x] 7.1 Add `tags: string[]` to `Group` and populate mock tags in `data.ts`; verify `tests/unit/screens.test.tsx` finds tag badges on a group card.
- [x] 7.2 Make the whole `GroupCard` a link to `/groups/[id]`, render name + description + tag badges, and remove the statistics `<dl>`; verify activating a non-link part of the card navigates and no stats render.
- [x] 7.3 Extend `searchGroups` to match name, description, and tags; verify a tag-only query (own and fallback) returns the expected groups.

## 8. Home social activity feed

- [x] 8.1 Add a feed builder that derives friend events from `friends`/`otherUsers[].recent` and synthesized group events, excludes `profileHidden` sources, includes series, and sorts newest first; verify unit tests cover ordering, exclusion, and series inclusion.
- [x] 8.2 Replace Home's own-records activity area with a bounded, vertically scrolling social feed and an empty state; verify Home shows no own history and the feed lists friends and groups with a source label.

## 9. Series data model and store

- [x] 9.1 Add `Series`, `SeasonMeta`, `EpisodeMeta`, and `SeriesRecord` types and a mock `series-data.ts` catalog; verify `npm run typecheck` passes.
- [x] 9.2 Implement `seasonAverage` and `seriesAverage` per design D2 (rated episodes only; single-season shortcut; whole mode); verify unit tests cover partial ratings, single-season, and multi-season cases.
- [x] 9.3 Add `series-store.ts` with the same add/edit/remove/merge semantics as `record-store.ts` under its own keys; verify unit tests cover persistence and removal.

## 10. My Series screen and rating UI

- [x] 10.1 Add the `/series` route and `MySeriesView` with the My Films table (Название / Оценка / Дата просмотра), sortable headers, filters, search, and whole-row expansion; verify `tests/unit/screens.test.tsx` covers columns, sorting, and row expansion.
- [x] 10.2 Implement nested expansion: seasons → episodes, skipping the season level for single-season series, and no expansion in whole-series mode; verify each case in tests.
- [x] 10.3 Build the series add/edit modals with the mode choice, per-episode / season / series ratings and comments, and the mandatory-rating validation; verify a series cannot be added without a rating.
- [x] 10.4 Add the mode-change flow with the "previous ratings will be deleted" confirmation that clears the previous payload on acceptance; verify confirming clears ratings and cancelling keeps them.

## 11. Home search across media

- [x] 11.1 Make Home search and filters cover films and series through a shared result shape; verify `tests/unit/search.test.tsx` finds a matching series alongside films.

## 12. Verification

- [x] 12.1 Run `npm run lint`, `npm run typecheck`, and `npm run test`; verify all pass.
- [x] 12.2 Run `npm run build` and manually check the shell (desktop collapse, six mobile tabs, identity/both modes, sign-out, Russian brand title and favicon) and the Home feed and My Series flows in the running app; verify each behaves as specified.
- [x] 12.3 Run `openspec validate "ui-shell-groups-feed-series" --strict`; verify it reports valid.
