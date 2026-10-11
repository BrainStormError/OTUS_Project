## MODIFIED Requirements

### Requirement: Bounded user-authored text

Every user-authored text field SHALL be bounded both by a database constraint and by input validation: a rating comment, a discussion title, and a post body SHALL be limited to at most 1000 characters; a user display name and a group name SHALL be limited to at most 100 characters; a group tag SHALL be limited to at most 80 characters.

#### Scenario: Over-limit comment rejected

- **WHEN** a user submits a comment longer than 1000 characters
- **THEN** the input is rejected and nothing is saved

#### Scenario: Boundary comment accepted

- **WHEN** a user submits a comment of exactly 1000 characters
- **THEN** it is saved successfully

#### Scenario: Over-limit name or tag rejected

- **WHEN** a user submits a display name longer than 100 characters, a group name longer than 100 characters, or a tag longer than 80 characters
- **THEN** the input is rejected and nothing is saved

#### Scenario: Boundary name and tag accepted

- **WHEN** a display name of exactly 100 characters, a group name of exactly 100 characters, or a tag of exactly 80 characters is submitted
- **THEN** it is saved successfully

## ADDED Requirements

### Requirement: Case-insensitive unique names

Group names and tag names SHALL be unique without regard to letter case, while their stored and displayed text SHALL preserve the original case.

#### Scenario: Group name collision by case rejected

- **WHEN** a group name is stored that differs from an existing group name only by letter case
- **THEN** the second name is rejected

#### Scenario: Tag collision by case reuses the existing tag

- **WHEN** a tag is stored that differs from an existing tag only by letter case
- **THEN** the existing tag row is reused instead of inserting a duplicate

#### Scenario: Original case preserved

- **WHEN** a name with mixed case is stored
- **THEN** reading it back returns the original case

### Requirement: Extensible tag dictionary

The tag dictionary SHALL accept a new tag value when a group is saved with a tag not yet present, assigning it a generated numeric identifier, and groups SHALL continue to reference tags only by their numeric dictionary codes.

#### Scenario: New tag receives an identifier

- **WHEN** a group is saved with a tag value that does not exist in the dictionary
- **THEN** a new tag row with a generated numeric identifier is created

#### Scenario: Groups reference tags by code

- **WHEN** a group's tags are stored
- **THEN** the group stores the numeric codes of those tags, not the tag text

### Requirement: Group invitation relation

An invitation to a group SHALL be persisted as its own entity with a numeric identifier, foreign keys to the group, the inviting user, and the invited user, and a compact status code (pending, accepted, declined). At most one invitation SHALL exist per group and invited user.

#### Scenario: Invitation stored with identifiers

- **WHEN** an invitation is created
- **THEN** it stores the group, inviter, and invitee as numeric foreign keys and a status code

#### Scenario: One invitation per group and invitee

- **WHEN** a second invitation would be created for the same group and invited user
- **THEN** it is rejected or resolves to the existing invitation rather than storing a duplicate

#### Scenario: Status round-trips

- **WHEN** an invitation status is stored and read back
- **THEN** it returns the same logical status
