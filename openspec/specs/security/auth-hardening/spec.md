# security/auth-hardening Specification

## Purpose
Defines how the system establishes trust in a user's identity: which login paths are
allowed, how accounts are matched, how privilege is assigned, which origin the system
trusts, and what is recorded for authentication events.

## Requirements

### Requirement: Demo login is unavailable in production

The demo login path SHALL be enabled only when explicitly configured and only outside a
production environment. If the environment is production, the demo path SHALL refuse every
attempt regardless of configuration.

#### Scenario: Demo login in production

- **WHEN** a demo sign-in is attempted while the application runs in production
- **THEN** the attempt fails and no session is created

#### Scenario: Demo login when not enabled

- **WHEN** a demo sign-in is attempted while demo mode is not enabled
- **THEN** the attempt fails

### Requirement: Demo login does not impersonate or self-promote

The demo login SHALL NOT authenticate as a pre-existing account it did not create. When it
creates an account, the account SHALL receive the least-privilege role, and privilege SHALL
NOT be derived from any part of the supplied email or other user-supplied input.

#### Scenario: Email matching an existing privileged account

- **WHEN** a demo sign-in supplies the email of an existing account that the demo path did not create
- **THEN** the attempt does not grant a session for that account

#### Scenario: New demo account privilege

- **WHEN** a demo sign-in creates a new account with an email whose text begins with privileged-looking text
- **THEN** the account is created with the least-privilege role

#### Scenario: Repeated demo sign-in

- **WHEN** a demo sign-in supplies an email already created by the demo path
- **THEN** the same demo-created account is resolved

### Requirement: Identity binds to the provider subject

Account matching for a returned sign-in SHALL bind to the stable provider subject for that
provider, not to the email address alone. An account established through one login path
SHALL NOT be silently inherited by a different provider that merely shares the email.

#### Scenario: Different provider, same email

- **WHEN** a sign-in from a provider returns an email that matches an account established by a different provider
- **THEN** the system does not authenticate into that existing account on the basis of the email alone

### Requirement: Canonical origin is pinned

The application SHALL derive authentication callback and redirect origins from its configured
canonical origin and SHALL NOT trust the request's host header for that purpose.

#### Scenario: Spoofed host header

- **WHEN** a request carries a host header different from the configured canonical origin
- **THEN** authentication responses redirect to the canonical origin rather than the supplied host

### Requirement: Authentication outcomes are audit-logged

Every authentication outcome — a successful sign-in and a failed attempt — SHALL produce a
structured audit record identifying the provider and, where known, the user. Audit records
SHALL NOT contain credentials, tokens, tickets, session values or passwords.

#### Scenario: Successful sign-in recorded

- **WHEN** a sign-in completes successfully
- **THEN** an audit record with the provider and user identity is emitted

#### Scenario: Failed sign-in recorded

- **WHEN** a sign-in attempt fails
- **THEN** an audit record with the provider and failure outcome is emitted

#### Scenario: Audit record excludes secrets

- **WHEN** an audit record is emitted
- **THEN** it contains no credential, token, ticket, session value or password
