## MODIFIED Requirements

### Requirement: Activity events are recorded with the change
The system SHALL record an activity event when a feed-relevant action occurs — a user rates a film or series, a friend request is accepted, a user joins a group, or a group administrator creates a discussion — and SHALL record that event in the same transaction as the action, so an event exists if and only if the action succeeded. Posting a comment in a discussion SHALL NOT record an activity event, and no activity event for a comment SHALL be shown.

#### Scenario: Rating records an event
- **WHEN** a user saves a watched record with a rating
- **THEN** an activity event for that rating is recorded with the user, the film, the rating value, and the watch date

#### Scenario: Discussion creation records an event
- **WHEN** a group administrator creates a discussion in a group
- **THEN** exactly one activity event for the discussion creation is recorded, carrying the group and the discussion

#### Scenario: Comment records no event
- **WHEN** a group member posts a comment in a discussion
- **THEN** no activity event is recorded for the comment

#### Scenario: Accepting a friendship records an event
- **WHEN** a user accepts a friend request
- **THEN** an activity event for the new friendship is recorded

#### Scenario: Joining a group records an event
- **WHEN** a user joins a group
- **THEN** an activity event for the membership is recorded

#### Scenario: Failed action records no event
- **WHEN** a feed-relevant action fails
- **THEN** no activity event is recorded for it
