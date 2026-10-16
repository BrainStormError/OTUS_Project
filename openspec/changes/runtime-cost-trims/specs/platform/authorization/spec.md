## MODIFIED Requirements

### Requirement: Actor role comes from the source of truth

The actor's role SHALL be read from the database or from a short-lived server-side cache whose entries were read from the database, whose lifetime is at most 60 seconds, and which is invalidated when the actor's stored identity is mutated. A role supplied by the client or carried only by a token MUST NOT be trusted. A user removed from the system SHALL lose access on the next request after the cache entry expires or is invalidated, and MUST NOT be granted access by a token alone.

#### Scenario: Role is stale in a token

- **WHEN** an actor's role in the database differs from a value in the token or client input
- **THEN** the database-derived value governs the decision

#### Scenario: User removed

- **WHEN** a previously authenticated user no longer exists in the database
- **THEN** the caller is treated as unauthenticated once their cached entry expires (within 60 seconds) or is invalidated, and a token alone never restores access

#### Scenario: Profile mutation is visible immediately

- **WHEN** the actor's stored identity is changed through a profile mutation
- **THEN** the next request reflects the changed identity without waiting for the cache to expire

#### Scenario: Cache entry never outlives its bound

- **WHEN** an actor's data is served from the server-side cache
- **THEN** the cached entry was read from the database no more than 60 seconds earlier
