## Context

See `proposal.md` - Why. On disk today the first pass of this change is implemented. `SearchField.tsx` is an always-rendered `<section>` with a `Поиск` header row and, for genre, actor, director, and year, one `fieldset` of checkboxes per filter in a bounded scroll (`SearchField.tsx:108`); `FilterChips.tsx` renders one chip per selected value (`FilterChips.tsx:35`); `MyFilmsView.tsx` renders a `<table>` with sortable headers and expands a record's comment only through the name button (`MyFilmsView.tsx:178`), with the `Изменить` action under the comment in the expanded detail (`MyFilmsView.tsx:203`); deleting happens immediately from `RatingForm.tsx:159` with no confirmation. `SearchFilters` values are `string[]` and `movieMatches` performs any-of matching within a filter and all-of across filters (`data.ts`). This revision replaces the checkbox lists with dropdown selectors, groups active values per filter, and adds the My Films row interactions and confirmed delete.

The repo has no popover, checkbox, or dropdown primitive in `src/components/ui` (badge, button, card, empty-state, error-state, input, modal, restricted-state, skeleton, textarea only), but `src/components/layout/account-menu.tsx` builds a dropdown from `<details>/<summary>` with an absolutely positioned `bg-popover` panel, which this change reuses.

Constraint: the base `ui/screens` and `ui/navigation` requirements this change modifies live in the unarchived `search-via-filters` change; until that is archived the main specs read pre-change text. This change's deltas carry the full final text, and both are archived in order.

## Goals / Non-Goals

**Goals:**

- One always-visible search panel per section, with Home's "Найти" on the panel-label row and My Films filtering live.
- Each multi-value filter chosen from a collapsed dropdown while the panel itself stays open.
- Any-of matching within a multi-value filter, all-filters matching across the search.
- Active values grouped as one block per filter, each value individually removable.
- A My Films table with sortable Название / Оценка / Дата просмотра columns, defaulting to newest-first by watch date.
- A quiet My Films record: whole-row selection, hover highlight, edit at the right of the expanded area, and a confirmed delete.

**Non-Goals:**

- No rating filter (explicitly excluded by the requester).
- No change to the Add-film picker inside My Films, to `MovieCard`, or to the record store.
- No nested modal and no change to the shared `Modal` primitive or `ui/accessibility`; the delete confirmation is a separate dialog opened from the row.
- No backend, persistence-format, or friend/group search changes.
- No new shared UI primitive package; controls stay local to the movie-tracker feature.

## Decisions

### Always-open panel with collapsible dropdown selectors

Keep the panel as an always-rendered `<section>` with the `Поиск` header row; the multi-value filters inside it are collapsed `<details>` disclosures. The earlier rejection of `<details open>` applies to the panel itself (it must never collapse), not to the per-filter selectors, which are intentionally collapsed until opened.

- Why: the panel must always be visible, while individual selectors must not expose every option until the user opens them.
- Alternative: an always-collapsible panel (rejected: contradicts the always-visible requirement).

### Array-valued `SearchFilters` with any-of / all-of semantics

`SearchFilters` genre/actor/director/year are `string[] | undefined`; `title` stays `string | undefined`. An absent or empty array means inactive. `movieMatches` matches a film when, for every active array filter, the film's value set intersects the selection; the title check is unchanged. Empty selection never filters.

- Why: encodes the two-level logic (OR within a filter, AND across filters) directly and keeps a single predicate reused by Home, My Films, and the Add-film picker.
- Alternative: a query-builder DSL (rejected: over-engineered for five fixed filters).

### Multi-value dropdown per filter

Each multi-value filter is a `<details>` whose `<summary>` is the closed selector (label plus selected count) and whose panel is an absolutely positioned, bounded, scrollable `bg-popover` box holding one labeled checkbox per derived option. Toggling a checkbox adds or removes that single value from the filter's array; the panel stays open while values are toggled. Options are derived exactly as today (`SearchField` `useMemo` over the passed `movies`), so Home stays catalog-wide and My Films watched-only without a per-screen fork.

