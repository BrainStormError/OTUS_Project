## ADDED Requirements

### Requirement: Read responses declare a browser cache policy

Successful read responses SHALL carry an explicit cache policy. Responses derived from external catalog data SHALL be private to the browser and cacheable for at most one hour. Responses carrying the signed-in user's personal data SHALL be private to the browser and cacheable for at most thirty seconds. A read response MUST NOT be marked as cacheable by shared caches.

#### Scenario: Catalog data is cached for an hour

- **WHEN** a catalog search or a title detail read succeeds
- **THEN** the response allows the browser to reuse it for up to one hour without contacting the server

#### Scenario: Personal data is cached briefly

- **WHEN** a read of the signed-in user's feed, watched records, or watch-later list succeeds
- **THEN** the response allows the browser to reuse it for at most thirty seconds

#### Scenario: Repeat reads are served locally

- **WHEN** the same read is repeated within the response's cache window
- **THEN** the browser may satisfy it without a request to the server

#### Scenario: Shared caches never store personal data

- **WHEN** any read response is returned
- **THEN** it is marked private and is never marked as cacheable by a shared cache
