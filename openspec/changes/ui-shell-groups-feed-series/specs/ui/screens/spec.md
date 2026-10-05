## MODIFIED Requirements

### Requirement: Home and search screen
Home SHALL present an always-expanded, filter-driven search panel labelled "Поиск", covering both films and series, with a "Найти" action positioned on the same row as the label, to its right, together with a social activity feed and a popular-films area, and SHALL present search results only after the user activates the "Найти" action. Home SHALL NOT present a statistics summary and SHALL NOT present the user's own watch history, which is shown on the profile instead.

#### Scenario: Home shows search and summary
- **WHEN** the user opens Home
- **THEN** an always-expanded "Поиск" panel covering films and series, a social activity feed, and a popular-films area are present, and neither a statistics summary nor the user's own watch history is shown

#### Scenario: Submit action placement
- **WHEN** the Home search panel is displayed
- **THEN** the "Найти" action is shown on the same row as the "Поиск" label, to its right

#### Scenario: Search applied only on submit
- **WHEN** the user changes filter values but has not activated the "Найти" action
- **THEN** Home does not show results yet

#### Scenario: Results after submit
- **WHEN** the user activates the "Найти" action
- **THEN** Home shows the films and series matching the entered query and active filters

#### Scenario: Empty search state on Home
- **WHEN** the user has not submitted a search
- **THEN** Home shows the social activity feed and popular films instead of results

### Requirement: Profile screen
The application SHALL provide a profile screen for the current user and for other users, showing identity and the actions relevant to the relationship. The current user's profile SHALL show only their identity, statistics, and activity, and SHALL NOT contain settings or privacy entry points.

#### Scenario: Own profile
- **WHEN** the user opens their own profile
- **THEN** their identity, statistics, and activity are shown, and no settings or privacy controls are present

#### Scenario: Other user's profile
- **WHEN** the user opens another user's profile
- **THEN** their identity and, when permitted, statistics are shown with a relationship action such as adding a friend

### Requirement: Groups and admin panel
The groups section SHALL provide a list of the user's groups, a fully clickable group card showing the group's description and tags, and an admin panel for managing members and roles. The group card SHALL NOT show statistics; statistics remain on the group detail screen.

#### Scenario: Group list and card
- **WHEN** the user opens Groups and activates any part of a group card
- **THEN** the group's detail screen opens and the card shows only the group's name, description, and tags

#### Scenario: Group card content
- **WHEN** a group card is displayed
- **THEN** it shows the group's name, description, and tags, and does not show statistics

#### Scenario: Group detail shows statistics
- **WHEN** the user opens a group's detail screen
- **THEN** the group's members and statistics are shown

#### Scenario: Admin management
- **WHEN** a user with the admin role opens the group admin panel
- **THEN** they can manage members, change roles, invite by handle, and remove members

#### Scenario: Non-admin access
- **WHEN** a non-admin user attempts to open the group admin panel
- **THEN** the panel presents a no-permission state instead of admin controls

### Requirement: Settings screen
Settings SHALL be the single place for user settings and SHALL provide theme selection, the identity display preference, and privacy controls for the profile and statistics.

#### Scenario: Theme and privacy controls
- **WHEN** the user opens Settings
- **THEN** the theme selection, the identity display preference, and the profile and statistics privacy toggles are available

#### Scenario: Privacy change feedback
- **WHEN** the user toggles a privacy control
- **THEN** the control reflects the new value and provides a saving or saved indication

### Requirement: Shared component inventory
The screens SHALL be composed from a shared component inventory: film card, series card with season and episode levels, search field with filters, decimal rating input, comment field, statistic card, privacy toggle, identity display selector, friend and request list items, group card with tags, and admin member panel.

#### Scenario: Components reused across screens
- **WHEN** the same element appears on more than one screen
- **THEN** it is the shared component with consistent appearance and behavior

### Requirement: Scoped search in Friends and Groups
Friends and Groups SHALL provide a search that first matches the user's own friends or groups and, when nothing matches, falls back to searching all non-hidden profiles or groups. Group search SHALL match the group name, description, and tags.

#### Scenario: Friend found among own friends
- **WHEN** the user searches in Friends and a match exists among their friends
- **THEN** matching friends are shown

#### Scenario: Friend fallback to all profiles
- **WHEN** the user searches in Friends and no friend matches
- **THEN** matching non-hidden profiles are shown

#### Scenario: Group found among own groups
- **WHEN** the user searches in Groups and a match exists by the group's name, description, or tag
- **THEN** matching groups are shown

#### Scenario: Group fallback to all groups
- **WHEN** the user searches in Groups and no own group matches
- **THEN** matching non-hidden groups are shown

