## 1. Data model and matching

- [x] 1.1 Change genre, actor, director, and year in `SearchFilters` to `string[]` (title stays `string`) in `types.ts`; verify `npm run typecheck` passes after downstream updates.
- [x] 1.2 Update `movieMatches` in `data.ts` to any-of matching within each multi-value filter and all-of matching across active filters, leaving the free-text `query` path used by the Add-film picker intact; verify a selection of two genres returns films from either genre and a genre+actor selection returns only films satisfying both.

## 2. Always-visible filter panel with dropdown selectors

- [x] 2.1 Replace the `<details>`/`<summary>` panel in `SearchField.tsx` with an always-rendered section that has a header row labelled `Поиск`; verify the panel content is visible without any activation and the panel itself is not a summary.
- [x] 2.2 Render genre, actor, director, and year as multi-value dropdowns: a `<details>`/`<summary>` per filter whose summary shows the label and selected count and whose panel holds a bounded, scrollable checkbox list of the derived options; selecting toggles a single value in the matching array; verify each option list is collapsed until opened, selecting two options in one filter calls `onFiltersChange` with both values, and the options still derive from the passed `movies`.
- [x] 2.3 Place the `Найти` button inside the always-visible header row, to the right of the `Поиск` label, rendered only when `onSearch` is provided, and passing the current filters; verify Home shows it in the header and My Films does not.

## 3. Grouped active-filter values

- [x] 3.1 Update `FilterChips.tsx` to render one active-values block per filter containing that filter's label and its selected values, each value with its own remove action, plus a single `Сбросить`; verify the values of one filter share one block, removing one value leaves the others, and `Сбросить` clears all filters.

## 4. Home wiring

- [x] 4.1 Update `HomeView.tsx` to work with array filters and keep submit-only behavior via `onSearch`; verify changing filters without activating `Найти` shows no results and activating it shows results for all active filters.

## 5. My Films table, row interactions, and confirmed delete

- [x] 5.1 Update `MyFilmsView.tsx` to render the filtered records as a table with Название, Оценка (the record's own rating), and Дата просмотра columns; verify the three columns render for each record.
- [x] 5.2 Add sortable header buttons with `aria-sort` and `{ key, direction }` state defaulting to Дата просмотра descending; verify activating a header sorts by it and activating it again reverses the order, and the initial order is newest-first.
- [x] 5.3 Put the edit action at the right of the record's expanded area (comment on the left), keeping it hidden until the row is expanded; verify no edit action is present before expanding and it sits at the right after expanding.
- [x] 5.4 Make the whole row select the record to expand it, keep the named control keyboard-reachable via `aria-expanded`/`aria-controls`, and highlight the row on hover; verify clicking a non-action part of the row expands the record, hovering highlights it, and activating an action does not toggle the row.
- [x] 5.5 Add the delete action to the expanded record with a confirmation dialog opened from the row; verify the record is removed only after confirming, cancelling keeps it, and the confirmation and the edit modal are never open together.

## 6. Tests

- [x] 6.1 Update `tests/unit/search.test.tsx` for the always-open panel, opening a dropdown before selecting its options, the single grouped block per filter with per-value removal, and the Home header submit; verify the file passes.
- [x] 6.2 Update `tests/unit/screens.test.tsx` for the My Films table columns, default newest-first order, header sorting, whole-row selection with hover, the edit action at the right of the expanded row, and the confirmed delete; verify the file passes.
- [x] 6.3 Run `npm run lint`, `npm run typecheck`, and `npm run test`; verify all pass.

## 7. Capability base sequencing

- [ ] 7.1 Confirm `search-via-filters` is archived before this change so its `ui/screens` and `ui/navigation` deltas exist as the base, then archive this change; verify `openspec list --specs` lists both capabilities and `openspec validate "refine-search-and-my-films"` reports no missing-base issue.
