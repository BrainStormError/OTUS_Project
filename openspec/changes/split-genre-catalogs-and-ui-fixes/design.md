## Context

See proposal.md - Why. Current state that shapes the approach:

- Genre reference data lives in `genres(id, name UNIQUE)` plus `genre_kinds(genre_id,
  kind)`: one row per TMDB id across both TMDB namespaces. `scripts/sync-genres.cjs`
  merges the movie and TV lists by id and silently drops an id whose localized name
  collides with an already stored name (`UNIQUE(name)` violation).
- `GET /api/genres` without `kind` returns the merged list; `home-screen.tsx` loads
  exactly that once and feeds it to the search panel for both kinds, which is the
  reported symptom (film genres offered while searching series). `AddRecordModal` and
  `GroupRatings` fetch `/api/genres?kind=` after opening instead of carrying options
  with the screen's initial data.
- `resolveSaveMetadata` keeps genre ids via `listKnownGenreIds()` — all ids of either
  kind — and genre names resolve through the merged map, so a cross-kind id can stick
  to a media row and render the other kind's name.
- `computeProfileStats` (profiles/service.ts) aggregates films and series into one
  `UserStats { count, genres, years }`; the years list is sorted `b.year - a.year`, so
  the "Любимый год" card (which reads `years[0]`) shows the newest release year, not
  the most-watched one. Genre sorting by count is already correct.
- Group stats never existed: `GroupSummary` has no stats field and `toGroup`
  (adapters.ts) hardcodes `EMPTY_STATS`; the Статистика tab renders that stub. Group
  ratings data (`GroupRatingSummary[]` from the Оценки tab) is already part of the
  group read payload, and saving a rating already triggers `invalidateReads([groupRead])`.
- `RecordsTable`'s expanded detail cell has `px-4 pb-3` (no top padding), so the
  comment and actions crowd the header row. `WatchlistTable` rows lack the
  `hover:bg-secondary` highlight `RecordsTable` rows have.
- Timezone handling: `preferences.ts` stores an optional `timezone` override in
  `localStorage` (`TimezoneSelect`, `useTimeFormat`, `resolveTimeZone`); the browser
  zone is already the default and the fallback.

## Goals / Non-Goals

**Goals:**

- Kind isolation of genre reference data at every layer: storage, sync, save-time
  resolution, name resolution, and filter options.
- Statistics that count films and series separately and pick the favourite year by
  watch count, for profiles and groups alike, always current after a rating save.
- The listed visual fixes without changing interaction behavior.

**Non-Goals:**

- Re-fetching TMDB metadata for existing media rows to repair cross-kind genre ids
  already stored on them (unknown ids keep being dropped at name resolution, per the
  existing catalog rule).
- Per-kind genre/year distribution panels — the distributions stay merged; only the
  counters split by kind.
- Any change to rating, watchlist, group, or discussion behavior beyond stats.
- Average-rating statistics (still excluded by the screens spec).

## Decisions

1. **Two kind-scoped tables: `film_genres(id, name)` and `series_genres(id, name)`.**
   Each holds one TMDB namespace, with `UNIQUE(name)` per table and raw TMDB ids as
   PK. `media.genre_ids smallint[]` stays as-is; the media row's own `kind` decides
   which dictionary resolves it. Alternatives considered: (a) keep `genres` +
   `genre_kinds` and only fix the Home filter — rejected because the shared id/name
   namespace is what makes cross-kind leakage possible and what drops colliding names
   at sync; (b) one table keyed `(kind, id)` — equivalent but keeps lookup joins and
   the same mental model that caused the bug; two tables make "which dictionary does
   this id belong to" structural. Cost: shared TMDB ids (e.g. 18 Драма) are stored
   twice — negligible (two ~20-row tables).
2. **Sync writes each TMDB list into its own table** (`sync-genres.cjs`), with no
   cross-kind name uniqueness, so no id is ever skipped for a name collision. The
   in-process cache keeps its current shape: `TtlCache` keyed `'film' | 'series'`
   (the `'all'` key disappears with the merged list). The `/api/genres?kind=` contract
   is unchanged; the no-`kind` form returns the two lists instead of a merged one or
   is narrowed to require `kind` (implementation detail, see Open Questions).
