## Purpose

Defines the group's activity feed: the group page tab that shows the group's latest events (discussions, comments, group ratings, memberships) with member-only visibility and navigation to discussions attached to rated media.

## ADDED Requirements

### Requirement: Group activity tab
The group page SHALL provide an activity tab listing the group's latest activity events, newest first: created discussions, posted comments, group ratings, and memberships. The feed SHALL only be available to group members.

#### Scenario: Activity listed
- **WHEN** a group member opens the activity tab
- **THEN** the group's latest events are listed newest first, each showing the actor, the action, and when it happened

#### Scenario: Member-only visibility
- **WHEN** a user who is not a member of the group attempts to view the group's activity
- **THEN** the attempt is rejected with a permission error

#### Scenario: Empty activity
- **WHEN** the group has no recorded activity
- **THEN** the tab shows the empty state

### Requirement: Activity covers discussions and ratings
The group activity feed SHALL include events for discussion creation, comments, group ratings of films and series, and members joining the group. New events SHALL appear in the feed as they are recorded.

#### Scenario: Discussion event in feed
- **WHEN** an administrator creates a discussion in the group
- **THEN** the activity feed contains an entry that the discussion was created and by whom

#### Scenario: Rating event in feed
- **WHEN** a member rates a film in the group
- **THEN** the activity feed contains an entry that the film was rated, with the media title and rating

#### Scenario: Join event in feed
- **WHEN** a user joins the group
- **THEN** the activity feed contains an entry that the user joined

### Requirement: Navigation to attached discussion
An activity feed entry for a rating whose media has an attached discussion SHALL offer a control to navigate to that discussion. The control SHALL be present even when the discussion was attached after the rating event was recorded.

#### Scenario: Button to discussion
- **WHEN** the activity feed shows a rating event for media with an attached discussion
- **THEN** the entry offers a control leading to that discussion

#### Scenario: No attached discussion
- **WHEN** the activity feed shows a rating event for media without an attached discussion
- **THEN** the entry offers no discussion control

#### Scenario: Discussion attached later
- **WHEN** an administrator attaches a discussion to media after its rating event was recorded
- **THEN** the previously recorded rating entry now offers the control leading to that discussion
