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

The actor's role SHALL be read from the database for each request. A role supplied by the client or carried only by a token MUST NOT be trusted. A user removed from the system SHALL lose access on the next request.

#### Scenario: Role is stale in a token

- **WHEN** an actor's role in the database differs from a value in the token or client input
- **THEN** the database value governs the decision

#### Scenario: User removed

- **WHEN** a previously authenticated user no longer exists in the database
- **THEN** the next request treats the caller as unauthenticated

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
