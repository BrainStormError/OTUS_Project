# security/group-access Specification

## Purpose
Defines who may read a group's content, so that a restricted ("closed") group's
members, discussions, posts and ratings are visible only to people entitled to see them.

## Requirements

### Requirement: Restricted group reads require membership

Reading any content scoped to a restricted group SHALL require that the reader is a member
or administrator of that group. A reader who is not entitled SHALL receive a not-found
response and SHALL NOT learn that the group exists or receive any of its content. Reading
content of a non-restricted (open) group SHALL be allowed for any authenticated user.

#### Scenario: Non-member reads a restricted group

- **WHEN** an authenticated user who is not a member requests a restricted group's page or any of its tabs
- **THEN** the system responds as not found and returns no members, discussions, posts, ratings or statistics

#### Scenario: Member reads a restricted group

- **WHEN** a member of the restricted group requests the group page
- **THEN** the system returns the group and its content

#### Scenario: Administrator reads a restricted group

- **WHEN** an administrator of the restricted group requests the group page
- **THEN** the system returns the group and its content

#### Scenario: Open group readable by any authenticated user

- **WHEN** an authenticated user who is not a member requests a non-restricted group
- **THEN** the system returns the group and its content

#### Scenario: Unauthenticated reader

- **WHEN** a request without a valid session targets any group content
- **THEN** the system withholds the content

### Requirement: Group content reads are scoped to their group

Every group-scoped read SHALL resolve its resource within the group it belongs to. A
discussion, post or rating that belongs to a different group SHALL NOT be returned through
another group's context, and a discussion identifier from one group SHALL NOT expose content
when requested on another group's page.

#### Scenario: Discussion requested through the wrong group

- **WHEN** a reader requests a discussion identifier that belongs to a different group than the one in the page context
- **THEN** the system does not return that discussion's content

#### Scenario: Direct discussion read enforces group access

- **WHEN** any caller requests a discussion that belongs to a restricted group the caller cannot view
- **THEN** the system withholds the discussion and its posts regardless of the entry point

### Requirement: Member list is part of protected content

The group member list SHALL be treated as restricted content and SHALL be returned only to
readers entitled to view the group. Administrative pages that display the member list SHALL
apply the same view-access rule as the group page.

#### Scenario: Member list on the admin page

- **WHEN** a reader without view access requests the group's administrative page
- **THEN** the member list is not exposed

### Requirement: View authorization is a single explicit decision

The decision to allow or deny reading a group SHALL be expressed once by the authorization
policy and applied by the group service, so that every read path — page, tab, or API — is
covered by the same rule rather than by per-caller checks.

#### Scenario: New read path inherits the guard

- **WHEN** a new group-scoped read is added that goes through the group service
- **THEN** restricted groups remain protected without adding a caller-specific check

### Requirement: Group-scoped reads deny access on their own

A group-scoped read operation that returns restricted-group content (the group, its member roster, its ratings, or its discussions) SHALL itself take the viewer and deny access when the viewer is not entitled, rather than returning the content and relying on the caller to have checked first. A caller that omits its own check SHALL NOT cause content of a restricted group to be returned.

#### Scenario: Caller omits the check

- **WHEN** a caller invokes a group-scoped read for a restricted group without performing its own access check
- **THEN** the read still denies an unentitled viewer and returns nothing of the group

#### Scenario: Authorized viewer through any entry point

- **WHEN** a member or administrator invokes a group-scoped read
- **THEN** the group and its content are returned

### Requirement: Invitation acceptance grants access

Accepting an invitation to a restricted group SHALL grant the invited user membership and thereby access to that group's content, without weakening the rule that a reader who is not a member cannot read it.

#### Scenario: Accepted invitee reads the group

- **WHEN** a user accepts an invitation to a restricted group and then requests the group's page
- **THEN** the group and its content are returned

#### Scenario: Pending invitee is still denied

- **WHEN** a user with a pending, not yet accepted invitation requests a restricted group's content
- **THEN** the system responds as not found and returns no content

#### Scenario: Access is granted by membership, not by the invitation alone

- **WHEN** an administrator withdraws a pending invitation before it is accepted
- **THEN** the user remains a non-member and cannot read the group
