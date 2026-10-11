## MODIFIED Requirements

### Requirement: Invite a user to a group

The owner of a group, and a moderator of that group, SHALL be able to invite an existing user to the group. Only the owner and moderators SHALL be able to invite. A member who is neither the owner nor a moderator SHALL NOT be able to invite. The invited user SHALL be chosen from real user records.

#### Scenario: Administrator invites a user

- **WHEN** the owner or a moderator invites an existing user to the group
- **THEN** a pending invitation for that user and group is stored

#### Scenario: Non-administrator cannot invite

- **WHEN** a member who is neither the owner nor a moderator, or a non-member, attempts to invite
- **THEN** the invitation is rejected

#### Scenario: Duplicate invitation prevented

- **WHEN** a pending invitation already exists for the same user and group
- **THEN** no second pending invitation is created

#### Scenario: Inviting an existing member prevented

- **WHEN** the owner or a moderator invites a user who is already a member of the group
- **THEN** the invitation is rejected

### Requirement: Withdraw an invitation

The owner SHALL be able to withdraw a pending invitation. A moderator SHALL NOT be able to withdraw an invitation, because withdrawing removes data. Withdrawing removes the pending invitation.

#### Scenario: Administrator withdraws

- **WHEN** the owner withdraws a pending invitation
- **THEN** the invitation is no longer pending for the invited user

#### Scenario: Moderator cannot withdraw

- **WHEN** a moderator attempts to withdraw a pending invitation
- **THEN** the attempt is rejected and the invitation stays pending
