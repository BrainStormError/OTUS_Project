## ADDED Requirements

### Requirement: Leave a group

A member of a group who is not an administrator SHALL be able to leave that group. After leaving, the user SHALL no longer be a member, the group SHALL disappear from their group list, and if the group is closed the user SHALL lose access to its content. An administrator SHALL NOT leave a group by removing their own membership.

#### Scenario: Member leaves

- **WHEN** a non-administrator member leaves the group
- **THEN** the user is no longer a member and the group is no longer listed among their groups

#### Scenario: Leaving a closed group revokes access

- **WHEN** a member leaves a closed group
- **THEN** the user can no longer read the group's content

#### Scenario: Non-member cannot leave

- **WHEN** a user who is not a member attempts to leave the group
- **THEN** the attempt is rejected

### Requirement: Self-removal prevented

An administrator SHALL NOT be able to remove their own membership from a group. Removing one's own membership SHALL be rejected so that a group cannot be left by an administrator through self-removal.

#### Scenario: Administrator cannot remove themselves

- **WHEN** an administrator attempts to remove their own membership
- **THEN** the attempt is rejected and the administrator remains a member

### Requirement: Dissolve a group

An administrator SHALL be able to dissolve (delete) a group. Dissolving SHALL remove the group and all of its data — membership, pending invitations, group ratings, discussions and their posts — and SHALL also remove the group's activity events. Only an administrator SHALL be able to dissolve a group. After dissolution the group SHALL no longer appear anywhere and its page SHALL be treated as not found.

#### Scenario: Administrator dissolves the group

- **WHEN** an administrator dissolves the group
- **THEN** the group no longer exists and is removed from every member's group list

#### Scenario: Group data is deleted

- **WHEN** a group is dissolved
- **THEN** its members, pending invitations, group ratings, and discussions with their posts are deleted

#### Scenario: Group activity is deleted

- **WHEN** a group is dissolved
- **THEN** the activity events recorded for that group are deleted and no longer appear in any feed

#### Scenario: Dissolved group is not found

- **WHEN** any user requests a dissolved group's page or content
- **THEN** the system responds as not found

#### Scenario: Non-administrator cannot dissolve

- **WHEN** a member who is not an administrator, or a non-member, attempts to dissolve the group
- **THEN** the attempt is rejected and the group is unchanged
