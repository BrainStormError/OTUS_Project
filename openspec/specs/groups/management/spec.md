# groups/management Specification

## Purpose

Lets any signed-in user create a group and lets a group's administrator edit its attributes, visibility, and membership.

## Requirements

### Requirement: Create a group

Any authenticated user SHALL be able to create a group by providing a name and optional description, tags, and visibility (open or closed). The creator SHALL become an administrator of the new group, and after creation the new group's page SHALL be opened.

#### Scenario: Group created

- **WHEN** an authenticated user submits a valid group name
- **THEN** the group is created with the chosen attributes and the creator is its administrator

#### Scenario: Creator becomes administrator

- **WHEN** a user creates a group
- **THEN** the creator's membership role in that group is administrator

#### Scenario: Landing on the new group

- **WHEN** a group is created successfully
- **THEN** the main page of the created group is shown

#### Scenario: Anonymous creation rejected

- **WHEN** a request without a valid session attempts to create a group
- **THEN** the request is rejected and no group is created

### Requirement: Unique group name

A group name SHALL be unique regardless of letter case while its display preserves the original case. A creation or rename that collides with an existing group name SHALL be rejected. A group name SHALL be 1 to 100 characters after trimming.

#### Scenario: Case-insensitive collision rejected

- **WHEN** a group is created or renamed to a name that differs from an existing group's name only by letter case
- **THEN** the change is rejected and no group name is duplicated

#### Scenario: Display preserves case

- **WHEN** a group is created with a name containing uppercase letters
- **THEN** the group's displayed name keeps that case

#### Scenario: Empty or over-limit name rejected

- **WHEN** a name that is empty after trimming or longer than 100 characters is submitted
- **THEN** the input is rejected

### Requirement: Group description and tags

A group SHALL have an optional description of at most 1000 characters and zero or more tags. Tags SHALL be free-form strings of at most 80 characters and SHALL be matched without regard to letter case; a tag value not yet present SHALL be added to the shared tag dictionary, and the group SHALL reference tags by their dictionary codes.

#### Scenario: Tags stored on the group

- **WHEN** a group is created or edited with tags
- **THEN** the group shows those tags

#### Scenario: New tag added to the dictionary

- **WHEN** a group is saved with a tag value that does not yet exist
- **THEN** the tag is added to the shared dictionary and referenced by the group

#### Scenario: Tag matched without case

- **WHEN** a group is saved with a tag that differs only by letter case from an existing tag
- **THEN** the existing tag is reused instead of creating a duplicate

#### Scenario: Malformed tag rejected

- **WHEN** a tag longer than 80 characters is submitted
- **THEN** the input is rejected

### Requirement: Edit group settings

An administrator of a group SHALL be able to change the group's name, description, tags, and visibility between open and closed. A non-administrator SHALL NOT be able to change any of these.

#### Scenario: Administrator edits settings

- **WHEN** an administrator changes the group's name, description, tags, or visibility
- **THEN** the changes are saved and shown on the group

#### Scenario: Non-administrator denied

- **WHEN** a member who is not an administrator, or a non-member, attempts to change group settings
- **THEN** the change is rejected and nothing is modified

### Requirement: Open and closed group visibility

An open group SHALL be discoverable in search by any authenticated user; a closed group SHALL NOT appear in search results, and its only entry path SHALL be an accepted invitation. An administrator SHALL be able to switch a group between open and closed.

#### Scenario: Open group discoverable

- **WHEN** a user searches for a group that is open
- **THEN** the group appears in the results

#### Scenario: Closed group not discoverable

- **WHEN** a user searches for a group that is closed and is not a member
- **THEN** the group does not appear in the results

#### Scenario: Visibility changed by administrator

- **WHEN** an administrator switches a group from open to closed, or the reverse
- **THEN** the group's discoverability follows the new visibility

### Requirement: Manage members and roles

An administrator of a group SHALL be able to change a member's role between administrator and member and SHALL be able to remove a member. These changes SHALL be persisted and reflected on the group.

#### Scenario: Role changed

- **WHEN** an administrator changes a member's role
- **THEN** the new role is stored and reflected on the group

#### Scenario: Member removed

- **WHEN** an administrator removes a member
- **THEN** the member no longer belongs to the group

#### Scenario: Non-administrator cannot manage members

- **WHEN** a non-administrator attempts to change a role or remove a member
- **THEN** the change is rejected
