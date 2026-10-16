## MODIFIED Requirements

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
