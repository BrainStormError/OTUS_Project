## 1. Watch-later action on Home search results

- [x] 1.1 In `src/components/features/movie-tracker/HomeView.tsx`, pass `planned={plannedIds.has(mediaKey(movie))}` and `onTogglePlanned={(next) => togglePlanned(movie, next)}` to the `MovieCard` rendered in the search-results branch, exactly as the popular branch does; verify that activating "Буду смотреть" on a result card adds the title and shows the active state, and activating it again removes it
- [x] 1.2 Add a component test that renders a Home search-result card and asserts the "Буду смотреть" action toggles the watch-later list and its active state; verify the test fails without the change from 1.1 and passes with it

## 2. Wide dialog for the group-ratings media picker

- [x] 2.1 In `src/components/features/movie-tracker/GroupRatings.tsx`, set `size="wide"` on the "Выбор медиа" `Modal`; verify the dialog opens at the wide size and presents its search field, filters, and result list together without cramping

## 3. Verification

- [x] 3.1 Run `npm run lint` and `npm run typecheck` and confirm both pass
- [x] 3.2 Run `npm test` and confirm the new and existing suites pass
