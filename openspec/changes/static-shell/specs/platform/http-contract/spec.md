## ADDED Requirements

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
