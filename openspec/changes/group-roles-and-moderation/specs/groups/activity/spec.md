## MODIFIED Requirements

### Requirement: Activity covers discussions and ratings

The group activity feed SHALL include events for discussion creation, group ratings of films and series, and members joining the group. It SHALL NOT include events for comments. New events SHALL appear in the feed as they are recorded. When an owner deletes a discussion or a group's media entry, the group activity events that reference the removed content SHALL be removed so the feed retains no entry for content that no longer exists in the group.

#### Scenario: Discussion event in feed

- **WHEN** an administrator creates a discussion in the group
- **THEN** the activity feed contains an entry that the discussion was created and by whom

#### Scenario: Rating event in feed

- **WHEN** a member rates a film in the group
- **THEN** the activity feed contains an entry that the film was rated, with the media title and rating

#### Scenario: Join event in feed

- **WHEN** a user joins the group
- **THEN** the activity feed contains an entry that the user joined

#### Scenario: Comment not in feed

- **WHEN** a member posts a comment in a discussion
- **THEN** the activity feed contains no entry for that comment

#### Scenario: Deleted content leaves no feed entry

- **WHEN** the owner deletes a discussion or a media entry from the group
- **THEN** the activity feed no longer contains an entry referencing the deleted content
