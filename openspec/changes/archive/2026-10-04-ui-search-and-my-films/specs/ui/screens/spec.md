## MODIFIED Requirements

### Requirement: Home and search screen
Home SHALL combine a film search field with shortcuts to recent activity and popular films, and SHALL present search results only after the user submits a search. Home SHALL NOT present a statistics summary.

#### Scenario: Home shows search and summary
- **WHEN** the user opens Home
- **THEN** a search field, a filter entry point, a recent-activity area, and a popular-films area are present, and no statistics summary is shown

#### Scenario: Search applied only on submit
- **WHEN** the user types a query but has not activated the "Найти" action
- **THEN** Home does not show results yet

#### Scenario: Results after submit
- **WHEN** the user activates the "Найти" action
- **THEN** Home shows the results for the entered query and active filters

#### Scenario: Empty search state on Home
- **WHEN** the user has not submitted a search
- **THEN** Home shows recent activity and popular films instead of results

### Requirement: My Films screen
My Films SHALL list the user's watched records, SHALL allow searching that list, and SHALL allow editing, deleting, and adding records through a modal. My Films SHALL NOT present statistics.

#### Scenario: Records listed
- **WHEN** the user opens My Films
- **THEN** the watched films are listed with rating and date, and no statistics are shown

#### Scenario: Live search over watched films
- **WHEN** the user types in the My Films search field
- **THEN** the list immediately filters to matching watched films, using the same search fields as Home

#### Scenario: Opening a record
- **WHEN** the user selects a film card
- **THEN** that record's comment expands in place, showing "Нет комментария" when the record has no comment, and the page does not navigate away

#### Scenario: Editing and deleting a record
- **WHEN** the user activates the edit action on a record
- **THEN** a modal opens to change the rating and comment and to delete the record

#### Scenario: Adding a record
- **WHEN** the user activates the add action
- **THEN** a modal opens, equivalent to the edit modal, to create a new watched record

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

## ADDED Requirements

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
