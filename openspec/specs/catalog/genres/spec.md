# catalog/genres Specification

## Purpose
Maintains a local catalog of film and TV genres synchronized from TMDB, so screens can offer the complete genre list and resolve genre names without depending on a live TMDB genre request.

## Requirements

### Requirement: Genre catalog is populated from TMDB
The system SHALL maintain a local genre catalog that is populated from TMDB and covers both film and TV genres, storing each genre's identifier and its localized name. The catalog SHALL be refreshed as part of the deploy flow.

#### Scenario: Deploy refreshes the catalog
- **WHEN** a deployment runs the genre sync step
- **THEN** the local genre catalog contains every film and TV genre currently returned by TMDB, each with its identifier and localized name

#### Scenario: Sync is idempotent
- **WHEN** the sync runs again against an already-populated catalog
- **THEN** existing genres are updated in place and no duplicate genres are created

#### Scenario: Unreachable TMDB does not fail the deploy
- **WHEN** TMDB is unreachable during the sync step
- **THEN** the deployment continues and the previously stored genre catalog is preserved unchanged

### Requirement: Stored genres are served to clients
The system SHALL expose the stored genre catalog through a read-only interface that returns each genre's identifier and name, without requiring a live TMDB call.

#### Scenario: Client lists genres
- **WHEN** a client requests the genre catalog
- **THEN** it receives the stored genres, each with its identifier and name

#### Scenario: Listing does not depend on TMDB
- **WHEN** a client lists genres while TMDB is unavailable
- **THEN** the stored genres are still returned

### Requirement: Genre options are drawn from the catalog
Every screen that offers a genre filter SHALL draw its selectable genre options from the stored genre catalog rather than from the genres present in the current result set.

#### Scenario: Full option list offered
- **WHEN** the user opens a genre filter
- **THEN** every genre in the stored catalog is offered as a selectable option

#### Scenario: Options are stable across results
- **WHEN** the result set changes after a search
- **THEN** the offered genre options remain the full stored catalog and do not shrink to the genres of the returned titles
