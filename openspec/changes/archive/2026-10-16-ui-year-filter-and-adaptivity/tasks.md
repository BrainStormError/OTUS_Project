## 1. Year filter control

- [x] 1.1 Remove the `Minus`/`Plus` stepper buttons and the `step()` logic from `YearBound` in `src/components/features/movie-tracker/SearchField.tsx`, rendering a single numeric `Input`; verify a component test asserts no "Увеличить год" or "Уменьшить год" control renders
- [x] 1.2 Cap each year bound at the current calendar year (a `max` attribute plus an `onChange` guard that ignores a larger value) for `от` and `до`; verify a test that entering a year above the current year leaves the bound within the current year
- [x] 1.3 Update `setYearFrom` so an entered lower bound greater than the upper bound clears the upper bound in a single `onFiltersChange`, while a lower bound not greater than the upper bound preserves it; remove the inverted-range alert and the "Найти" disablement; verify tests for both branches
- [x] 1.4 Change the year range row to wrap (`flex flex-wrap`) so the two bounds stack at narrow widths; verify the bounds stay inside the panel at a narrow width in a component test

## 2. Watch-year filtering on My Films and My Series

- [x] 2.1 Add a `watchedAt`-year helper and a record-level year matcher to `src/components/features/movie-tracker/filters.ts`, leaving `movieMatches` release-year behavior unchanged; verify `tests/unit/filters.test.ts` covers a watch-year hit and a miss where the watch year differs from the release year
- [x] 2.2 Switch `MyFilmsView.tsx` and `MySeriesView.tsx` to the record matcher for the live year filter; verify `tests/unit/screens.test.tsx` shows a record whose release year is outside the range but whose watch date is inside
- [x] 2.3 Add a `yearLabel` prop to `SearchField` (default "Год") used for the field label and the year chip block, and pass "год просмотра" from `MyFilmsView` and `MySeriesView`; verify the label renders in each screen test

## 3. Adaptive layout

- [x] 3.1 Wrap the `GroupRatings.tsx` table in an `overflow-x-auto` container and remove `overflow-hidden` from the `<table>`, keeping the rounded border on the wrapper; verify a test asserts the ratings table has a horizontally scrollable ancestor
- [x] 3.2 Check the top bar at a 320px width and, if the centered wordmark overlaps the account menu, adjust its layout so both stay reachable; verify no overlap and both controls usable at 320px

## 4. Verification

- [x] 4.1 Run `npm run lint`, `npm run typecheck`, and `npm run deps:check`; verify all pass with no new boundary violations
- [x] 4.2 Run `npx vitest run --config vitest.config.ts tests/unit/filters.test.ts tests/unit/search.test.tsx tests/unit/screens.test.tsx`; verify all pass
- [x] 4.3 Run `openspec validate "ui-year-filter-and-adaptivity" --strict`; verify the change is valid
- [x] 4.4 Walk the running app at 320/375/768/1024/1440 px; verify no year steppers, the current-year cap, the clear-upper rule on an inverted "от", watch-year filtering on My Films/My Series with the "год просмотра" label, and no clipped content or overflowing controls

## 5. Year filter refinements (own row, "с"/"по" hints, "с X по Y" chip, blur reset)

- [x] 5.1 Move the year range to its own full-width row beneath the title and genre fields in `src/components/features/movie-tracker/SearchField.tsx` (grid `sm:grid-cols-2`, year range `sm:col-span-2`), replace the `—` separator with the hints "с" and "по" on the lower and upper bound, and drop the "от"/"до" wording; verify a component test shows the title and genre on the first row and the year range on its own row with the "с"/"по" hints
- [x] 5.2 Add an optional `prefix` to `ChipValue` in `src/components/features/movie-tracker/FilterChips.tsx` and render it before the value label; emit the year block values as "с &lt;year&gt;" / "по &lt;year&gt;" while keeping each bound's own remove control and the existing `from:`/`to:` remove semantics; verify a test shows the year block reads "с 2000 по 2010" and each bound removes only itself
- [x] 5.3 Replace the over-cap `onChange` guard with a blur reset in `SearchField.tsx`: allow typing a year above the current calendar year and, on blur, reset that bound to the current year (the lower-bound setter re-checks the inverted-range rule); verify a test that typing the current year plus one and blurring resets the field to the current year, and that a value within the cap is left as typed
- [x] 5.4 Update `tests/unit/search.test.tsx` for the own-row layout, the "с"/"по" hints, the "с X по Y" chip, and the blur reset; run `npx vitest run --config vitest.config.ts tests/unit/search.test.tsx`
- [x] 5.5 Run `npm run lint`, `npm run typecheck`, and `openspec validate "ui-year-filter-and-adaptivity" --strict`; verify all pass
- [x] 5.6 Walk the running app at 320/375/768/1024/1440 px; verify the year range sits on its own row with "с"/"по" hints, the active block reads "с X по Y" with per-bound removal, typing a year above the current one resets it to the current year on leaving the field, and the clear-upper rule still holds
