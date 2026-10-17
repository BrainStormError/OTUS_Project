## ADDED Requirements

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
