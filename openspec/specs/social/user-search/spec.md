# social/user-search Specification

## Purpose
Defines how people search and friend requests work against real user data: who is visible in search results, how the searcher's own profile is excluded, and how friend requests are created and withdrawn.

## Requirements

### Requirement: User search scope
The system SHALL search real user records by name or handle. Results SHALL first match the searcher's own accepted friends and, when no friend matches, SHALL fall back to all registered users whose profile is not hidden. The searcher's own profile SHALL NEVER appear in the results.

#### Scenario: Friend matched from the database
- **WHEN** the user searches in Friends and an accepted friend's name or handle matches the query
- **THEN** that friend is listed with data read from the database

#### Scenario: Fallback to all non-hidden profiles
- **WHEN** the user searches in Friends and no accepted friend matches the query
- **THEN** matching registered users with a non-hidden profile are listed

#### Scenario: Own profile excluded
- **WHEN** the user searches for their own name or handle
- **THEN** the searcher's own profile does not appear in the results

#### Scenario: Hidden profiles excluded
- **WHEN** a matching user has hidden their profile and is not the searcher's friend
- **THEN** that user does not appear in the results

### Requirement: Relationship status in results

Each search result SHALL indicate the current relationship between the searcher and the found user: already friends, request pending (incoming or outgoing), or no relationship, and the available action SHALL follow that status. A result that is an accepted friend SHALL offer the action to remove the friend; a result with a pending request SHALL NOT offer any add action; a result without a relationship SHALL offer the add action.

#### Scenario: Result already a friend

- **WHEN** the search result is an accepted friend
- **THEN** the result offers the action to remove the friend and does not offer an add action

#### Scenario: Result with a pending request

- **WHEN** a pending request already exists between the searcher and the found user in either direction
- **THEN** the result is marked as pending and no new request can be sent

#### Scenario: Result without a relationship

- **WHEN** the search result has no friendship and no pending request with the searcher
- **THEN** the result offers the action to send a friend request

### Requirement: Sending a friend request
The system SHALL let a user send a friend request to another existing user through the search result action. The system MUST reject a request addressed to the requester themselves, to an already accepted friend, or when a pending request between the two users already exists in either direction.

#### Scenario: Request sent
- **WHEN** the user activates the add action on an eligible search result
- **THEN** a pending request is persisted and the result's status changes to pending

#### Scenario: Duplicate request rejected
- **WHEN** the user activates the add action on a user who already has a pending request with them in either direction
- **THEN** the request is rejected and no duplicate is created

#### Scenario: Self request rejected
- **WHEN** the system processes a friend request addressed to the requester
- **THEN** the request is rejected

### Requirement: Outgoing requests visibility and withdrawal
The system SHALL let a user see the friend requests they have sent and withdraw a pending outgoing request. Withdrawing removes the pending request.

#### Scenario: Outgoing request listed
- **WHEN** the user has sent a friend request that is still pending
- **THEN** that request appears in the user's outgoing requests

#### Scenario: Outgoing request withdrawn
- **WHEN** the user withdraws a pending outgoing request
- **THEN** the pending request is removed and the other user no longer sees it as incoming

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
