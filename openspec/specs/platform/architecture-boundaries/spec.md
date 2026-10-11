# platform/architecture-boundaries Specification

## Purpose
Keeps bounded contexts independent and infrastructure free of domain knowledge by defining the allowed dependency directions and enforcing them automatically in CI.

## Requirements

### Requirement: Allowed dependency directions

The system SHALL organize application code into the layers `app`, `modules`, `core`, and `components`, and SHALL permit dependencies only in the direction `app -> modules -> core` plus `components -> modules`. `core` MUST NOT depend on `modules` or `components`, and `components/ui` MUST NOT depend on `modules`.

#### Scenario: Compliant import graph

- **WHEN** a source file imports only from a permitted layer
- **THEN** the dependency check passes with no violations

#### Scenario: Forbidden dependency introduced

- **WHEN** a file under `core` imports from `modules` or `components`, or a UI primitive imports from `modules`
- **THEN** the dependency check reports the offending edge and the quality gate fails

### Requirement: Module isolation

Each bounded context SHALL expose only its public surface to other layers. A module MUST NOT import the internal data-access layer of another module.

#### Scenario: Module reads another module through its public surface

- **WHEN** module A needs data owned by module B
- **THEN** it uses module B's public service surface and the dependency check passes

#### Scenario: Module reaches into another module's persistence

- **WHEN** module A imports module B's repository or raw SQL directly
- **THEN** the dependency check reports a violation and the quality gate fails

### Requirement: Canonical repository layout and path alias

The repository SHALL provide the canonical top-level directories for application source, bounded contexts, infrastructure, UI, shared types, tests, seed data, and documentation, and SHALL resolve the `@/*` import alias to the application source root.

#### Scenario: Canonical layout present

- **WHEN** the bootstrap is complete
- **THEN** the documented source, module, infrastructure, component, test, seed, and docs directories exist

#### Scenario: Alias resolves

- **WHEN** a file imports through the `@/*` alias
- **THEN** the build and type check resolve it to the application source root without error