## ADDED Requirements

### Requirement: Social activity feed
Home SHALL present a vertically scrolling feed of the user's friends' and groups' watch activity, newest first, limited to the friends and groups the user has. Each entry SHALL identify its source as a friend or a group. Activity from hidden profiles SHALL NOT appear.

#### Scenario: Feed shows friends and groups
- **WHEN** the user has friends and groups with watch activity
- **THEN** Home shows their activity in a single feed ordered newest first

#### Scenario: Source identified
- **WHEN** a feed entry is displayed
- **THEN** the entry shows whether it came from a friend or a group, together with the title and rating

#### Scenario: Hidden profile excluded
- **WHEN** a friend has hidden their profile
- **THEN** that friend's activity does not appear in the feed

#### Scenario: Series included
- **WHEN** a friend or group has watched a series
- **THEN** the series event appears in the feed with the series' average rating

#### Scenario: Empty feed
- **WHEN** the user has no friends or groups with activity
- **THEN** the feed area presents an empty state

### Requirement: My Series screen
The application SHALL provide a My Series screen at its own route with a navigation entry directly below My Films. My Series SHALL list the user's series and allow searching, filtering, and sorting that list, adding, editing, and deleting series through modals, and expanding a series from its whole row. A series in per-episode mode with a single season SHALL expand directly to its episodes; with multiple seasons it SHALL expand to seasons and each season to its episodes. A series in whole-series mode SHALL NOT expand into seasons or episodes.

#### Scenario: Series listed
- **WHEN** the user opens My Series
- **THEN** the watched series are listed with their rating and date, and no statistics are shown

#### Scenario: Whole-row expansion
- **WHEN** the user activates a series row
- **THEN** the series expands in place without navigating away

#### Scenario: Single-season series expands to episodes
- **WHEN** a series in per-episode mode has one season and is expanded
- **THEN** its episodes are shown directly without a season level

#### Scenario: Multi-season series expands in two levels
- **WHEN** a series in per-episode mode has multiple seasons and is expanded
- **THEN** its seasons are shown, and expanding a season shows its episodes

#### Scenario: Whole-series mode has no expansion
- **WHEN** a series is in whole-series mode
- **THEN** expanding it does not present seasons or episodes

#### Scenario: Adding, editing, and deleting
- **WHEN** the user adds, edits, or deletes a series
- **THEN** the matching modal opens and the list reflects the change after saving

#### Scenario: Search, filters, and sorting
- **WHEN** the user types in the My Series search field, sets filters, or activates a column header
- **THEN** the list filters and sorts the same way it does on My Films

### Requirement: Series rating model
A series SHALL be rated in one of two modes, chosen when the series is added: per-episode or whole-series.

In per-episode mode, episodes carry ratings and comments, a season's average SHALL be the mean of its rated episodes, and a series' average SHALL be the mean of its season averages. Averages SHALL be computed immediately as ratings are set and SHALL NOT wait until every episode is rated. For a series with a single season, the series average SHALL be the season average.

In whole-series mode, the series SHALL carry a single rating and comment and SHALL NOT present seasons or episodes.

Ratings SHALL be mandatory: a series SHALL NOT be added without at least one rating — an episode rating in per-episode mode, or the whole-series rating in whole-series mode. Comments SHALL be optional at every level. The rating mode SHALL be changeable after the series is added, but changing it SHALL require confirmation that the ratings from the previous mode will be deleted, and on confirmation those ratings SHALL be removed. Individual ratings and comments SHALL be editable after they are set.

#### Scenario: Per-episode average over rated episodes
- **WHEN** a series in per-episode mode has some episodes rated and others not
- **THEN** each season average and the series average are computed over the rated episodes only

#### Scenario: Averages update immediately
- **WHEN** the user sets or changes an episode rating
- **THEN** the affected season average and series average update immediately

#### Scenario: Single-season series average
- **WHEN** a series in per-episode mode has a single season
- **THEN** the series average equals that season's average

#### Scenario: Whole-series rating
- **WHEN** a series is in whole-series mode
- **THEN** it presents a single series rating and comment with no season or episode ratings

#### Scenario: Rating required to add
- **WHEN** the user tries to add a series without any rating
- **THEN** the series is not added and a validation message is shown

#### Scenario: Changing mode deletes previous ratings
- **WHEN** the user changes a series' rating mode and confirms the deletion warning
- **THEN** the ratings from the previous mode are removed and the new mode is applied

#### Scenario: Ratings and comments are editable
- **WHEN** the user edits an episode rating, a season, or a series rating or comment
- **THEN** the change is saved and any dependent averages update
