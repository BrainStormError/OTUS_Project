# ui/screens Specification

## Purpose
Defines the required screens and their composition: discovery and search, the film card with rating and comment, profiles and statistics, friends, groups with an admin panel, and settings.

## Requirements

### Requirement: Home and search screen
Home SHALL present an always-expanded filter-driven search panel labelled "Поиск" with a "Найти" action positioned on the same row as the label, to its right, and SHALL present search results only after the user activates the "Найти" action. Home SHALL also present shortcuts to recent activity and popular films, SHALL NOT present a statistics summary, and SHALL NOT present a separate free-text search field.

#### Scenario: Home shows search and summary
- **WHEN** the user opens Home
- **THEN** an always-expanded "Поиск" panel, a recent-activity area, and a popular-films area are present, with no statistics summary and no separate free-text search field

#### Scenario: Submit action placement
- **WHEN** the Home search panel is displayed
- **THEN** the "Найти" action is shown on the same row as the "Поиск" label, to its right

#### Scenario: Search applied only on submit
- **WHEN** the user changes filter values but has not activated the "Найти" action
- **THEN** Home does not show results yet

#### Scenario: Results after submit
- **WHEN** the user activates the "Найти" action
- **THEN** Home shows the results for all active filters

#### Scenario: Empty search state on Home
- **WHEN** the user has not submitted a search
- **THEN** Home shows recent activity and popular films instead of results

### Requirement: Search with filters
Search SHALL be performed through a single always-visible filter panel offering a free-text title field and multi-value genre, actor, director, and year filters selected from a dropdown, and SHALL clearly show which filters are active with a way to reset them. Each multi-value filter's option list SHALL stay collapsed until the user opens that filter's dropdown. Active values SHALL be shown grouped as a single block per filter, and each value SHALL be individually removable. For a multi-value filter, a film SHALL match when it satisfies any one of the selected values; a film SHALL match the whole search only when it satisfies every active filter. Search SHALL NOT require a separate free-text query field and SHALL NOT offer a rating filter. On Home the filter options SHALL be drawn from the whole film catalog; on My Films they SHALL be drawn only from the user's watched films.

#### Scenario: Applying filters
- **WHEN** the user opens a filter's dropdown and selects one value
- **THEN** results reflect that value and it is shown within that filter's active-values block as an individually removable value

#### Scenario: Options collapsed until opened
- **WHEN** the filter panel is displayed
- **THEN** each multi-value filter's option list is collapsed until the user opens that filter's dropdown

#### Scenario: Multiple values within one filter
- **WHEN** the user selects several values in the same filter (for example several genres or several actors)
- **THEN** films matching any of the selected values are shown

#### Scenario: Active values grouped per filter
- **WHEN** several values are selected in one filter
- **THEN** those values are shown together in a single block for that filter, and removing one value leaves the others selected

#### Scenario: Combining filters
- **WHEN** the user has more than one active filter
- **THEN** only films satisfying every active filter are shown

#### Scenario: Resetting filters
- **WHEN** the user activates "reset"
- **THEN** all filters are cleared and results return to the unfiltered state

#### Scenario: No matching results
- **WHEN** a filter combination matches no films
- **THEN** the results area presents the empty state with an explanation

#### Scenario: No rating filter
- **WHEN** the filter panel is shown
- **THEN** no rating (оценка) filter control is present

#### Scenario: Director filter available
- **WHEN** the filter panel is shown
- **THEN** a Режиссёр filter control is present alongside title, genre, actor, and year

#### Scenario: Options drawn from watched films on My Films
- **WHEN** the user opens the filter panel in My Films
- **THEN** the genre, actor, director, and year options contain only values present among the watched films, while the title filter accepts free text

#### Scenario: Catalog-wide options on Home
- **WHEN** the user opens the filter panel on Home
- **THEN** the genre, actor, director, and year options are drawn from the whole film catalog

