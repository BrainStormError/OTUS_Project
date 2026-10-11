## Purpose

Defines the protection every mutating HTTP request and every authentication endpoint gets:
a body-size limit that cannot be bypassed and a request rate limit that holds across
instances and covers brute-force-sensitive paths.

## ADDED Requirements

### Requirement: Body-size limit is enforced before buffering

A mutation endpoint SHALL reject an oversized request body before reading the full body into
memory. The limit SHALL hold whether or not the request declares a content length, so a
missing or understated declared length SHALL NOT allow an oversized body to be accepted. A
rejected oversized request SHALL produce a request-too-large response with no body content
processed.

#### Scenario: Declared length exceeds the limit

- **WHEN** a request declares a content length greater than the configured limit
- **THEN** the system rejects the request without reading the body

#### Scenario: No declared length, oversized body

- **WHEN** a request provides no content length and streams a body larger than the configured limit
- **THEN** the system aborts reading once the limit is exceeded and rejects the request

#### Scenario: Body within the limit

- **WHEN** a request body is within the configured limit
- **THEN** the system processes the request normally

#### Scenario: Routes that prepare the body

- **WHEN** a route reads the request body before delegating to the shared mutation guard
- **THEN** the limit still applies to the body that reaches the guard, and the earlier read cannot bypass it

### Requirement: Rate limiting is shared across instances

Request rate limiting SHALL use a store shared by all application instances, so a limit is
not multiplied by the number of running instances. The limiter SHALL NOT grow without bound
as new keys are seen; idle keys SHALL be evicted.

#### Scenario: Requests spread across instances

- **WHEN** requests for the same operation and identity reach different instances
- **THEN** they are counted against the same limit

#### Scenario: Many distinct keys

- **WHEN** the limiter observes a large number of distinct keys over time
- **THEN** idle keys are evicted and memory use stays bounded

### Requirement: Authentication endpoints are rate limited

The authentication endpoints — the sign-in/OAuth handler and registration — SHALL be subject
to rate limiting keyed by client identity, so that brute-force and credential-stuffing
attempts are throttled and offenders can be refused.

#### Scenario: Repeated failed sign-ins

- **WHEN** a client makes sign-in attempts beyond the configured allowance within the window
- **THEN** further attempts are refused until the window resets

#### Scenario: Registration guessing

- **WHEN** a client submits registration attempts beyond the configured allowance within the window
- **THEN** further attempts are refused until the window resets
