## 1. Shared control and button geometry

- [x] 1.1 Normalize `src/components/ui/button.tsx` sizes so `default`, `sm`, and `icon` share one height (`h-11`, preserving the 44px touch target) and use symmetric per-size horizontal padding; verify the existing unit tests pass and buttons render the same height in a quick visual check on Home
- [x] 1.2 Confirm `src/components/ui/input.tsx` and the shared control height match the buttons (`h-11`) and that the login form uses the shared `Input` instead of a raw `<input>`; verify the login field height matches other fields
- [x] 1.3 Remove ad-hoc one-off sizing (`min-h-*`/`min-w-*`) where the shared button already provides it, keeping only intentional overrides; verify no control renders taller/shorter than its row peers

## 2. Aligned filter fields

- [x] 2.1 In `src/components/features/movie-tracker/SearchField.tsx`, give the genre control the same top label as the title and year fields so all three share one label/height rhythm; verify the three controls align in one row on desktop and stack one per row on a narrow viewport
- [x] 2.2 Verify the field-inventory unit tests pass and `npm run lint` reports no new issues for the changed files

## 3. Genre multi-select dropdown

- [x] 3.1 Replace the `<details>` genre control with a controlled dropdown that opens on trigger click and closes on value selection, outside click, and Escape; verify each close path manually on My Films
- [x] 3.2 Show a visible selected state for each chosen option while the dropdown is open; verify selected options are visibly marked and deselection clears the mark
- [x] 3.3 Ensure the dropdown is not clipped inside the add-record modal (correct stacking/overflow); verify the option list is fully visible and clickable inside the "Добавить" modal
- [x] 3.4 Keep `data-testid="filter-chips"` and the per-filter block ids stable and update any tests that targeted the old `<details>` markup; verify the filter unit tests and the My Films e2e path pass

## 4. Year as an incrementable value

- [x] 4.1 Replace the year `<select>` with a numeric field plus decrement/increment controls that step by one and support an empty (no filter) state; verify the value changes by one per step and the table filters to the entered year
- [x] 4.2 Seed a sensible starting year when stepping from empty (most recent available year, else current year) and clamp to available bounds; verify stepping from empty produces a valid in-range year
- [x] 4.3 Verify `movieMatches` exact-year behavior is unchanged and the year-filter tests pass

## 5. Rounded, non-clipped tables

- [x] 5.1 Wrap the tables in `MyFilmsView` and `MySeriesView` in a rounded, clipped container and remove `border-collapse`-dependent rounding from the tables; verify the outer corners render rounded with no square header angles
- [x] 5.2 Keep row dividers and hover/expanded highlight visually unchanged; verify the table grid looks the same apart from the corners

## 6. Friend requests tab

- [x] 6.1 Add a three-tab control (search / requests / friends) inside `FriendsView`, styled consistently with `GroupTabs`, and move incoming and outgoing requests into the requests tab; verify each tab shows only its content
- [x] 6.2 Show the pending incoming count on the requests tab; verify the count is visible and updates after accept/decline
- [x] 6.3 Verify the Friends e2e path (search, accept/decline, friend list) still passes

## 7. Verification

- [x] 7.1 Run `npm run lint`, `npm run typecheck`, and `npm test` and confirm all pass
- [x] 7.2 Manually walk Home and My Films on desktop and a narrow viewport to confirm fields align, the genre dropdown behaves, the year stepper works, and tables have rounded corners
