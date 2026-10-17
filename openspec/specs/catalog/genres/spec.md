# catalog/genres Specification

## Purpose
Maintains a local catalog of film and TV genres synchronized from TMDB, so screens can offer the complete genre list and resolve genre names without depending on a live TMDB genre request.

## Requirements

### Requirement: Genre catalog is populated from TMDB
The system SHALL maintain a local genre catalog that is populated from TMDB and covers both film and TV genres, storing each genre's identifier, its localized name, and the media kind or kinds it belongs to. A genre that TMDB reports for both film and TV SHALL be recorded once and marked as belonging to both kinds. The catalog SHALL be refreshed as part of the deploy flow.

#### Scenario: Deploy refreshes the catalog
- **WHEN** a deployment runs the genre sync step
- **THEN** the local genre catalog contains every film and TV genre currently returned by TMDB, each with its identifier, its localized name, and the kind or kinds it belongs to

#### Scenario: Sync is idempotent
- **WHEN** the sync runs again against an already-populated catalog
- **THEN** existing genres are updated in place, their kind membership is updated, and no duplicate genres are created

#### Scenario: Unreachable TMDB does not fail the deploy
- **WHEN** TMDB is unreachable during the sync step
- **THEN** the deployment continues and the previously stored genre catalog is preserved unchanged

### Requirement: Stored genres are served to clients
The system SHALL expose the stored genre catalog through a read-only interface that returns each genre's identifier and name, scoped to a requested media kind so that only genres belonging to that kind are returned, without requiring a live TMDB call.

#### Scenario: Client lists genres
- **WHEN** a client requests the genre catalog for a media kind
- **THEN** it receives the stored genres that belong to that kind, each with its identifier and name

#### Scenario: Listing does not depend on TMDB
- **WHEN** a client lists genres while TMDB is unavailable
- **THEN** the stored genres are still returned

#### Scenario: Kinds are not mixed
- **WHEN** a client requests the genre catalog for series
- **THEN** a genre identifier that exists only for films is not returned

### Requirement: Genre options are drawn from the catalog

Every screen that offers a genre filter SHALL draw its selectable genre options from the stored genre catalog for the media kind being searched, rather than from the genres present in the current result set, so that only genres valid for that kind are offered, and SHALL receive those options together with the initial render of the screen rather than through a separate client request after the screen appears.

#### Scenario: Full option list offered

- **WHEN** the user opens a genre filter
- **THEN** every genre in the stored catalog that belongs to the selected kind is offered as a selectable option

#### Scenario: Options are stable across results

- **WHEN** the result set changes after a search
- **THEN** the offered genre options remain the full stored catalog for that kind and do not shrink to the genres of the returned titles

#### Scenario: Film-only genre not offered for series

- **WHEN** the user opens the genre filter while searching series
- **THEN** a genre that belongs only to films is not offered, so the user cannot select a genre that yields no series results

#### Scenario: Options arrive with the screen

- **WHEN** a screen that offers a genre filter is first displayed
- **THEN** its genre options are already available from the initial render and no separate client request is made to obtain them

### Requirement: Genre catalog responses are cacheable

Responses carrying the stored genre catalog MAY be cached at intermediate layers: the client MAY reuse a cached response for up to one hour, and the application process MAY serve the catalog from a short-lived in-process cache instead of reading the database on every request. Any cached copy SHALL reflect the stored catalog within one hour of a deploy-time genre sync, so a synchronized update becomes visible to all clients within that bound.

#### Scenario: Client reuses a cached response

- **WHEN** a client requests the genre catalog twice within the cache lifetime
- **THEN** the second response may be served from the client's cache without a new server round trip

#### Scenario: Sync becomes visible within the bound

- **WHEN** a deploy runs the genre sync and the stored catalog changes
- **THEN** clients observe the updated catalog within one hour of the sync

#### Scenario: In-process cache does not change results

- **WHEN** the application serves the genre catalog from its in-process cache
- **THEN** the response contains the same stored genres as a database read would return
