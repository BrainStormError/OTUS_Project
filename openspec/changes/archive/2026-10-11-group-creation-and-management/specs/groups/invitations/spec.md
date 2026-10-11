## Purpose

Lets a group administrator invite a specific user to a group and lets the invited user accept or decline, so that closed groups can be joined by invitation.

## ADDED Requirements

### Requirement: Invite a user to a group

An administrator of a group SHALL be able to invite an existing user to that group. Only an administrator SHALL be able to invite. The invited user SHALL be chosen from real user records.

#### Scenario: Administrator invites a user

- **WHEN** an administrator invites an existing user to the group
- **THEN** a pending invitation for that user and group is stored

#### Scenario: Non-administrator cannot invite

- **WHEN** a member who is not an administrator, or a non-member, attempts to invite
- **THEN** the invitation is rejected

#### Scenario: Duplicate invitation prevented

- **WHEN** a pending invitation already exists for the same user and group
- **THEN** no second pending invitation is created

#### Scenario: Inviting an existing member prevented

- **WHEN** an administrator invites a user who is already a member of the group
- **THEN** the invitation is rejected

### Requirement: Accept or decline an invitation

An invited user SHALL see their pending invitations and SHALL be able to accept or decline each one. Accepting SHALL make the user a member of the group with the member role; declining SHALL not grant membership.

#### Scenario: Invitation accepted

- **WHEN** an invited user accepts a pending invitation
- **THEN** the user becomes a member of the group and the invitation is marked accepted

#### Scenario: Invitation declined

- **WHEN** an invited user declines a pending invitation
- **THEN** the invitation is marked declined and the user does not become a member

#### Scenario: Only the invitee can decide

- **WHEN** a user other than the invitee attempts to accept or decline an invitation
- **THEN** the attempt is rejected

### Requirement: Invitation grants access to a closed group

Accepting an invitation SHALL grant the invited user membership even when the group is closed, and thereafter the user SHALL be able to view the group and its content as a member.

#### Scenario: Invitation bypasses the open-join restriction

- **WHEN** a user accepts an invitation to a closed group
- **THEN** the user becomes a member and can view the group's content

#### Scenario: Closed group content before acceptance is withheld

- **WHEN** an invited user who has not yet accepted requests the closed group's content
- **THEN** the content is withheld and the group is not revealed

### Requirement: Withdraw an invitation

An administrator SHALL be able to withdraw a pending invitation. Withdrawing removes the pending invitation.

#### Scenario: Administrator withdraws

- **WHEN** an administrator withdraws a pending invitation
- **THEN** the invitation is no longer pending for the invited user

### Requirement: Re-invite after decline

A declined invitation SHALL NOT permanently block a new invitation. An administrator SHALL be able to invite the same user again.

#### Scenario: Re-invited after decline

- **WHEN** an administrator invites a user whose previous invitation was declined
- **THEN** a new pending invitation is created
