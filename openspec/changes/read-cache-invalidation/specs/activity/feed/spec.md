## ADDED Requirements

### Requirement: Relationship and membership changes reach affected users

The system SHALL record an invalidation signal when an accepted friendship ends, a user leaves a group, a user is removed from a group, or a group is dissolved, and SHALL record it in the same transaction as the change so a signal exists if and only if the change succeeded. Each signal SHALL be delivered to every connected client of the user whose cached data the change affects, over the real-time stream. An invalidation signal SHALL NOT be shown in the activity feed and SHALL be pruned under the same retention rules as activity events.

#### Scenario: Friendship removal reaches the other user

- **WHEN** a user removes an accepted friendship
- **THEN** the other user's connected clients receive a signal for the change

#### Scenario: Leaving or being removed reaches the member

- **WHEN** a user leaves a group or is removed from a group by an administrator
- **THEN** that user's connected clients receive a signal for the change

#### Scenario: Dissolution reaches every member

- **WHEN** a group is dissolved
- **THEN** every member's connected clients receive a signal for the change

#### Scenario: Signals are hidden from the feed

- **WHEN** the activity feed is read or streamed
- **THEN** invalidation signals are not listed among its entries

#### Scenario: A failed change leaves no signal

- **WHEN** a relationship or membership change fails
- **THEN** no invalidation signal is recorded
