## MODIFIED Requirements

### Requirement: Compact enumerated values

Fixed-choice fields (user role, friendship status, media kind, activity kind, group member role) SHALL be stored as compact codes rather than free text, with the allowed set enforced by the schema. The group member role SHALL be one of owner, moderator, or member, each stored as a distinct code.

#### Scenario: Invalid code rejected

- **WHEN** a value outside the allowed set is written to an enumerated field
- **THEN** the write is rejected

#### Scenario: Enumerated value round-trips

- **WHEN** an entity with an enumerated field is stored and read back
- **THEN** it returns the same logical value

#### Scenario: Group member role codes

- **WHEN** a group membership is stored
- **THEN** its role is stored as the code for owner, moderator, or member, and a code outside that set is rejected

## ADDED Requirements

### Requirement: Single group owner invariant

The persistence layer SHALL enforce that a group has at most one membership carrying the owner role, so that ownership cannot be duplicated by concurrent writes.

#### Scenario: Duplicate owner write rejected

- **WHEN** a second owner membership would be written for the same group
- **THEN** the write is rejected by the persistence layer

#### Scenario: Owner invariant survives updates

- **WHEN** a membership role is changed
- **THEN** the group still has at most one owner
