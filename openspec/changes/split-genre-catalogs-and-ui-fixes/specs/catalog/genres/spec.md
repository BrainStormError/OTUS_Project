## MODIFIED Requirements

### Requirement: Genre catalog is populated from TMDB

The system SHALL maintain two local genre catalogs synchronized from TMDB — one for film genres and one for series genres — each storing every genre of its kind with the genre's TMDB identifier and its localized name, independently of the other kind. A genre that TMDB reports for both film and series SHALL be recorded in each catalog as a separate entry, and each catalog SHALL store each genre name at most once within its kind. Both catalogs SHALL be refreshed as part of the deploy flow.

#### Scenario: Deploy refreshes the catalog

- **WHEN** a deployment runs the genre sync step
- **THEN** the film catalog contains every film genre currently returned by TMDB and the series catalog contains every series genre, each with its identifier and localized name

#### Scenario: Sync is idempotent

- **WHEN** the sync runs again against already-populated catalogs
- **THEN** existing genres are updated in place per kind and no duplicate genres are created

#### Scenario: Shared genre is recorded per kind

- **WHEN** TMDB reports the same genre identifier for both film and series
- **THEN** the film catalog and the series catalog each hold their own entry for that identifier with their own localized name

#### Scenario: Unreachable TMDB does not fail the deploy

- **WHEN** TMDB is unreachable during the sync step
- **THEN** the deployment continues and both previously stored genre catalogs are preserved unchanged

### Requirement: Stored genres are served to clients

The system SHALL expose the stored genre catalogs through a read-only interface that returns the genres of a requested media kind, each with its identifier and name, without requiring a live TMDB call. A response for one kind MUST NOT include genres that belong only to the other kind.

#### Scenario: Client lists genres

- **WHEN** a client requests the genre catalog for a media kind
- **THEN** it receives that kind's stored genres, each with its identifier and name

#### Scenario: Listing does not depend on TMDB

- **WHEN** a client lists genres while TMDB is unavailable
- **THEN** the stored genres are still returned

#### Scenario: Kinds are not mixed

- **WHEN** a client requests the genre catalog for series
- **THEN** a genre that exists only in the film catalog is not returned, and a request for films does not return a series-only genre
