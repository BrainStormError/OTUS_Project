## Context

See `proposal.md` — Why. The current UI comes from the completed `ui-search-and-my-films` change: `SearchField.tsx` renders a free-text query input with a "Найти" button plus a collapsible `Фильтры` panel (title/genre/actor/year) and removable chips; `HomeView.tsx` commits the query+filters on submit; `MyFilmsView.tsx` filters live and derives options from the whole catalog (`listGenres()`, `POPULAR_ACTORS`); `MovieCard.tsx` renders a watched button whose `onToggleWatched` is never passed on Home; `RatingForm.tsx` uses `RATING_STEP = 0.5`. Watched records live in `localStorage` (`record-store.ts`) merged with sample data (`data.ts`), and `Movie` has no director field.

Constraint: `ui-search-and-my-films` is complete but unarchived, so the base `ui/screens` and `ui/navigation` requirements this change modifies still read as the pre-change text in `openspec/specs/`. This change's deltas carry the full final text, so the outcome is correct provided `ui-search-and-my-films` is archived first.

## Goals / Non-Goals

**Goals:**

- One search entry point per section: the filter panel, renamed "Поиск".
- Home applies filters on submit; My Films filters live.
- Director filter; filter options scoped to watched films on My Films.
- Home card watched action opens the rating form and creates/updates a record.
- Watched corner indicator on cards with a hover label.
- Rating step 0.1.

**Non-Goals:**

- No change to Friends/Groups search or to the shell, theme, or persistence.
- No separate add screen; no new backend or catalog source.
- No redesign of My Films list rows, filters chips, or the statistics screens.

## Decisions

### Single filter-panel search; remove the free-text query line

`SearchField` drops the top form's free-text `Input` and the `value`/`onChange` query props. The existing `<details>` panel becomes the sole search UI, its summary renamed "Фильтры" → "Поиск", and the title filter is its free-text entry. Home keeps a "Найти" button (submit) that commits the current filter values; My Films omits submit and filters live on every filter change.

- Why: the requirement removes the search line while keeping filters, and the title filter already covers name search.
- Alternative: keep a query field and only relabel the panel (rejected by requirement).
- Consequence: `movieMatches` no longer needs the free-text `query` argument where only filters are used; the Add-film picker keeps its own free-text input.

### Option sourcing through a `movies` prop

`SearchField` gains a `movies: Movie[]` prop and derives genre, actor, director, and year options from it. Home passes `listMovies()`; My Films passes `mergeWithSample(...).map(r => r.movie)`. The year control changes from a number input to a `<select>` of available years, matching "all fields except title". Title stays a free-text input.

- Why: scoping is data-driven and avoids a per-screen fork of the component.
- Alternative: two filter components (rejected: duplication and drift).

### Director as an optional string on `Movie`

Add `director?: string` to `Movie`, a `director` key to `SearchFilters`/`FilterKey`, a label in `FilterChips.FILTER_LABELS`, and a case-insensitive contains check in `movieMatches`. Fill sample directors for the eight catalog films as demo fixtures.

- Why: smallest addition consistent with `actors`; there is no external director source.
- Alternative: an array of directors (rejected: requirement and data have a single director per film).

### Home watched action reuses the rating form

Extract the add/edit rating modal used by My Films so Home can reuse it: the Home card's watched action opens the form with the card's film fixed (no film picker); saving upserts a watched record that then appears in My Films. Already-watched cards open the same form to edit.

- Why: requirement mirror; reuses `RatingForm` and the existing modal, and the film is already known.
- Alternative: navigate to the film detail page (rejected: requirement asks for the modal flow).

### Watched corner indicator

`MovieCard` renders a small check badge on the poster corner when `watched` is true, with a native `title="Просмотрено"` and an accessible label. It is display-only; the watched action remains the button.

- Why: simplest accessible way to satisfy "check in the corner, label on hover".
- Alternative: a custom tooltip layer (rejected: extra code, no requirement for styling).

### Rating step 0.1

`RATING_STEP` changes from 0.5 to 0.1; the number input and range slider both read it.

### Capability base and archive ordering

The `ui/navigation` delta modifies the "Tab-local search" requirement introduced by `ui-search-and-my-films`; until that change is archived, `openspec validate` reports an INFO that the base requirement is absent. Archive `ui-search-and-my-films` first, then this change.

- Why: this change refines the search behavior that change introduced.
- Alternative: declare the requirement as new (rejected: duplicates the base).

## Risks / Trade-offs

- Removing the query prop breaks tests that type into the Home/My Films `searchbox` → update `search.test.tsx` and `screens.test.tsx` to drive filters and the "Найти" button instead.
- My Films options must recompute when records change → derive them inside the component from the merged list (a `useMemo`), not from module-level constants.
- Director fixtures are synthetic demo data → keep them clearly in `data.ts`; no behavior depends on specific values beyond filtering.
- The watched badge could be mistaken for a toggle → keep it non-interactive with a `title`/label and leave the button as the control.
- Archive ordering is easy to miss → record it in `tasks.md` and verify `openspec list --specs` after archiving `ui-search-and-my-films`.
