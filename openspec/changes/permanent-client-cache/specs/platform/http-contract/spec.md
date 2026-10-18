## ADDED Requirements

### Requirement: Navigation payloads declare a browser cache policy

The HTML document response SHALL be private to the browser and MUST NOT be marked as cacheable by shared caches. It SHALL be revalidated before every reuse so a stale document is never served: the document carries a validator (ETag) and a policy that requires revalidation before each use. Navigation payload (flight) responses SHALL be private to the browser and cacheable for up to one year, so a repeated navigation edge can be satisfied from the browser cache without contacting the server, and MUST NOT be marked as cacheable by shared caches.

#### Scenario: A cached document is always revalidated

- **WHEN** the user opens the application and the document is present in the browser cache
- **THEN** the browser revalidates it against the server and receives either a not-modified response or the current document, never a stale copy

#### Scenario: Repeated navigation is served locally

- **WHEN** the user repeats a navigation edge within the flight-response cache window
- **THEN** the navigation payload is served from the browser cache without a request to the server

#### Scenario: Shared caches never store navigation payloads

- **WHEN** a document or navigation payload response is returned
- **THEN** it is marked private and is never marked as cacheable by a shared cache

### Requirement: A deployment clears the browser HTTP cache

When the running build no longer matches the client's build marker, the response SHALL carry a directive that clears the origin's HTTP cache in that browser and SHALL store the current build marker, so the clear happens exactly once per client per deployment. The clear MUST NOT remove browser storage other than the HTTP cache: in particular the `localStorage` value holding the theme preference MUST survive it. The clear applies to every cached response of the origin, including cached read responses, which the client recovers through its normal read loading.

#### Scenario: First request after a deployment clears the cache

- **WHEN** a request arrives whose build marker does not match the running build
- **THEN** the response clears the browser's HTTP cache for the origin and stores the current build marker

#### Scenario: Matching marker clears nothing

- **WHEN** a request arrives whose build marker matches the running build
- **THEN** the response carries no cache-clear directive

#### Scenario: Theme preference survives the clear

- **WHEN** the browser HTTP cache is cleared after a deployment
- **THEN** the stored theme preference is unchanged and the application keeps the user's chosen theme