### Requirement: Film card
A film card SHALL present a poster, title, year, external rating, genres, and an action to mark the film as watched, and SHALL provide a fallback when no poster is available. Activating the watched action SHALL open the rating and comment form for that film. When a film is watched, the card SHALL show a small check indicator in a corner that reveals the label "Просмотрено" on hover.

#### Scenario: Card content
- **WHEN** a film card is displayed
- **THEN** it shows poster, title, year, external rating, genres, and a "watched" action

#### Scenario: Missing poster
- **WHEN** a film has no poster image
- **THEN** the card shows a neutral placeholder instead of a broken image

#### Scenario: Watched action opens the rating form
- **WHEN** the user activates the watched action on a card
- **THEN** the rating and comment form opens for that film

#### Scenario: Watched indicator
- **WHEN** a card represents a film the user has watched
- **THEN** a small check indicator is shown in a corner of the card and reveals "Просмотрено" on hover

### Requirement: Rating and comment form
The rating and comment form SHALL capture a rating from 0 to 10 including a decimal part entered in steps of 0.1, an optional comment, and a watch date, and SHALL validate the rating range before saving.

#### Scenario: Enter a decimal rating
- **WHEN** the user enters a rating between 0 and 10 with a decimal part
- **THEN** the value is accepted and shown with its decimal part

#### Scenario: Rating step is 0.1
- **WHEN** the user adjusts the rating control
- **THEN** the rating changes in increments of 0.1

#### Scenario: Out-of-range rating rejected
- **WHEN** the user enters a rating below 0 or above 10
- **THEN** the form shows a validation message and does not save

#### Scenario: Saved record reflects input
- **WHEN** the user saves a valid rating and comment
- **THEN** the film appears in My Films with the entered rating, comment, and date

### Requirement: My Films screen
My Films SHALL list the user's watched records as a table with the columns Название, Оценка, and Дата просмотра, where Оценка is the user's own rating for the record, and SHALL allow the list to be filtered live through the always-visible filter panel whose genre, actor, director, and year options are limited to the watched films. Activating a column header SHALL sort the list by that column, toggling between ascending and descending order, and the default order SHALL be by Дата просмотра, newest first. Selecting any part of a record's row SHALL expand that record in place, and rows SHALL show a highlight on hover. The "Изменить" action SHALL be shown only inside a record's expanded area, at its right, rather than permanently in every row. Deleting a record SHALL be available inside the expanded area and SHALL require confirmation before the record is removed. My Films SHALL allow adding and editing records through a modal. My Films SHALL NOT present statistics or a separate free-text search field.

#### Scenario: Records listed
- **WHEN** the user opens My Films
- **THEN** the watched films are listed in a table showing Название, Оценка, and Дата просмотра for each record, and no statistics are shown

#### Scenario: Default order newest first
- **WHEN** the user opens My Films without having sorted a column
- **THEN** the records are ordered by Дата просмотра, newest first

#### Scenario: Sorting by a column header
- **WHEN** the user activates the Название, Оценка, or Дата просмотра header
- **THEN** the list is sorted by that column, and activating the same header again reverses the order

#### Scenario: Live search over watched films
- **WHEN** the user changes filter values in the My Films filter panel
- **THEN** the table immediately filters to matching watched films, using options limited to watched values, and does not require a separate search field or a submit action

#### Scenario: Opening a record
- **WHEN** the user selects any part of a record's row
- **THEN** that record's comment expands in place, showing "Нет комментария" when the record has no comment, and the page does not navigate away

#### Scenario: Row hover highlight
- **WHEN** the pointer rests over a record's row
- **THEN** the row is highlighted

#### Scenario: Edit action not permanently visible
- **WHEN** the list is displayed and no record is expanded
- **THEN** the edit action is not permanently shown in the records, and inside an expanded record it appears at the right of the expanded area

#### Scenario: Editing and deleting a record
- **WHEN** the user activates the edit action inside an expanded record
- **THEN** a modal opens to change the rating and comment, and the record can be deleted from its expanded area after a confirmation

#### Scenario: Delete requires confirmation
- **WHEN** the user activates the delete action inside an expanded record
- **THEN** a confirmation is requested and the record is removed only after the user confirms, while cancelling leaves the record in place

