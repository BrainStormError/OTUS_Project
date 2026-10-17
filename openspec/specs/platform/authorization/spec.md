# platform/authorization Specification

## Purpose
Centralizes access decisions so authorization is consistent, sourced from the database, and testable instead of being scattered across UI and data-access code.

## Requirements

### Requirement: Single authorization decision point

Authorization decisions SHALL be made through a single policy surface of the form `can(actor, action, resource)`. UI components and data-access code MUST NOT make authorization decisions.

#### Scenario: Service enforces access

- **WHEN** a scenario needs an access decision
- **THEN** it is made through the policy surface and the outcome governs whether the action proceeds

#### Scenario: UI does not decide access

- **WHEN** a component renders controls
- **THEN** it does not grant or deny access on its own and relies on server-side enforcement

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

### Requirement: Policy branches are fully covered

Every defined action SHALL have its decision branches covered by tests, including allowed and denied outcomes for admin, owner, and other actors.

#### Scenario: Administrator action

- **WHEN** an administrator invokes an administrative action
- **THEN** the policy allows it

#### Scenario: Non-administrator invokes an administrative action

- **WHEN** a non-administrator invokes an administrative action
- **THEN** the policy denies it

#### Scenario: Owner versus non-owner

- **WHEN** an action is restricted to the resource owner
- **THEN** the owner is allowed and a non-owner is denied

### Requirement: Denial is a typed failure

An authorization denial SHALL be represented as a typed failure that callers handle, not as a thrown exception.

#### Scenario: Denied decision returned

- **WHEN** the policy denies an action
- **THEN** the caller receives a typed denial and no protected data is returned or changed

### Requirement: The application shell is not an authorization boundary

The document that renders the application's shell SHALL be servable without a session. Serving the shell MUST NOT be treated as granting any access to data: it conveys layout and presentation only, and contains no user content, no identifiers of the signed-in user, and no result of any access decision.

#### Scenario: The shell is served without a session

- **WHEN** a viewer with no session requests a page of the application
- **THEN** the shell document is served and contains no user data

#### Scenario: The shell carries no user identity

- **WHEN** the shell document is served
- **THEN** the signed-in user's name, handle, role, and identifiers are absent from the document and are obtained by the client from an authorized data request

### Requirement: Every data request is authorized on the server

Every request that returns user data SHALL be authorized on the server against the database-derived actor before any data is read or written. A request that carries a token, cookie, or client-supplied role MUST NOT be granted access on that basis alone. A user removed from the system SHALL lose access on their next data request.

#### Scenario: Data request without a session is refused

- **WHEN** a request for user data arrives without a valid session
- **THEN** the server refuses it and no data is read

#### Scenario: A forged identity claim is refused

- **WHEN** a request asserts a role or user identity that the database does not confirm
- **THEN** the server refuses it on the database-derived actor, not on the assertion

#### Scenario: A removed user loses access

- **WHEN** a user is removed from the system and their client requests data
- **THEN** the request is refused on the next attempt

### Requirement: Access decisions remain on the server

Whether a viewer may perform an action or see a restricted resource SHALL continue to be decided on the server through the single policy surface. Presentation choices the client makes about what to render MUST NOT substitute for a server decision, and any control the client hides for convenience MUST still be refused on the server if exercised.

#### Scenario: A hidden control is refused when exercised

- **WHEN** a client omits a control the viewer may not use and the viewer nonetheless submits the corresponding request
- **THEN** the server refuses it with a typed denial

#### Scenario: A restricted resource is refused on read

- **WHEN** a viewer requests a resource they are not permitted to see
- **THEN** the server refuses it and the client renders the restricted state
