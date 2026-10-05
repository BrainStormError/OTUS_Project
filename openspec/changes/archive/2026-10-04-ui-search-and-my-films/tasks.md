## 1. Remove global search from the shell

- [x] 1.1 Remove `GlobalSearch` from `src/components/layout/top-bar.tsx` so the top bar renders only `ThemeSwitcher` and `AccountMenu`; verify `TopBar` no longer imports or renders search.
- [x] 1.2 Delete the now-orphaned `/search` route (`src/app/(app)/search/`) and `src/components/features/movie-tracker/SearchResultsView.tsx` after confirming no remaining references; verify with `rg "SearchResultsView|GlobalSearch" src` returning no live usages.
- [x] 1.3 Update `tests/unit/routes.test.ts` to drop the `/search` entry from the route-depth map; verify `npm run test` passes that file.

## 2. Home: drop statistics, submit-driven search

- [x] 2.1 Remove the statistics section from `src/components/features/movie-tracker/HomeView.tsx` (and its `computeStats`/`StatCard` usage) while keeping recent activity and popular films; verify Home renders no `stat-card`.
- [x] 2.2 Change Home to compute results only on submit: hold committed query/filters and recompute on the "Найти" action so typing alone shows no results; verify by typing without submitting (no results region) then submitting (results shown).
- [x] 2.3 Update `tests/unit/search.test.tsx` Home cases to submit before asserting results, and assert no statistics on Home; verify `npm run test` passes.

## 3. My Films: list, live search, in-place comment, modal add/edit/delete

- [x] 3.1 Remove the statistics button from `src/app/(app)/films/page.tsx` and delete the `/films/stats` route after confirming no references; verify `rg "films/stats"` returns nothing.
- [x] 3.2 Add a live-filtering film search to `MyFilmsView.tsx` (same fields as Home) that filters the merged watched records as the user types; verify typing narrows the list immediately.
- [x] 3.3 Replace each row `<Link>` with a button using `aria-expanded`/`aria-controls` that toggles an in-place comment region, showing the record's comment or "Нет комментария"; verify clicking a row does not navigate and toggles the comment.
- [x] 3.4 Keep the existing rating, date, title, and year in the row unchanged; verify none of those fields change visually.
- [x] 3.5 Extend `RatingForm.tsx` and the `Modal` usage so the edit action opens a modal to change rating/comment and delete the record, and the add action opens an equivalent modal with film selection; verify add creates a record and edit updates/deletes one.
- [x] 3.6 Update `tests/unit/screens.test.tsx` My Films cases to assert button rows, in-place comment expansion ("Нет комментария" when empty), live filtering, and modal add/edit/delete; verify `npm run test` passes.

## 4. Friends and Groups: scoped search with fallback

- [x] 4.1 Add a friends search on `src/app/(app)/friends/page.tsx` that matches the user's friends first and falls back to all non-hidden profiles only when no friend matches; verify both branches, and that hidden profiles never appear.
- [x] 4.2 Add an analogous group search on `src/app/(app)/groups/page.tsx` that matches the user's groups first and falls back to all non-restricted groups; verify both branches.
- [x] 4.3 Add unit tests covering the scoped-then-fallback behavior and the exclusion of hidden profiles/groups; verify `npm run test` passes.

## 5. Cross-cutting verification

- [x] 5.1 Run `npm run lint` and `npm run typecheck`; verify both pass.
- [x] 5.2 Run `npm run test`; verify the unit suite passes with the updated expectations.
- [x] 5.3 Confirm the shell shows search only on Home, My Films, Friends, and Groups and never in the top bar; verify visually or with a navigation test.
- [x] 5.4 Confirm statistics appear only on the Profile and Group statistics screens; verify Home and My Films show none.

## 6. Archive sequencing

- [x] 6.1 Before archiving this change, sync/archive `movie-tracker-ui` so `openspec/specs/ui/screens` and `openspec/specs/ui/navigation` exist; verify `openspec list --specs` lists both.
- [x] 6.2 Re-run `openspec validate "ui-search-and-my-films"` and confirm the previous "target spec does not exist" INFO is gone; verify validation is clean.