#### Scenario: Adding a record
- **WHEN** the user activates the add action
- **THEN** a modal opens, equivalent to the edit modal, to create a new watched record

### Requirement: Profile screen
The application SHALL provide a profile screen for the current user and for other users, showing identity and the actions relevant to the relationship.

#### Scenario: Own profile
- **WHEN** the user opens their own profile
- **THEN** their identity, statistics, and recent records are shown with edit and privacy entry points

#### Scenario: Other user's profile
- **WHEN** the user opens another user's profile
- **THEN** their identity and, when permitted, statistics are shown with a relationship action such as adding a friend

### Requirement: Statistics presentation
Statistics SHALL present the number of films, the average rating, a genre breakdown, and a year distribution using dedicated statistic cards, and SHALL appear only as dedicated screens in Profile and Groups.

#### Scenario: Statistics displayed
- **WHEN** statistics are available and not restricted
- **THEN** count, average rating, genre breakdown, and year distribution are shown as statistic cards

#### Scenario: Restricted statistics
- **WHEN** the owner has hidden their statistics and the viewer is not permitted
- **THEN** the statistics area shows the hidden state instead of values

#### Scenario: Statistics only in Profile and Groups
- **WHEN** the user opens Home or My Films
- **THEN** no statistics are shown there

### Requirement: Friends screen
The friends section SHALL provide profile search, incoming and outgoing requests, and the list of current friends.

#### Scenario: Searching profiles
- **WHEN** the user searches for a profile
- **THEN** matching users are listed with an action to send a friend request

#### Scenario: Managing requests
- **WHEN** a user has incoming friend requests
- **THEN** each request offers accept and decline actions, and the pending count is visible

#### Scenario: Friend list
- **WHEN** the user views their friends
- **THEN** current friends are listed with a link to each profile

### Requirement: Groups and admin panel
The groups section SHALL provide a list of the user's groups, a group card with members and group statistics, and an admin panel for managing members and roles.

#### Scenario: Group list and card
- **WHEN** the user opens Groups and selects a group
- **THEN** the group card shows its members and group statistics within the depth budget

#### Scenario: Admin management
- **WHEN** a user with the admin role opens the group admin panel
- **THEN** they can manage members, change roles, invite by handle, and remove members

#### Scenario: Non-admin access
- **WHEN** a non-admin user attempts to open the group admin panel
- **THEN** the panel presents a no-permission state instead of admin controls

### Requirement: Settings screen
Settings SHALL provide theme selection and privacy controls for the profile and statistics.

#### Scenario: Theme and privacy controls
- **WHEN** the user opens Settings
- **THEN** the theme selection and the profile and statistics privacy toggles are available

#### Scenario: Privacy change feedback
- **WHEN** the user toggles a privacy control
- **THEN** the control reflects the new value and provides a saving or saved indication

### Requirement: Shared component inventory
The screens SHALL be composed from a shared component inventory: film card, search field with filters, decimal rating input, comment field, statistic card, privacy toggle, friend and request list items, group card, and admin member panel.

#### Scenario: Components reused across screens
- **WHEN** the same element appears on more than one screen
- **THEN** it is the shared component with consistent appearance and behavior

### Requirement: Scoped search in Friends and Groups
Friends and Groups SHALL provide a search that first matches the user's own friends or groups and, when nothing matches, falls back to searching all non-hidden profiles or groups.

#### Scenario: Friend found among own friends
- **WHEN** the user searches in Friends and a match exists among their friends
- **THEN** matching friends are shown

#### Scenario: Friend fallback to all profiles
- **WHEN** the user searches in Friends and no friend matches
- **THEN** matching non-hidden profiles are shown

#### Scenario: Group found among own groups
- **WHEN** the user searches in Groups and a match exists among their groups
- **THEN** matching groups are shown

#### Scenario: Group fallback to all groups
- **WHEN** the user searches in Groups and no own group matches
- **THEN** matching non-hidden groups are shown
