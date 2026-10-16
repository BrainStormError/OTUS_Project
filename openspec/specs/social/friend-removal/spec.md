# social/friend-removal Specification

## Purpose
Lets a user end an existing friendship: removing an accepted friendship so neither user remains a friend of the other, with a confirmation step before the removal is applied.

## Requirements

### Requirement: Removing an accepted friendship

A user who is a party to an accepted friendship SHALL be able to remove it. Removing it SHALL end the friendship for both users, so neither is a friend of the other afterwards. A user who is not a party to the friendship MUST be rejected, and a friendship that is not accepted MUST NOT be removable by this operation.

#### Scenario: Removing a friend

- **WHEN** a user removes an accepted friendship
- **THEN** the friendship is deleted and the removed user no longer appears in either user's friend list

#### Scenario: Removal affects both sides

- **WHEN** a friendship is removed by one of its two users
- **THEN** the other user no longer sees the remover as a friend either

#### Scenario: Non-party rejected

- **WHEN** a user who is not a party to the friendship attempts to remove it
- **THEN** the attempt is rejected with a permission error

#### Scenario: Pending request not affected

- **WHEN** a user removes a friend
- **THEN** a still-pending friend request, if any exists between other users, is unaffected

### Requirement: Confirmation before removal

The interface SHALL ask the user to confirm before an accepted friendship is removed, and the removal MUST NOT be applied unless the user confirms.

#### Scenario: Confirmation requested

- **WHEN** the user activates the remove action for a friend
- **THEN** a confirmation warning is presented before the friendship is removed

#### Scenario: Cancelling keeps the friend

- **WHEN** the user cancels the confirmation
- **THEN** the friendship is not removed and the friend remains in the list

#### Scenario: Confirming removes the friend

- **WHEN** the user confirms the warning
- **THEN** the friendship is removed and the friend is no longer shown
