# catalog Specification

## Purpose
Provides TMDB-backed discovery of films and series and keeps a local catalog of only those titles users have rated, storing a minimal field set enriched server-side from TMDB.

## Requirements

### Requirement: Kind-scoped search

Search SHALL return results for one media kind at a time - films or series - and SHALL be able to narrow results by free-text title, genre, and year. Results SHALL be served from a transient, time-bounded cache when a recent response exists and SHALL otherwise be fetched from TMDB. Search SHALL NOT offer actor or director filters. Search SHALL NOT persist any result, and a cached response SHALL NOT be exposed as a catalog entry.

#### Scenario: Film search

- **WHEN** the user searches with the film kind selected
- **THEN** only films are returned

#### Scenario: Series search

- **WHEN** the user searches with the series kind selected
- **THEN** only series are returned

#### Scenario: Narrowing by title, genre, and year

- **WHEN** the user provides a title, a genre, and a year
- **THEN** only titles satisfying all of those are returned

#### Scenario: No matches

- **WHEN** the search matches nothing in TMDB
- **THEN** the results area presents an empty state with an explanation

#### Scenario: Results are not persisted

- **WHEN** a search returns results
- **THEN** no catalog entry is created for any result

#### Scenario: Recent results are reused

- **WHEN** an identical search is requested again within the cache window
- **THEN** the result is served from the transient cache without a new TMDB request

#### Scenario: Source unavailable with cached results

- **WHEN** TMDB is unavailable or exceeds its timeout and a cached result exists
- **THEN** the cached result is returned instead of an error

### Requirement: Title detail from TMDB

Opening a title SHALL present its full detail resolved within its media kind. Detail SHALL be served from a transient, time-bounded cache when a recent response exists and SHALL otherwise be fetched from TMDB; it SHALL NOT be persisted as a catalog entry. When TMDB is unavailable or exceeds its timeout and a cached detail exists, the last known detail SHALL be served.

#### Scenario: Film detail

- **WHEN** the user opens a film
- **THEN** the film's full detail is shown

#### Scenario: Series detail

- **WHEN** the user opens a series
- **THEN** the series' full detail is shown

#### Scenario: Detail is not persisted

- **WHEN** the user opens a title without rating it
- **THEN** the local catalog gains no entry for that title

#### Scenario: Recent detail is reused

- **WHEN** a title is opened again within the cache window
- **THEN** its detail is served from the transient cache without a new TMDB request

#### Scenario: Source unavailable with cached detail

- **WHEN** TMDB is unavailable or exceeds its timeout and a cached detail exists
- **THEN** the last known detail is served instead of an error

### Requirement: Server-side metadata enrichment
When a rating is saved, the system SHALL obtain the title's metadata from TMDB using the submitted media kind and external identifier, and SHALL use that metadata for the catalog entry. Metadata supplied by the client beyond the kind, identifier, rating, comment, and watch date SHALL be ignored. If TMDB has no such title, the save SHALL fail and no catalog entry SHALL be created.

#### Scenario: Minimal client payload
- **WHEN** the client saves a rating sending only the media kind, external identifier, rating, comment, and watch date
- **THEN** the stored title, year, director, and genres match TMDB

#### Scenario: Client metadata is ignored
- **WHEN** the client sends metadata that disagrees with TMDB
- **THEN** the stored catalog entry reflects TMDB, not the client

#### Scenario: Unknown title rejected
- **WHEN** the client saves a rating for an identifier TMDB does not recognize
- **THEN** the save fails and no catalog entry is created

### Requirement: Genre mapping by TMDB identifier
The system SHALL map TMDB genre identifiers to the project's genre reference data by TMDB identifier, and SHALL NOT match genres by localized name.

#### Scenario: Known genre maps by identifier
- **WHEN** TMDB reports a genre whose identifier exists in the project's genre reference data
- **THEN** the catalog entry stores the matching project genre

#### Scenario: Unknown genre identifier is dropped
- **WHEN** TMDB reports a genre identifier that is not present in the project's genre reference data
- **THEN** that genre is not stored and no new genre is created

### Requirement: Whole-series rating
Series SHALL be rated as a whole. The system SHALL NOT store or expose per-episode or per-season ratings, and series detail SHALL NOT depend on season or episode data.

#### Scenario: Whole-series rating only
- **WHEN** a user rates a series
- **THEN** the rating applies to the series as a whole

#### Scenario: No episode-level controls
- **WHEN** the user views a series
- **THEN** no per-episode or per-season rating controls are presented

### Requirement: Paged search results
Search SHALL return results one page at a time and SHALL report whether further pages exist, so a client can request the next page for the same criteria. Requesting a later page SHALL return the following set of results for the same criteria without altering the results already returned for earlier pages.

#### Scenario: A page reports whether more remain
- **WHEN** a client requests a search page
- **THEN** it receives that page of results together with an indication of whether further pages exist for the same criteria

#### Scenario: Following page is returned
- **WHEN** a client requests the page after the current one for the same criteria
- **THEN** the following set of results for those criteria is returned

#### Scenario: Past the last page
- **WHEN** a client requests a page beyond the last available one
- **THEN** no additional results are returned and the response indicates no further pages exist

### Requirement: Catalog stores only rated or planned titles

A title SHALL enter the local catalog only when a user rates it, whether as a personal rating or within a group, or adds it to their watch-later list. The catalog SHALL store, for each title: its media kind, its external TMDB identifier, title, year, director (creators for series), and genres. Searching or opening a title without rating it and without adding it to the watch-later list SHALL NOT create a catalog entry. The same kind and external identifier SHALL map to a single catalog entry.

#### Scenario: Rating creates a catalog entry
- **WHEN** the user rates a title returned by search
- **THEN** a single catalog entry for that title is stored with title, year, director, and genres

#### Scenario: Adding to the watch-later list creates a catalog entry
- **WHEN** the user adds a title returned by search to their watch-later list without rating it
- **THEN** a single catalog entry for that title is stored with title, year, director, and genres

#### Scenario: Browsing without rating stores nothing
- **WHEN** users search and open titles without rating any of them or adding any to a watch-later list
- **THEN** the local catalog remains empty

#### Scenario: Deduplication by kind and identifier
- **WHEN** more than one user rates the same title, or the same user rates it again or adds it to the watch-later list
- **THEN** the catalog still holds a single entry for that title
