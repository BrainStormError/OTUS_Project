## Purpose

Defines the required screens and their composition: discovery and search, the film card with rating and comment, profiles and statistics, friends, groups with an admin panel, and settings.

## ADDED Requirements

### Requirement: Home and search screen
Home SHALL combine a global film search field with shortcuts to recent activity and a compact summary of the user's statistics.

#### Scenario: Home shows search and summary
- **WHEN** the user opens Home
- **THEN** a search field, a filter entry point, a recent-activity area, and a compact statistics summary are present

#### Scenario: Empty search state on Home
- **WHEN** the user has not entered a query
- **THEN** Home shows recent activity or suggestions instead of results

### Requirement: Search with filters
The search experience SHALL allow filtering results by title, genre, actor, and year, and SHALL clearly show which filters are active with a way to reset them.

#### Scenario: Applying filters
- **WHEN** the user sets one or more filters (title, genre, actor, year)
- **THEN** results reflect the active filters and each active filter is shown as a removable chip

#### Scenario: Resetting filters
- **WHEN** the user activates "reset"
- **THEN** all filters are cleared and results return to the unfiltered query

#### Scenario: No matching results
- **WHEN** a query or filter combination matches no films
- **THEN** the results area presents the empty state with an explanation

### Requirement: Film card
A film card SHALL present a poster, title, year, external rating, genres, and an action to mark the film as watched, and SHALL provide a fallback when no poster is available.

#### Scenario: Card content
- **WHEN** a film card is displayed
- **THEN** it shows poster, title, year, external rating, genres, and a "watched" action

#### Scenario: Missing poster
- **WHEN** a film has no poster image
- **THEN** the card shows a neutral placeholder instead of a broken image

### Requirement: Rating and comment form
The rating and comment form SHALL capture a rating from 0 to 10 including a decimal part, an optional comment, and a watch date, and SHALL validate the rating range before saving.

#### Scenario: Enter a decimal rating
- **WHEN** the user enters a rating between 0 and 10 with a decimal part
- **THEN** the value is accepted and shown with its decimal part

#### Scenario: Out-of-range rating rejected
- **WHEN** the user enters a rating below 0 or above 10
- **THEN** the form shows a validation message and does not save

#### Scenario: Saved record reflects input
- **WHEN** the user saves a valid rating and comment
- **THEN** the film appears in My Films with the entered rating, comment, and date

### Requirement: My Films screen
My Films SHALL list the user's watched records and SHALL allow opening an individual record.

#### Scenario: Records listed
- **WHEN** the user opens My Films
- **THEN** the watched films are listed with rating and date

#### Scenario: Opening a record
- **WHEN** the user selects a record
- **THEN** the corresponding film view opens within the depth budget

### Requirement: Profile screen
The application SHALL provide a profile screen for the current user and for other users, showing identity and the actions relevant to the relationship.

#### Scenario: Own profile
- **WHEN** the user opens their own profile
- **THEN** their identity, statistics, and recent records are shown with edit and privacy entry points

#### Scenario: Other user's profile
- **WHEN** the user opens another user's profile
- **THEN** their identity and, when permitted, statistics are shown with a relationship action such as adding a friend

### Requirement: Statistics presentation
Statistics SHALL present the number of films, the average rating, a genre breakdown, and a year distribution using dedicated statistic cards.

#### Scenario: Statistics displayed
- **WHEN** statistics are available and not restricted
- **THEN** count, average rating, genre breakdown, and year distribution are shown as statistic cards

#### Scenario: Restricted statistics
- **WHEN** the owner has hidden their statistics and the viewer is not permitted
- **THEN** the statistics area shows the hidden state instead of values

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
