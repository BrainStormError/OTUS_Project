## Context

See `proposal.md` — Why. Constraints that shape the approach:

- **Year control** (`src/components/features/movie-tracker/SearchField.tsx`): `YearRangeFilter` renders two `YearBound`s; each `YearBound` has `Minus`/`Plus` icon buttons and a `step(delta)` that, from an empty value, sets `new Date().getFullYear()` and clamps to `YEAR_MIN = 1800` / `YEAR_MAX = 2200`. The range row is `flex items-center gap-2` (no wrap) inside the filter grid `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`, which responds to viewport width, not to the panel's own width. The same `SearchField` is shared by Home, the add modals, group ratings, and both "My" views.
- **Live filter match** (`filters.ts`): `movieMatches(movie, filters)` evaluates `inYearRange(movie.year, ...)`, i.e. the release year. `MyFilmsView.tsx:68` and `MySeriesView.tsx:68` call it per record, so the live year filter keys off release year even though those screens list watch dates.
- **Record shape** (`types.ts`): `WatchedRecord.watchedAt` is a `YYYY-MM-DD` string, already used as the default sort key via `localeCompare`.
- **Group ratings table** (`GroupRatings.tsx:180`): the `<table>` carries `overflow-hidden`, so at narrow widths it clips its third column instead of scrolling. My Films/My Series already wrap their table in `overflow-x-auto`.
- **Dialog geometry** (`Modal`): `size="wide"` is `sm:max-w-2xl` (672px) with `p-4` (~640px usable). With `lg:grid-cols-3`, each cell is ~205px, narrower than the range row's ~218px minimum content when the steppers are present — the source of the overflow. Removing the steppers removes almost all of it; wrapping removes the rest.
- **Specs**: `ui/screens` and `ui/design-system` describe the current behavior; the deltas in this change bring them to the target behavior. Note that the complete-but-not-yet-archived `search-ux-and-spec-reconcile` change also touches `ui/screens`; the delta here is authored against that change's resulting (code-accurate) requirement text.

## Goals / Non-Goals

**Goals:**
- Year bounds are plain numeric inputs; no increment/decrement controls.
- A bound typed above the current calendar year is accepted while typing and reset to the current calendar year when the field is committed.
- Entering a lower bound above the upper bound clears the upper bound; otherwise the upper bound is preserved.
- The year range sits on its own row beneath the title and genre fields with the hints "с" and "по", and its active block reads "с X по Y" with each bound individually removable.
- My Films and My Series match the year against the record's watch date and label the field "год просмотра"; Home and the add/group search keep release-year matching labelled "Год".
- No content is clipped or overflows its container from 320px to 1440px.

**Non-Goals:**
- Changing the catalog/TMDB search API, its year-range parameters, or server-side filtering.
- Replacing the from–to range with a dropdown, multi-select, or slider.
- Reworking tables into cards on mobile; horizontal scroll stays the mechanism.
- Any JavaScript resize/breakpoint observer; CSS breakpoints only.

## Decisions

### D1 — Year bound becomes a manual input that resets an over-cap year on commit
`YearBound` renders only the numeric `Input` (drop the two `Button`s, the `Minus`/`Plus` imports, and `step()`). The input keeps `max` set to the current calendar year for native affordance, but typing above it is allowed; an `onBlur` handler resets a committed value above the cap to the current calendar year and otherwise leaves it as typed. `YearRangeFilter` and `SearchField` pass the cap down so both bounds share it.

- *Why:* matches "manual entry only" plus the user's rule to accept an over-current-year entry and then reset it to the current year. Enforcing on blur (not per keystroke) lets the user finish typing before the field corrects itself, and keeps the controlled value within the cap once committed.
- *Alternatives:* keep the steppers and clamp them only (rejected — the user wants them removed); ignore the over-cap keystroke in `onChange` (rejected — the user wants to be able to enter the year and see it reset, not have the keystroke silently dropped); show a validation error for an over-cap year (rejected — resetting avoids an invalid state entirely).

### D2 — Inverted range resolved in the setter by clearing the upper bound
The "от" setter (`setYearFrom`) parses the new lower bound; if an upper bound exists and the lower is greater, it calls `onFiltersChange` once with both `yearFrom` and `yearTo: undefined`; otherwise it only sets `yearFrom`. The `invalidRange` alert and the disabled "Найти" are removed, since the range can no longer become invalid.

- *Why:* the user's rule is "clear 'до' only when 'от' > 'до', otherwise keep it"; resolving at input time keeps the controlled value always valid.
- *Alternatives:* keep the inverted-range rejection and message (rejected — the new rule auto-resolves instead of blocking).

### D3 — Watch-year matching for the My views
Add a helper that extracts the year from a `watchedAt` string and a record-level matcher in `filters.ts` that applies title/genre filtering plus a year range against that watch year. `MyFilmsView` and `MySeriesView` switch to the record matcher; Home, the add modals, and group ratings keep `movieMatches` (release year).

- *Why:* the filter must reflect what each screen lists; `watchedAt` is already present on every record and is the default sort key.
- *Alternatives:* branch on screen inside `movieMatches` (rejected — it takes a `Movie`, not a record); add a synthetic year field to records (rejected — unnecessary data change).

