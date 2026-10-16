# groups/discussions Specification

## Purpose
Defines the group forum: discussions (topics) created by group administrators, comments contributed by all group members, and the group's discussions tab listing its topics.

## Requirements

### Requirement: Creating group discussions
Only a group administrator SHALL be able to create a discussion (topic) in that group. A discussion SHALL have a title provided by its author. Non-admin members and non-members MUST be rejected when attempting to create a discussion.

#### Scenario: Admin creates a topic
- **WHEN** a group administrator creates a discussion with a title
- **THEN** the discussion is persisted in the group and appears in the group's discussion list

#### Scenario: Non-admin creation rejected
- **WHEN** a group member without the admin role attempts to create a discussion
- **THEN** the attempt is rejected with a permission error

#### Scenario: Non-member rejected
- **WHEN** a user who is not a member of the group attempts to create a discussion in it
- **THEN** the attempt is rejected with a permission error

### Requirement: Commenting in discussions

Every member of the group SHALL be able to post comments in the group's discussions. Comments SHALL be listed in the discussion in chronological order, and each comment SHALL show its author and when it was posted. The posted moment SHALL be shown in the interface's selected timezone and in the consistent timestamp format.

#### Scenario: Member comments

- **WHEN** a group member submits a comment in a discussion
- **THEN** the comment is persisted and appears in the discussion with the author's name

#### Scenario: Comments in chronological order

- **WHEN** a discussion with several comments is opened
- **THEN** the comments are listed oldest first

#### Scenario: Comment shows when it was posted

- **WHEN** a comment is displayed
- **THEN** it shows the moment it was posted in the interface's selected timezone and consistent timestamp format

#### Scenario: Non-member cannot comment

- **WHEN** a user who is not a group member attempts to comment in the group's discussion
- **THEN** the attempt is rejected with a permission error

### Requirement: Discussions tab
The group page SHALL provide a discussions tab listing the group's discussions, newest first, with each entry showing its title, author, and comment count. Selecting a discussion SHALL open it with its comments and a comment form for group members.

#### Scenario: Discussion list
- **WHEN** a group member opens the discussions tab
- **THEN** the group's discussions are listed newest first with title, author, and comment count

#### Scenario: Opening a discussion
- **WHEN** a group member selects a discussion
- **THEN** the discussion opens showing its comments and, for members, a comment form

#### Scenario: Empty discussions tab
- **WHEN** the group has no discussions
- **THEN** the tab shows the empty state explaining that an administrator can create the first discussion

### Requirement: Discussion creation event
Creating a discussion SHALL be recorded as a group activity event visible in the group's activity feed. Posting a comment SHALL NOT be recorded as a group activity event.

#### Scenario: Topic creation recorded
- **WHEN** an administrator creates a discussion in the group
- **THEN** a group activity event is recorded referencing that discussion

#### Scenario: Comment not recorded
- **WHEN** a member posts a comment in the group's discussion
- **THEN** no group activity event is recorded for that comment
