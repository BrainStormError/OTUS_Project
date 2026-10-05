## Why

Search on Home and My Films currently shows two entry points at once — a free-text query field with a "Найти" button and a separate collapsible "Фильтры" block — and My Films derives its filter options from the whole catalog, offering genres, actors, and years the user has never watched. The watched action on Home cards does nothing, and the 0.5 rating step is coarser than the data model supports. This change consolidates search into a single filter panel, scopes My Films options to what was actually watched, makes the Home watched action real, and refines the rating step.

## What Changes

- Remove the standalone free-text search input line on Home and My Films; search is performed entirely through the filter panel.
- Rename the filter panel summary from "Фильтры" to "Поиск"; keep the existing removable-filter chips and reset.
- Home applies the filter values when the "Найти" button is pressed (submit); My Films continues to filter live as filter values change.
- Add a **Режиссёр** filter alongside title, genre, actor, and year.
- My Films: the genre, actor, director, and year options are limited to values present among the user's already-watched films; the title filter stays a free-text input. Home keeps catalog-wide options.
- Home film cards: the "Отметить просмотренным" action opens the rating form for that card's film (no film picker); saving creates a watched record that appears in My Films. Cards already watched open the same form.
- Home film cards: once watched, a small check badge appears in the card corner, showing "Просмотрено" on hover (display-only status, not a control).
- Change the rating input step from 0.5 to 0.1 (number input and range slider).

**BREAKING** (spec-level): the requirement that Home and My Films provide a separate search field with a free-text query is replaced by filter-driven search; the film-card watched action is redefined to open the rating form; the filter set gains a director.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui/screens`: Home and search screen (filter-driven submit search, no separate field), Search with filters (add director), My Films screen (options scoped to watched films, filter-driven live filtering), Film card (watched corner badge with hover label), Rating and comment form (0.1 step).
- `ui/navigation`: Tab-local search — Home and My Films provide search through the filter panel rather than a separate search field.

## Impact

- **Presentation layer only.** No backend, TMDB integration, authorization, or persistence changes; watched records remain in `localStorage`.
- **Data additions (presentation fixtures):** a `director` field on `Movie` and sample directors for the catalog films; a `director` entry in `SearchFilters`/`FilterKey`.
- **Affected code:** `src/components/features/movie-tracker/SearchField.tsx`, `FilterChips.tsx`, `HomeView.tsx`, `MyFilmsView.tsx`, `RatingForm.tsx`, `MovieCard.tsx`, `data.ts`, `types.ts`.
- **Tests:** `tests/unit/search.test.tsx`, `tests/unit/screens.test.tsx`, `tests/unit/ui-primitives.test.tsx`.
- **Sequencing:** the base `ui/screens` and `ui/navigation` behavior comes from the completed but unarchived `ui-search-and-my-films` change. That change must be archived before this one so both deltas apply in order.
