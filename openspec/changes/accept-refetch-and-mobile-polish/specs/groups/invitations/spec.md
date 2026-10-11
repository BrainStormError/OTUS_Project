## MODIFIED Requirements

### Requirement: Accept or decline an invitation

An invited user SHALL see their pending invitations and SHALL be able to accept or decline each one. Accepting SHALL make the user a member of the group with the member role; declining SHALL not grant membership. Accepting SHALL make the group appear in the user's group list without a manual reload.

#### Scenario: Invitation accepted

- **WHEN** an invited user accepts a pending invitation
- **THEN** the user becomes a member of the group and the invitation is marked accepted

#### Scenario: Accepted group appears in the group list

- **WHEN** an invited user accepts a pending invitation
- **THEN** the group appears in the user's group list without a manual reload and the invitation is no longer shown as pending

#### Scenario: Invitation declined

- **WHEN** an invited user declines a pending invitation
- **THEN** the invitation is marked declined and the user does not become a member

#### Scenario: Only the invitee can decide

- **WHEN** a user other than the invitee attempts to accept or decline an invitation
- **THEN** the attempt is rejected
