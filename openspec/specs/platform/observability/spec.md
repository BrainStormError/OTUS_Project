# platform/observability Specification

## Purpose
Makes every request traceable and every failure visible through stdout logging and a health endpoint, without relying on external log or tracing services.

## Requirements

### Requirement: Structured logs

Application logs SHALL be emitted as structured JSON to standard output. Each entry SHALL include a level, an event name, a timestamp, and its associated fields.

#### Scenario: Event is logged

- **WHEN** the application records an event
- **THEN** a single-line JSON entry is written to stdout containing level, event, and timestamp

### Requirement: Sensitive fields are redacted

Log fields whose names indicate sensitive content — including secret, token, session, ticket, password, and credential — SHALL be redacted. Values originating from requests SHALL be sanitized so control characters and line breaks cannot forge log entries.

#### Scenario: Sensitive field present

- **WHEN** a log entry's fields include a sensitive key or a requester-supplied value containing control characters
- **THEN** the sensitive value is redacted and the supplied value is sanitized before the entry is written

### Requirement: Request-scoped correlation

Every log entry produced while handling a request SHALL include that request's request id.

#### Scenario: Logs share the request id

- **WHEN** several events are logged during one request
- **THEN** each entry carries the same request id for that request

### Requirement: Health and readiness endpoint

The system SHALL expose a health endpoint that reports whether the service can serve traffic. It SHALL return a success response when the database is reachable within a bounded timeout, and SHALL return HTTP 503 with an unavailable status otherwise.

#### Scenario: Database reachable

- **WHEN** the health endpoint is called and the database responds within the timeout
- **THEN** it returns HTTP 200 with an ok status

#### Scenario: Database unreachable

- **WHEN** the health endpoint is called and the database is unreachable or exceeds the timeout
- **THEN** it returns HTTP 503 with an unavailable status and records a warning
