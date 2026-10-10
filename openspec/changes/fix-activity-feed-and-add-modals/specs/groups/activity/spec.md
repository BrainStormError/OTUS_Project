## MODIFIED Requirements

### Requirement: Group activity tab
The group page SHALL provide an activity tab listing the group's latest activity events, newest first: created discussions, group ratings, and memberships. The feed SHALL NOT include comments. The feed SHALL only be available to group members.

#### Scenario: Activity listed
- **WHEN** a group member opens the activity tab
- **THEN** the group's latest events are listed newest first, each showing the actor, the action, and when it happened

#### Scenario: Comments are not listed
- **WHEN** a group member posts a comment in a discussion
- **THEN** no entry for that comment appears in the group's activity tab

#### Scenario: Member-only visibility
- **WHEN** a user who is not a member of the group attempts to view the group's activity
- **THEN** the attempt is rejected with a permission error

#### Scenario: Empty activity
- **WHEN** the group has no recorded activity
- **THEN** the tab shows the empty state

### Requirement: Activity covers discussions and ratings
The group activity feed SHALL include events for discussion creation, group ratings of films and series, and members joining the group. It SHALL NOT include events for comments. New events SHALL appear in the feed as they are recorded.

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
