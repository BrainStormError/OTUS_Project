# catalog Specification

## Purpose
Provides TMDB-backed discovery of films and series and keeps a local catalog of only those titles users have rated, storing a minimal field set enriched server-side from TMDB.

## Requirements

### Requirement: Kind-scoped search
Search SHALL return results from TMDB for one media kind at a time - films or series - and SHALL be able to narrow results by free-text title, genre, and year. Search SHALL NOT offer actor or director filters. Search SHALL NOT persist any result.

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

### Requirement: Title detail from TMDB
Opening a title SHALL present its full detail obtained live from TMDB, resolved within its media kind, and SHALL NOT persist that detail.

#### Scenario: Film detail
- **WHEN** the user opens a film
- **THEN** the film's full detail is fetched from TMDB and shown

#### Scenario: Series detail
- **WHEN** the user opens a series
- **THEN** the series' full detail is fetched from TMDB and shown

#### Scenario: Detail is not persisted
- **WHEN** the user opens a title without rating it
- **THEN** the local catalog gains no entry for that title

### Requirement: Catalog stores only rated titles
A title SHALL enter the local catalog only when a user rates it, whether as a personal rating or within a group. The catalog SHALL store, for each title: its media kind, its external TMDB identifier, title, year, director (creators for series), and genres. Searching or opening a title without rating it SHALL NOT create a catalog entry. The same kind and external identifier SHALL map to a single catalog entry.

#### Scenario: Rating creates a catalog entry
- **WHEN** the user rates a title returned by search
- **THEN** a single catalog entry for that title is stored with title, year, director, and genres

#### Scenario: Browsing without rating stores nothing
- **WHEN** users search and open titles without rating any of them
- **THEN** the local catalog remains empty

#### Scenario: Deduplication by kind and identifier
- **WHEN** more than one user rates the same title, or the same user rates it again
- **THEN** the catalog still holds a single entry for that title

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
