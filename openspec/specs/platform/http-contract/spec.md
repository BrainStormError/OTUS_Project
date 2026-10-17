# platform/http-contract Specification

## Purpose
Defines one uniform, secure contract for mutating requests so origin checks, authentication, validation, and error mapping behave identically across every endpoint.

## Requirements

### Requirement: Request origin is verified

Mutating requests SHALL verify their origin using the `Origin` header and fetch metadata. A request from an untrusted origin MUST be rejected with HTTP 403 and MUST produce no side effects.

#### Scenario: Trusted origin

- **WHEN** a mutation arrives from the configured application origin
- **THEN** the request proceeds to the remaining checks

#### Scenario: Untrusted origin

- **WHEN** a mutation arrives from an origin other than the configured application origin
- **THEN** the request is rejected with HTTP 403 and no data is changed

### Requirement: Authentication is required for mutations

Mutating requests SHALL require an authenticated session. A request without a valid session MUST be rejected with HTTP 401.

#### Scenario: No session

- **WHEN** a mutation arrives without a valid session
- **THEN** it is rejected with HTTP 401 and no data is changed

#### Scenario: Valid session

- **WHEN** a mutation arrives with a valid session
- **THEN** the authenticated actor is available to the handler

### Requirement: Input is validated before handling

Request payloads SHALL be validated against a schema before the handler runs. A payload that is unparseable, malformed, or violates the schema MUST be rejected with HTTP 400 and a safe message, and no data is changed.

#### Scenario: Invalid payload

- **WHEN** a mutation body fails schema validation
- **THEN** it is rejected with HTTP 400 and a message that reveals no internal details

#### Scenario: Unparseable body

- **WHEN** a mutation body is not valid JSON
- **THEN** it is rejected with HTTP 400 and no data is changed

### Requirement: Expected failures map to HTTP without exceptions

Expected failures — validation, authorization, and business-rule rejections — SHALL be represented as typed results and mapped to appropriate HTTP status codes. They MUST NOT be thrown as exceptions. Unexpected failures MUST be reported as HTTP 500 with no internal details exposed.

#### Scenario: Authorization denied

- **WHEN** a handler returns a typed authorization failure
- **THEN** the response carries the corresponding 4xx status and the failure message

#### Scenario: Unexpected failure

- **WHEN** an unexpected error occurs while handling a mutation
- **THEN** the response is HTTP 500 with a generic message and the error is logged with its request id

### Requirement: Requests are correlated

Every request SHALL be associated with a request id, taken from the incoming header when present and otherwise generated. The request id SHALL be included in the response and in every log entry produced while handling the request.

#### Scenario: Incoming request id

- **WHEN** a request carries a request-id header
- **THEN** that id is used for the response and related log entries

#### Scenario: Missing request id

- **WHEN** a request carries no request-id header
- **THEN** a new id is generated and used for the response and related log entries

### Requirement: Read requests follow the same contract as mutations

A request that returns user data SHALL require an authenticated session and SHALL be refused with HTTP 401 without one. Its parameters SHALL be validated against a schema before the handler runs, and a malformed or out-of-contract parameter SHALL be refused with HTTP 400 and a safe message. Expected failures SHALL be represented as typed results mapped to appropriate status codes rather than thrown as exceptions, and unexpected failures SHALL be reported as HTTP 500 with no internal details exposed.

#### Scenario: Read without a session is refused

- **WHEN** a data read arrives without a valid session
- **THEN** the response is HTTP 401 and no data is returned

#### Scenario: Malformed read parameters are refused

- **WHEN** a read carries a parameter that fails validation
- **THEN** the response is HTTP 400 with a safe message and no data is returned

#### Scenario: An expected read failure maps to its status

- **WHEN** a read fails for an expected reason such as a missing or restricted resource
- **THEN** the response carries the status mapped from the typed result and no stack or internal detail

#### Scenario: Every read carries a request id

- **WHEN** any data read is handled
- **THEN** the request id is included in the response and in every log entry for that request

### Requirement: Screens obtain their data through the read contract

A screen that presents user data SHALL obtain it through an authorized read request rather than by embedding it in the served document. Each screen's data source SHALL be reachable through an endpoint covered by this contract, so no screen depends on data that only a server render can supply.

#### Scenario: A screen loads its data after the document

- **WHEN** a screen is opened
- **THEN** its content is populated from an authorized read request and the served document contains only the shell

#### Scenario: A screen has no server-render-only data

- **WHEN** a screen is inspected for data it needs
- **THEN** every field it presents is obtainable through an endpoint covered by this contract

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
