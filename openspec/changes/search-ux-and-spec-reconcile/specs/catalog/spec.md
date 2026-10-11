## MODIFIED Requirements

### Requirement: Kind-scoped search
Search SHALL return results from TMDB for one media kind at a time - films or series - and SHALL be able to narrow results by free-text title, genre, and a year range. A year range SHALL have an optional lower bound and an optional upper bound, and SHALL exclude titles whose year falls outside the specified bounds. Search SHALL NOT offer actor or director filters. Search SHALL NOT persist any result.

#### Scenario: Film search
- **WHEN** the user searches with the film kind selected
- **THEN** only films are returned

#### Scenario: Series search
- **WHEN** the user searches with the series kind selected
- **THEN** only series are returned

#### Scenario: Narrowing by title, genre, and year
- **WHEN** the user provides a title, a genre, and a year range
- **THEN** only titles satisfying all of those are returned

#### Scenario: No matches
- **WHEN** the search matches nothing in TMDB
- **THEN** the results area presents an empty state with an explanation

#### Scenario: Results are not persisted
- **WHEN** a search returns results
- **THEN** no catalog entry is created for any result

## ADDED Requirements

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
