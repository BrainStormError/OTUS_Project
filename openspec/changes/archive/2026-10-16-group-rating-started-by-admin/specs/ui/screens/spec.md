## MODIFIED Requirements

### Requirement: Groups and admin panel

The groups section SHALL provide a list of the user's groups, a fully clickable group card, a control to create a new group that opens a modal for its name, description, tags, and visibility, and an admin panel for editing the group's settings and managing members, roles, and invitations. Any signed-in user SHALL be able to create a group, and creating it SHALL open its page. A group page SHALL be organized into tabs: Обсуждения, Оценки, Активность, Участники, and Статистика, each showing that part of the group's content. The group detail screen SHALL show the group's members and statistics. The section SHALL show the signed-in user's pending group invitations with accept and decline actions. In the admin panel, sending an invitation SHALL switch that user's action to a non-interactive "Отправлено" state and SHALL NOT allow a second invitation to the same user while one is pending. The admin panel SHALL NOT offer removing the administrator's own membership, and SHALL offer a "Распустить группу" action for an administrator. In the Оценки tab the control that starts a media SHALL be offered only to an administrator, while rating a listed media SHALL be offered from that media's row: a row SHALL offer Оценить when the signed-in user has no rating for that media and Изменить when the user already has one, and SHALL show a К обсуждению action alongside when a discussion is attached to that media.

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

- **WHEN** a user with the admin role opens the group admin panel
- **THEN** they can edit the group's settings, manage members and roles, invite users by search, and remove members other than themselves

#### Scenario: Non-admin access

- **WHEN** a non-admin user attempts to open the group admin panel
- **THEN** the panel presents a no-permission state instead of admin controls

#### Scenario: Group created from the section

- **WHEN** a signed-in user opens the creation modal, fills in a name and optional details, and confirms
- **THEN** the group is created and its page is opened

#### Scenario: Duplicate name shown as an error

- **WHEN** the creation modal is submitted with a name that collides with an existing group by letter case
- **THEN** the modal shows an error and no group is created

#### Scenario: Pending invitations shown

- **WHEN** a signed-in user has pending group invitations
- **THEN** the groups section lists them with accept and decline actions

#### Scenario: Invitation reflects its sent state

- **WHEN** an administrator sends an invitation to a user in the admin panel
- **THEN** that user's action shows "Отправлено" and is no longer actionable

#### Scenario: A pending invitation cannot be sent twice

- **WHEN** a user already has a pending invitation in the admin panel
- **THEN** the invite action is not available for that user again until the invitation is withdrawn

#### Scenario: Self-removal is not offered

- **WHEN** an administrator views their own row in the member list of the admin panel
- **THEN** no action to remove themselves is offered

#### Scenario: Member leaves the group

- **WHEN** a non-administrator member uses the leave action
- **THEN** the group is removed from their group list

#### Scenario: Administrator dissolves the group

- **WHEN** an administrator uses the "Распустить группу" action and confirms
- **THEN** the group is dissolved and the user is returned to the groups section without the group

#### Scenario: Administrator is offered the start control

- **WHEN** an administrator opens the Оценки tab
- **THEN** the control that starts a media is offered

#### Scenario: Member is not offered the start control

- **WHEN** a member who is not an administrator opens the Оценки tab
- **THEN** no control that starts a media is offered

#### Scenario: Member rates a started media from its row

- **WHEN** a member opens the Оценки tab and a listed media has no rating from that member
- **THEN** that media's row offers an Оценить action

#### Scenario: Rate action becomes an edit action

- **WHEN** a member has already rated a media listed in the Оценки tab
- **THEN** that media's row offers Изменить instead of Оценить

#### Scenario: Discussion link sits beside the rate action

- **WHEN** a listed media in the Оценки tab has an attached discussion
- **THEN** that media's row offers К обсуждению together with the rate action
