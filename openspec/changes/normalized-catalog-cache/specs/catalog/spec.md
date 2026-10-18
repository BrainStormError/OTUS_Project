## MODIFIED Requirements

### Requirement: Kind-scoped search

Search SHALL return results for one media kind at a time - films or series - and SHALL be able to narrow results by free-text title, genre, and year. Results SHALL be served from a transient, time-bounded cache when a recent response exists and SHALL otherwise be fetched from TMDB. Search SHALL NOT offer actor or director filters. Search SHALL NOT persist any result, and a cached response SHALL NOT be exposed as a catalog entry.

The cached search result SHALL be indexed by the request actually sent to the catalogue source. For a free-text search the source is asked for a page of titles matching the text, and the genre and year narrowing SHALL be applied to that page afterwards; the cached result SHALL therefore be reusable across different genre and year narrowing of the same text. For a search that narrows by genre or year without free text, the narrowing is part of the request to the source and SHALL be part of the cached result's identity.

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

#### Scenario: Narrowing reuses the same cached page

- **WHEN** a free-text search is repeated within the cache window with different genre or year narrowing
- **THEN** the result is served from the same cached page without a new TMDB request and the narrowing is applied to it

#### Scenario: Filter-only search is cached per criteria

- **WHEN** a search without free text narrows by genre or year
- **THEN** its cached result is distinct from the cached result of other genre or year criteria

#### Scenario: Source unavailable with cached results

- **WHEN** TMDB is unavailable or exceeds its timeout and a cached result exists
- **THEN** the cached result is returned instead of an error

### Requirement: Title detail from TMDB

Opening a title SHALL present its full detail resolved within its media kind. The detail SHALL be served from the stored record for that title when the record already carries it, and SHALL be completed from TMDB when the stored record is missing or does not carry the full detail; the completed detail SHALL be kept as the title's record within the cache window. A title record SHALL NOT be exposed as a catalog entry. When TMDB is unavailable or exceeds its timeout and a stored record exists, the stored record SHALL be served.

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
- **THEN** its detail is served from the stored record without a new TMDB request

#### Scenario: A record found by search is completed on open

- **WHEN** the user opens a title whose record was stored from a search result and does not carry the full detail
- **THEN** the full detail is fetched from TMDB once, kept as the title's record, and shown

#### Scenario: Source unavailable with cached detail

- **WHEN** TMDB is unavailable or exceeds its timeout and a stored record exists
- **THEN** the stored record is served instead of an error

### Requirement: Server-side metadata enrichment

When a rating is saved or a title is added to the watch-later list, the system SHALL obtain the title's metadata from the cached record for that title, identified by the submitted media kind and external identifier. Metadata supplied by the client beyond the kind, identifier, rating, comment, and watch date SHALL be ignored. A catalogue source SHALL be contacted only when no record exists for that title, and its result SHALL be kept as the title's record. If no record exists and the catalogue source does not recognise the title, the save SHALL fail and no catalog entry SHALL be created.

#### Scenario: Minimal client payload

- **WHEN** the client saves a rating sending only the media kind, external identifier, rating, comment, and watch date
- **THEN** the stored title, year, and genres match the catalogue source

#### Scenario: Client metadata is ignored

- **WHEN** the client sends metadata that disagrees with the catalogue source
- **THEN** the stored catalog entry reflects the catalogue source, not the client

#### Scenario: Saving a title found by search contacts no source

- **WHEN** the client saves a rating for a title whose record was stored while rendering results
- **THEN** no catalogue request is made and the catalog entry is created from the stored record

#### Scenario: Unknown title rejected

- **WHEN** the client saves a rating for an identifier the catalogue source does not recognise
- **THEN** the save fails and no catalog entry is created

### Requirement: Catalog stores only rated or planned titles

A title SHALL enter the local catalog only when a user rates it, whether as a personal rating or within a group, or adds it to their watch-later list. The catalog SHALL store, for each title: its media kind, its external TMDB identifier, title, year, and genres. Searching or opening a title without rating it and without adding it to the watch-later list SHALL NOT create a catalog entry. The same kind and external identifier SHALL map to a single catalog entry.

#### Scenario: Rating creates a catalog entry

- **WHEN** the user rates a title returned by search
- **THEN** a single catalog entry for that title is stored with title, year, and genres

#### Scenario: Adding to the watch-later list creates a catalog entry

- **WHEN** the user adds a title returned by search to their watch-later list without rating it
- **THEN** a single catalog entry for that title is stored with title, year, and genres

#### Scenario: Browsing without rating stores nothing

- **WHEN** users search and open titles without rating any of them or adding any to a watch-later list
- **THEN** the local catalog remains empty

#### Scenario: Deduplication by kind and identifier

- **WHEN** more than one user rates the same title, or the same user rates it again or adds it to the watch-later list
- **THEN** the catalog still holds a single entry for that title
