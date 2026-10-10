## MODIFIED Requirements

### Requirement: Discussion creation event
Creating a discussion SHALL be recorded as a group activity event visible in the group's activity feed. Posting a comment SHALL NOT be recorded as a group activity event.

#### Scenario: Topic creation recorded
- **WHEN** an administrator creates a discussion in the group
- **THEN** a group activity event is recorded referencing that discussion

#### Scenario: Comment not recorded
- **WHEN** a member posts a comment in the group's discussion
- **THEN** no group activity event is recorded for that comment
