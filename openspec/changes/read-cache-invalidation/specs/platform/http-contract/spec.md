## MODIFIED Requirements

### Requirement: Read responses declare a browser cache policy

Successful read responses SHALL carry an explicit cache policy. Responses carrying data that only the signed-in user can change SHALL be private and cacheable until a mutation invalidates them, and MUST NOT expire on a shorter schedule. Responses derived from external catalog data SHALL be private and cacheable for at most one hour. Responses carrying data that other users change SHALL be private and cacheable for at most sixty seconds. A read response MUST NOT be marked as cacheable by shared caches.

#### Scenario: Single-author data survives navigation

- **WHEN** a read of the signed-in user's records, watch-later list, friends list, groups list, profile, or settings succeeds
- **THEN** the response stays reusable by the browser across navigation until a mutation invalidates it

#### Scenario: Catalog data is cached for an hour

- **WHEN** a catalog search or a title detail read succeeds
- **THEN** the response allows the browser to reuse it for up to one hour without contacting the server

#### Scenario: Shared data is cached briefly

- **WHEN** the activity feed is read
- **THEN** the response allows the browser to reuse it for at most sixty seconds

#### Scenario: Repeat reads are served locally

- **WHEN** the same read is repeated within the response's cache window
- **THEN** the browser may satisfy it without a request to the server

#### Scenario: Shared caches never store personal data

- **WHEN** any read response is returned
- **THEN** it is marked private and is never marked as cacheable by a shared cache
