## Why

Search on Home and My Films hid its filters behind a collapsed "Поиск" panel and offered only single-value filters, and My Films showed a flat list with a permanently visible "Изменить" button and no column structure. The first pass of this change opened the panel, made the filters multi-value through always-visible checkbox lists, moved Home's submit action beside the panel label, and turned My Films into a sortable table with the edit action inside the expanded record. Review then asked for compact dropdown selectors instead of exposed checkbox lists, a single grouped block of active values per filter with per-value removal, and a quieter, fully clickable My Films row with an explicit delete confirmation. This change now delivers that final outcome.

## What Changes

- Home and My Films: the search panel is always expanded (no collapse); its label remains "Поиск".
- Multi-select filters: genre, actor, director, and year are chosen from a dropdown per filter that can hold several values; a film matches when it satisfies **any** selected value within one filter and **all** active filters. Title stays a single free-text field.
- Active values: shown grouped as a single block per filter, with each value individually removable; one "Сбросить" clears all filters.
- Home: the "Найти" action sits to the right of the "Поиск" label and applies every active filter on submit.
- My Films: no submit action; filters apply live as values change.
- My Films: the record list is a table with columns Название, Оценка (the user's own rating), and Дата просмотра; each column header sorts ascending/descending on activation; the default order is Дата просмотра, newest first.
- My Films: the whole row is selectable to expand a record, rows highlight on hover, and the "Изменить" action is not permanently visible but appears at the right of the record's expanded area.
- My Films: deleting a record is available in the expanded area and asks for confirmation before the record is removed.
- No rating filter is added; rating is used only as a sortable My Films column.

**BREAKING** (spec-level): the filter set changes from single values to multi-value selections chosen from dropdowns whose active values are grouped per filter, and the My Films list becomes a sortable table whose whole row is interactive and whose delete is confirmed.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui/screens`: Home and search screen (always-open panel, "Найти" beside the label), Search with filters (dropdown multi-value filters, grouped active values, matching semantics), My Films screen (sortable table with default date-descending order, whole-row selection with hover, edit action at the right of the expanded record, confirmed delete).
- `ui/navigation`: Tab-local search (Home and My Films keep a per-section search that is always visible; Home submits, My Films filters live).

## Impact

- **Presentation layer only.** No backend, persistence format, or TMDB integration changes; watched records remain in `localStorage`.
- **Data additions (presentation):** genre/actor/director/year values of `SearchFilters` are arrays; `movieMatches` does any-of matching within a filter.
- **Affected code:** `src/components/features/movie-tracker/SearchField.tsx`, `FilterChips.tsx`, `types.ts`, `data.ts`, `HomeView.tsx`, `MyFilmsView.tsx`; the delete action moves out of the edit form, so `RatingForm.tsx`/`RecordModal.tsx` lose the delete wiring.
- **Tests:** `tests/unit/search.test.tsx`, `tests/unit/screens.test.tsx`.
- **Sequencing:** the base `ui/screens` and `ui/navigation` behavior comes from the completed but unarchived `search-via-filters` change, which itself builds on the archived `ui-search-and-my-films`. This change's deltas carry the full final requirement text so the outcome is correct in that order.
