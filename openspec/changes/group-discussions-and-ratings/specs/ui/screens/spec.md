## MODIFIED Requirements

### Requirement: Groups and admin panel
The groups section SHALL provide a list of the user's groups, a group card with members and group statistics, and an admin panel for managing members and roles. A group page SHALL be organized into tabs: Обсуждения, Оценки, Активность, Участники, and Статистика, each showing that part of the group's content.

#### Scenario: Group list and card
- **WHEN** the user opens Groups and selects a group
- **THEN** the group page presents the tab set Обсуждения, Оценки, Активность, Участники, Статистика

#### Scenario: Tab content
- **WHEN** the user opens each tab of a group page
- **THEN** the tab shows the group's discussions, group ratings, group activity, members, and group statistics respectively

#### Scenario: Admin management
- **WHEN** a user with the admin role opens the group admin panel
- **THEN** they can manage members, change roles, invite by handle, and remove members

#### Scenario: Non-admin access
- **WHEN** a non-admin user attempts to open the group admin panel
- **THEN** the panel presents a no-permission state instead of admin controls
