## ADDED Requirements

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
