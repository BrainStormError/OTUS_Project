# platform/runtime-config Specification

## Purpose
Guarantees that the application never starts or serves traffic with incomplete or invalid configuration, and that configuration values have a single, validated source.

## Requirements

### Requirement: Fail-fast startup validation

On startup the application SHALL validate all required environment values against a single schema. If any required value is missing or malformed, the process MUST fail to start and MUST NOT serve requests. The failure message SHALL name the invalid variables without exposing their values.

#### Scenario: Valid configuration

- **WHEN** all required environment values are present and well-formed
- **THEN** the application starts and serves requests

#### Scenario: Missing or malformed configuration

- **WHEN** one or more required environment values are missing or invalid
- **THEN** startup aborts with an error that names the invalid variables and no request is served

### Requirement: Single source of environment values

Application code SHALL read configuration only through the validated configuration module. Modules MUST NOT read the process environment directly.

#### Scenario: Code accesses configuration

- **WHEN** any module needs a configuration value
- **THEN** it imports the validated configuration module and no direct process-environment access exists outside it

### Requirement: Secret values stay concealed

Values classified as secrets SHALL NOT appear in logs, HTTP responses, or user-visible error messages.

#### Scenario: Secret is logged

- **WHEN** a log entry or error would include a secret value
- **THEN** the value is redacted before it is emitted or returned
