## Purpose

Defines one uniform, secure contract for mutating requests so origin checks, authentication, validation, and error mapping behave identically across every endpoint.

## ADDED Requirements

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