### D4 — Configurable year label via a `yearLabel` prop
Add `yearLabel?: string` to `SearchField` (default `'Год'`), used for the field label and the active-filter chip block. `MyFilmsView`/`MySeriesView` pass `'год просмотра'`. The chip block keeps its `yearFrom` key and remove semantics.

- *Why:* one shared component with per-screen wording and no fork.
- *Alternatives:* separate search components per screen (rejected — duplicates the panel).

### D5 — Year range moves to its own row beneath title and genre
Change the filter grid from `sm:grid-cols-2 lg:grid-cols-3` to `sm:grid-cols-2` and give the year range `sm:col-span-2`, so the title and genre fields share the first row and the year range occupies a full-width row beneath them. Replace the `—` separator with the field hints `с` and `по` (as the two inputs' placeholders). The range row keeps `flex flex-wrap items-center gap-2` so the two bounds still stack if the panel is very narrow.

- *Why:* the user wants the year field moved under "название" and "жанры" with "с"/"по" hints; a full-width row also removes the overflow the old three-column cell caused.
- *Alternatives:* keep the range in the third column and only wrap (rejected — the user asked for the field to move under title/genre); render "с"/"по" as static labels instead of placeholders (rejected — the user asked for hints, which are placeholder affordances).

### D6 — Group ratings table scrolls
Wrap the `GroupRatings` `<table>` in a `div.overflow-x-auto` and drop `overflow-hidden` from the table, keeping `rounded-lg border` on the wrapper, matching My Films/My Series.

- *Why:* enforces the existing "wide content scrolls" requirement and matches the sibling tables.
- *Alternatives:* switch to a card layout on mobile (rejected — out of scope).

### D7 — Year chip block reads "с X по Y" with per-bound removal
Add an optional `prefix?: string` to `ChipValue` in `FilterChips.tsx` and render it immediately before the value label. The year block (key `yearFrom`) emits `{ value: 'from:<year>', label: '<year>', prefix: 'с ' }` and `{ value: 'to:<year>', label: '<year>', prefix: 'по ' }`, so the block reads "с 2000 по 2010" while each bound keeps its own remove control. `removeFilter` keeps its existing `from:`/`to:` handling, and the remove `aria-label` keeps using the plain year label.

- *Why:* the user wants the year values shown as "с X по Y" (variant C: one block, a remove control after each number). The prefix keeps the generic component in charge of layout while the year-specific text stays in `SearchField`.
- *Alternatives:* a single value that removes the whole range (rejected — the user chose per-bound removal); branch `FilterChips` on the year key (rejected — a generic `prefix` avoids a special case).

### D8 — Over-cap year reset in the year setters
Move the cap enforcement out of `YearBound`'s `onChange` and into a blur path: on blur, if the field's parsed value exceeds the current year, call the bound's setter with the current year; otherwise leave the value. The lower bound setter keeps resolving an inverted range by clearing the upper bound, so a reset lower bound also re-evaluates the range.

- *Why:* the user rule is "allow entering a value above the current year, then reset it to the current year" — a commit-time reset matches that and keeps one place (the setter) owning range validity.
- *Alternatives:* clamp per keystroke (rejected — fights typing); clamp only in `YearBound` (rejected — the setter must re-check the inverted-range rule after a reset).

## Risks / Trade-offs

- [Allowing an over-current-year entry could briefly show an impossible year] → the value resets to the current year on blur, before any search is applied meaningfully, and the cap is a deliberate product rule; no stored data is affected.
- [Switching the My-view filter could regress Home/add filtering] → `movieMatches` stays unchanged for release-year screens; only the two My views use the record matcher; unit tests cover both paths.
- [Moving the year to its own row changes the panel height] → accepted; the panel is already a stacked section and the own row removes the narrow-width overflow.
- [The "с X по Y" year block breaks existing chip test queries] → tests are updated in this change; the chip block `data-testid` stays `filter-block-yearFrom` and each remove `aria-label` keeps the plain year.
- [Existing tests assert silent rejection of an over-cap year] → those tests are rewritten to assert the blur reset to the current year.
- [Existing tests assert the stepper buttons and the "от"/"до" hints] → those tests are rewritten to assert manual entry, the current-year reset, the clear-upper rule, and the "с"/"по" hints.

## Migration Plan

No data or schema migration.

1. Update `filters.ts`, `SearchField.tsx`, `FilterChips.tsx`, `MyFilmsView.tsx`, `MySeriesView.tsx`, and `GroupRatings.tsx` together.
2. Update the unit tests; run `npm run lint`, `npm run typecheck`, and `npm test`.
3. Walk the app at 320/375/768/1024/1440 px: confirm no steppers, the year range on its own row with "с"/"по" hints, the blur reset of an over-current-year entry, the clear-upper rule on an inverted "от", the "с X по Y" chip with per-bound removal, watch-year filtering on My Films/My Series with the "год просмотра" label, and a scrolling group ratings table.
4. Rollback: revert the app image; no persisted state changes.

## Open Questions

- None blocking.
