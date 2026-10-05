## 1. Data model and director filter

- [x] 1.1 Add `director?: string` to `Movie` and a `director` key to `SearchFilters`/`FilterKey` in `types.ts`; verify `npm run typecheck` passes.
- [x] 1.2 Fill one director for each of the eight catalog films in `data.ts` and add a case-insensitive director check to `movieMatches`; verify filtering by a director returns only that film.
- [x] 1.3 Add `director: 'Режиссёр'` to `FILTER_LABELS` in `FilterChips.tsx`; verify an active director filter renders as a removable chip.

## 2. Single filter-panel search in SearchField

- [x] 2.1 Remove the free-text query form (its `Input`, "Найти" submit tied to `onSearch`, and the `value`/`onChange` query props) from `SearchField.tsx`, keeping submit available to Home; verify `SearchField` renders no standalone searchbox.
- [x] 2.2 Rename the panel summary from "Фильтры" to "Поиск"; verify the summary text is "Поиск" and the chips/reset still work.
- [x] 2.3 Add a `movies: Movie[]` prop and derive genre, actor, director, and year options from it; convert the year control from a number input to a select; verify options match the passed movies and title remains a free-text input.

## 3. Home: submit-driven filter search

- [x] 3.1 Update `HomeView.tsx` to pass `movies={listMovies()}`, hold committed filters, and apply them only when "Найти" is pressed; verify changing filters without submit shows no results and submitting shows results.

## 4. My Films: scoped live filtering

- [x] 4.1 Update `MyFilmsView.tsx` to pass `movies` derived from the merged watched records and keep live filtering; verify genre/actor/director/year options contain only watched values while title accepts free text.

## 5. Home watched action and shared record modal

- [x] 5.1 Extract the film-fixed rating modal (uses `RatingForm`, upserts a record) so it can be shared by My Films add/edit and Home; verify My Films add/edit still work.
- [x] 5.2 Wire `HomeView` `MovieCard`s with watched state and open the record modal on the watched action (film fixed, no picker); verify saving a rating on Home makes the film appear in My Films.

## 6. Watched corner indicator

- [x] 6.1 Add a small corner check badge to `MovieCard.tsx` when `watched` is true, with `title="Просмотрено"` and an accessible label; verify the badge appears only when watched and is non-interactive.

## 7. Rating step

- [x] 7.1 Change `RATING_STEP` to `0.1` in `RatingForm.tsx`; verify the number input and range slider both report a step of `0.1`.

## 8. Tests and cross-cutting verification

- [x] 8.1 Update `tests/unit/search.test.tsx` for filter-driven search (no separate searchbox; Home commits on "Найти"); verify the file passes.
- [x] 8.2 Update `tests/unit/screens.test.tsx` for scoped My Films options, the Home card watched flow, and the corner indicator; verify the file passes.
- [x] 8.3 Run `npm run lint`, `npm run typecheck`, and `npm run test`; verify all pass.

## 9. Capability base sequencing

- [x] 9.1 Archive `ui-search-and-my-films` before archiving this change so its `ui/screens` and `ui/navigation` deltas exist as the base; verify `openspec list --specs` lists both and `openspec validate "search-via-filters"` reports no missing-base INFO.
