## MODIFIED Requirements

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
