## MODIFIED Requirements

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
