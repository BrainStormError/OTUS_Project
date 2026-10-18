## Why

Genre filtering mixes the two TMDB genre namespaces: the Home search panel loads the
merged genre list once and offers film genres while searching series (and the reverse),
so most genre filters return nothing. Beyond that symptom bag of UI defects has
accumulated: profile statistics count films and series as one "films" total and show
the newest release year instead of the most-watched one, group statistics are a
hardcoded empty stub, the expanded record row has no top spacing so its comment and
actions crowd the header row, the watch-later table lacks the row hover the watched
table has, the footer is misaligned and still labelled v0.1.0, and the timezone
selector in settings is an unnecessary knob when the browser's zone is always correct.

## What Changes

- **Genre reference data is split into two kind-scoped catalogs.** Film genres and
  series genres become two independent dictionaries (own TMDB ids and names per kind),
  replacing the single `genres` table plus `genre_kinds` membership. Media genre ids
  resolve inside their own kind's dictionary. **BREAKING** data model change with a
  migration that rebuilds the reference data from the current rows.
- **Genre options are always scoped to the selected kind.** Home, add/search modals,
  and every other genre filter offer exactly the selected kind's catalog, switching
  when the kind switches; search by an id from the other kind becomes impossible.
  Options arrive with the screen's initial data instead of a follow-up request.
- **Profile statistics show films and series separately.** Two counters (films,
  series) replace the single mixed "Всего фильмов" counter; the favourite-year card
  shows the release year with the most watched records (currently it shows the newest
  release year because the year list is sorted by year instead of count).
- **Group statistics are computed from the Оценки tab.** The Статистика tab shows the
  same shape (per-kind counters, favourite genre, favourite year, distributions) over
  the group's rated media, computed server-side with the group read, so saving a rating
  refreshes it through the existing read invalidation.
- **Expanded record rows get top spacing.** The comment and its actions move visually
  below the header row edge instead of crowding it.
- **Watch-later rows highlight on hover** exactly like the watched table rows.
- **Footer is centered and updated.** Centered rows, version v1.0, and a line stating
  that the project is integrated with TMDB.
- **BREAKING (settings): the timezone selector is removed.** Moments in time are always
  shown in the browser/OS timezone; the 12/24-hour choice stays.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `catalog/genres`: the reference data becomes two kind-scoped catalogs (film and
  series) instead of one catalog with kind membership; options served to clients are
  always the selected kind's catalog.
- `catalog`: genre mapping by TMDB identifier resolves against the media kind's own
  catalog, so a genre id valid only for the other kind is never offered or stored.
- `ui/screens`: statistics presentation gains per-kind counters and a most-watched
  favourite year, group statistics come from the Оценки tab, the watch-later tab gains
  the row hover highlight, and the settings screen no longer offers a timezone selector.
- `ui/time-preferences`: the timezone is always the browser's; the manual timezone
  preference and its persistence are removed.

## Impact

- **DB / scripts:** migration replacing `genres` + `genre_kinds` with two kind-scoped
  tables; `media.genre_ids` re-resolution per kind; `scripts/sync-genres.cjs` writes two
  catalogs; `scripts/seed-dev.ts` seeds both.
- **Server:** `src/modules/catalog` (repository, service, types), `GET /api/genres`
  (per-kind payloads), `src/modules/profiles` (stats split and favourite-year fix),
  `src/modules/groups` + ratings (group stats in the group read payload).
- **Client:** `home-screen.tsx` (per-kind genre options), `AddRecordModal` /
  `GroupRatings` (options with initial data), `StatisticsView` / `StatCard`,
  `adapters.ts`, `RecordsTable` (top spacing), `WatchlistTable` (hover), `footer.tsx`,
  `SettingsView` / `TimezoneSelect` removal, `preferences.ts` (drop stored timezone).
- **Tests:** unit (filters, stats, tables, preferences), integration (genres, profiles,
  group ratings), e2e (settings, tables) updated to the new shapes.