- Why: the requester wants compact dropdown selectors rather than all values shown at once, while keeping multi-select and native checkbox semantics; it matches the existing `account-menu` dropdown pattern.
- Alternatives: native `<select multiple>` (rejected: clunky on desktop), a custom popover with outside-click handling (rejected: extra machinery over the native disclosure).

### One active-values block per filter

`FilterChips` renders one bordered block per active filter containing the filter label and its selected values, each value with its own remove button; the free-text title is its own block; a single "Сбросить" clears every filter. Empty state renders nothing.

- Why: the requester wants added values grouped in a single block rather than one block per value, while still allowing one value to be removed without affecting the others.
- Alternative: one chip per value (rejected: the outcome the requester asked to replace).

### Home submit in the panel header

`SearchField` renders the "Найти" button inside the always-visible header row, to the right of the `Поиск` label, and calls `onSearch(filters)` with the current values. My Films does not pass `onSearch`, so no button is rendered there and its filtering stays live via `onFiltersChange`.

- Why: satisfies the requested placement and keeps My Films live as required.
- Alternative: a button floating below/right of the grid (rejected: the requested position is the label row).

### My Films as a real table with `aria-sort` headers and whole-row selection

Render a `<table>` with `<thead>` and `<th scope="col">` header buttons for Название, Оценка, and Дата просмотра; `aria-sort` reflects state. The whole `<tr>` toggles the record's expansion on click, and the name cell keeps a `<button>` with `aria-expanded`/`aria-controls` so the row stays keyboard-operable; action controls stop event propagation so activating them never toggles the row. The expanded detail spans the row with the comment on the left and the "Изменить" action at the right. Rows use the secondary surface token for a hover highlight. Default sort is `watchedAt` descending.

- Why: a table gives native row/column semantics, whole-row selection satisfies the requested interaction, and keeping a named button preserves keyboard and screen-reader access.
- Alternative: a CSS grid of `<div>`s with `role="table"` (rejected: reimplements what `<table>` gives for free).

### Delete confirmation as a separate dialog opened from the row

The expanded row carries a "Удалить" action. Activating it opens a `Modal` confirmation ("Удалить запись?" with «Удалить»/«Отмена»); confirming invokes the record store's remove and closes, cancelling just closes. Because the action lives in the row and the edit modal blocks the row while open, the two dialogs are never open at the same time.

- Why: the requester wants a confirmation before deletion, and a dialog that does not interfere with the edit modal. Never nesting the dialogs keeps the existing focus trap and Escape handling correct without touching `modal.tsx`.
- Alternative: a nested confirmation inside the edit modal (rejected: two concurrent focus traps and Escape handlers, and a change to the shared primitive).

### Sort comparators per column, client-side

Sort in a `useMemo` over the filtered records with a `{ key, direction }` state: Название by `localeCompare`, Оценка numerically (0/empty treated as no rating), Дата просмотра by the ISO `watchedAt` string (lexicographic equals chronological). Default `{ key: 'watchedAt', direction: 'desc' }`.

- Why: the list is small and local; no server or persistence involvement.

## Risks / Trade-offs

- Dropdown content is hidden while closed, so tests must open a selector before querying its checkboxes → update `tests/unit/search.test.tsx` and `tests/unit/screens.test.tsx` to open the relevant `<details>` first.
- The delete action moves out of the edit form, so `RatingForm.tsx`/`RecordModal.tsx` `onDelete` is no longer wired from My Films → remove that wiring there while leaving Home's `RecordModal` (which already omits it) untouched.
- Whole-row `onClick` plus in-row action buttons can double-fire → call `stopPropagation` on the edit and delete controls so they never toggle the row.
- The hover highlight must not drop text below the required contrast → use the matte secondary token rather than an ad-hoc color.
- Actor and director option lists can be tall → bound the dropdown panel height with internal scroll.
- `movieMatches` still accepts a free-text `query` argument used only by the Add-film picker; leave that path intact to avoid touching unrelated behavior.
