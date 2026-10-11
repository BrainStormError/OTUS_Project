## MODIFIED Requirements

### Requirement: Groups and admin panel

The groups section SHALL provide a list of the user's groups, a fully clickable group card, a control to create a new group that opens a modal for its name, description, tags, and visibility, and an owner panel for editing the group's settings and managing members, roles, invitations, and ownership. Any signed-in user SHALL be able to create a group, and creating it SHALL open its page. A group page SHALL be organized into tabs: Обсуждения, Оценки, Активность, Участники, and Статистика, each showing that part of the group's content. The group detail screen SHALL show the group's members and statistics. The section SHALL show the signed-in user's pending group invitations with accept and decline actions. Controls that delete content — deleting a discussion, a comment, or a whole media entry — SHALL be shown only to the owner, and additive controls (inviting users, starting a discussion or media, commenting, rating) SHALL be shown to the owner and moderators.

#### Scenario: Group list and card

- **WHEN** the user opens Groups and activates any part of a group card
- **THEN** the group's detail screen opens and the card shows only the group's name, description, and tags

#### Scenario: Group card content

- **WHEN** a group card is displayed
- **THEN** it shows the group's name, description, and tags, and does not show statistics

#### Scenario: Group detail shows statistics

- **WHEN** the user opens a group's detail screen
- **THEN** the group's members and statistics are shown

#### Scenario: Tab content

- **WHEN** the user opens each tab of a group page
- **THEN** the tab shows the group's discussions, group ratings, group activity, members, and group statistics respectively

#### Scenario: Admin management

- **WHEN** the owner opens the group panel
- **THEN** they can edit the group's settings, manage members and roles, invite users by search, remove members, transfer ownership, and use the controls that delete content

#### Scenario: Moderator additive controls

- **WHEN** a moderator opens the group panel
- **THEN** they can invite users, start discussions and media, comment, and rate, and are shown no controls that delete content or manage members and roles

#### Scenario: Member controls

- **WHEN** an ordinary member opens the group
- **THEN** they are offered only commenting and rating, and no administrative or destructive controls

#### Scenario: Non-admin access

- **WHEN** a user who is not a member of the group attempts to open the group panel
- **THEN** the panel presents a no-permission state instead of administrative controls

#### Scenario: Group created from the section

- **WHEN** a signed-in user opens the creation modal, fills in a name and optional details, and confirms
- **THEN** the group is created and its page is opened

#### Scenario: Duplicate name shown as an error

- **WHEN** the creation modal is submitted with a name that collides with an existing group by letter case
- **THEN** the modal shows an error and no group is created

#### Scenario: Pending invitations shown

- **WHEN** a signed-in user has pending group invitations
- **THEN** the groups section lists them with accept and decline actions