3. **Genre options ride with the screen's initial data.** Home loads both per-kind
   catalogs through the read store (`/api/genres?kind=film` and `?kind=series`) and
   `HomeView` swaps the option list when the kind changes — no refetch. `AddRecordModal`
   and `GroupRatings` receive options from their parent screen instead of fetching on
   open. This satisfies the already-written `catalog/genres` requirement ("options
   together with the initial render") and makes a cross-kind selection impossible.
4. **Save-time resolution is kind-scoped:** `listKnownGenreIds(kind)` filters against
   the media kind's dictionary inside `resolveSaveMetadata`, and name resolution for a
   stored row uses that kind's map. A TMDB-reported id missing from the kind's
   dictionary is dropped, as today.
5. **Statistics payload shape:**
   `UserStats = { films: number; series: number; genres: GenreCount[]; years: YearCount[] }`.
   `films`/`series` count watched records (profile) or unique rated media (group);
   `genres`/`years` stay merged distributions over the same population, each sorted by
   count descending (years tie-broken by newer year), so `years[0]` is the
   most-watched release year — the favourite-year fix. `StatisticsView` renders four
   cards: «Всего фильмов», «Всего сериалов», «Любимый жанр», «Любимый год», keeping
   the two distribution panels. Alternatives: per-kind `KindStats` blocks (more UI
   churn than asked); keeping `count` and adding only a series counter (leaves the
   mixed "films" total ambiguous).
6. **Group stats are computed on read, not stored.** `listGroupRatings` already
   returns per-media rows with kind, title, year, and the media genres; aggregating
   them server-side into `UserStats` and attaching it to the group read payload gives
   the Статистика tab real data with no new table and no cache to invalidate: the
   existing `invalidateReads([groupRead(groupId)])` after a rating save refetches, and
   the recomputed aggregate is by definition current. This satisfies "пересчёт при
   добавлении оценки" without triggers or denormalized counters.
7. **Cosmetic fixes stay trivial:** top padding (`pt-3`) on the expanded detail cell,
   `hover:bg-secondary` on watch-later rows, and a centered footer with three lines
   (project, `v1.0`, TMDB) — wording: «Данные о фильмах и сериалах предоставлены
   TMDB», satisfying "просто, что интеграция есть".
8. **Timezone is always the browser's:** delete `TimezoneSelect` and the `timezone`
   `localStorage` key handling; `resolveTimeZone`/`currentDateInTimeZone`/`formatTimestamp`
   use `Intl.DateTimeFormat().resolvedOptions().timeZone` unconditionally (the option
   parameter becomes unused and is dropped). A stale stored key is ignored — no
   migration needed. `HourCycleSelect` stays as the only time control.

## Risks / Trade-offs

- [Existing media rows may carry cross-kind genre ids from the unscoped save filter]
  → Name resolution drops unknown-for-this-kind ids (existing behavior); re-resolving
  old rows from TMDB is explicitly out of scope. Counts in statistics are unaffected
  (they use year and genre names actually resolved).
- [Two tables duplicate shared genre names across kinds] → Intended: film «Боевик» and
  series «Боевик и приключения» are distinct entries and now both offerable in their
  kind; favourite genre may split a formerly merged count — acceptable, names differ
  in TMDB anyway.
- [Home now issues two genre reads instead of one] → Both are client-cacheable
  (`CACHE_CATALOG`), served from the in-process cache; negligible.
- [Tests and seed fixtures assume the merged `genres`/`genre_kinds` schema] → The
  task list updates `seed-dev.ts`, `migrations.test.ts`, catalog/profiles/group
  integration tests and the affected unit tests in the same change.
- [Footer/TMDB wording is a product-text decision] → Fixed wording is proposed above;
  changing a sentence later costs nothing structural.

## Migration Plan

1. Up migration: create `film_genres` and `series_genres`, copy rows from `genres`
   joined with `genre_kinds` (kind 0 → film, kind 1 → series; an id in both kinds is
   copied into both tables), then drop `genre_kinds` and `genres`. `media.genre_ids`
   needs no rewrite — ids are already raw TMDB ids and are now interpreted per kind.
2. Down migration: rebuild `genres` as the union of both tables (id, film name
   preferred) and `genre_kinds` from which tables each id came.
3. Deploy runs the existing genre sync step afterwards; it repopulates both tables
   from TMDB, restoring any id previously lost to a name collision.
4. Rollback: the down migration restores the merged schema; the sync step keeps
   working against it (recorded as the compatibility path, not maintained behavior).

## Open Questions

- Whether `/api/genres` without `kind` keeps returning both lists (convenient for
  Home's single initial read) or is narrowed to require `kind`. Does not affect the
  storage split or the spec deltas; decide at implementation time.
