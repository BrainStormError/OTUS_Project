## MODIFIED Requirements

### Requirement: Creating group discussions

The owner of a group, and a moderator of that group, SHALL be able to create a discussion (topic) in that group. A discussion SHALL have a title provided by its author. Members who are neither the owner nor a moderator, and non-members, MUST be rejected when attempting to create a discussion.

#### Scenario: Admin creates a topic

- **WHEN** the group's owner creates a discussion with a title
- **THEN** the discussion is persisted in the group and appears in the group's discussion list

#### Scenario: Moderator creates a topic

- **WHEN** a moderator creates a discussion with a title
- **THEN** the discussion is persisted in the group and appears in the group's discussion list

#### Scenario: Non-admin creation rejected

- **WHEN** a group member who is neither the owner nor a moderator attempts to create a discussion
- **THEN** the attempt is rejected with a permission error

#### Scenario: Non-member rejected

- **WHEN** a user who is not a member of the group attempts to create a discussion in it
- **THEN** the attempt is rejected with a permission error

## ADDED Requirements

### Requirement: Deleting a discussion

The owner of a group SHALL be able to delete a discussion in that group. Deleting a discussion SHALL also remove its comments and the group activity events that reference it. A moderator, a member, and a non-member MUST be rejected when attempting to delete a discussion.

#### Scenario: Owner deletes a discussion

- **WHEN** the owner deletes a discussion in the group
- **THEN** the discussion no longer appears in the group's discussion list

#### Scenario: Comments removed with the discussion

- **WHEN** the owner deletes a discussion that has comments
- **THEN** the discussion's comments are removed as well

#### Scenario: Activity removed with the discussion

- **WHEN** the owner deletes a discussion that has an activity event
- **THEN** the group activity events referencing that discussion are removed

#### Scenario: Moderator cannot delete a discussion

- **WHEN** a moderator attempts to delete a discussion
- **THEN** the attempt is rejected with a permission error

#### Scenario: Member cannot delete a discussion

- **WHEN** a member who is neither the owner nor a moderator attempts to delete a discussion
- **THEN** the attempt is rejected with a permission error

### Requirement: Deleting a comment

The owner of a group SHALL be able to delete any comment in the group's discussions. A moderator and a member MUST be rejected when attempting to delete a comment.

#### Scenario: Owner deletes a comment

- **WHEN** the owner deletes a comment in a discussion
- **THEN** the comment is removed from the discussion

#### Scenario: Moderator cannot delete a comment

- **WHEN** a moderator attempts to delete a comment
- **THEN** the attempt is rejected with a permission error

#### Scenario: Member cannot delete a comment

- **WHEN** a member who is neither the owner nor a moderator attempts to delete a comment
- **THEN** the attempt is rejected with a permission error
