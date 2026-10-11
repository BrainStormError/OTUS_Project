## ADDED Requirements

### Requirement: Accepting an incoming friend request

A user SHALL be able to accept an incoming friend request, which SHALL make the two users accepted friends. After acceptance, the new friend SHALL appear in the user's friends list and the pending incoming count SHALL update without a manual reload. If acceptance fails, the request SHALL remain pending and the user SHALL receive failure feedback.

#### Scenario: Incoming request accepted

- **WHEN** the user accepts an incoming friend request
- **THEN** the two users become friends, the request no longer appears as pending, and the new friend appears in the friends list without a manual reload

#### Scenario: Pending count reflects acceptance

- **WHEN** the user accepts an incoming friend request
- **THEN** the pending incoming count decreases to match the remaining requests without a manual reload

#### Scenario: Failed acceptance

- **WHEN** accepting an incoming friend request fails
- **THEN** the request remains pending and failure feedback is shown
