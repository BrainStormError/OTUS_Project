## Purpose

Defines how the deploy pipeline establishes trust in the host it delivers to, so that release artifacts and deploy commands only ever reach a host whose identity has been verified.

## ADDED Requirements

### Requirement: Deploy host identity is verified by a pinned key

Every connection the pipeline makes to the deploy host SHALL verify the host's identity against a previously pinned host key. Host-key checking SHALL NOT be disabled, and the pipeline SHALL present the pinned key as the sole authority for that host.

#### Scenario: Host matches the pinned key

- **WHEN** the pipeline connects to the deploy host and the presented host key matches the pinned key
- **THEN** the connection is established and delivery proceeds

#### Scenario: Host key does not match

- **WHEN** the presented host key differs from the pinned key
- **THEN** the connection is refused and no artifact or command is delivered

### Requirement: Deploy fails closed when the host cannot be verified

The pipeline SHALL NOT fall back to accepting an unverified host key. If the pinned key is missing or verification cannot be performed, the deploy SHALL stop rather than connect.

#### Scenario: Pinned key not configured

- **WHEN** the deploy runs without a pinned host key available
- **THEN** the deploy stops before connecting and no delivery occurs

#### Scenario: No unchecked fallback

- **WHEN** host verification fails
- **THEN** the pipeline does not retry with host-key checking disabled
