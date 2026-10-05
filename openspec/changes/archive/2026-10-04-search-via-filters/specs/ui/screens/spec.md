## MODIFIED Requirements

### Requirement: Home and search screen
Home SHALL present a filter-driven search panel labelled "Поиск", shortcuts to recent activity, and popular films, and SHALL present search results only after the user activates the "Найти" action. Home SHALL NOT present a statistics summary and SHALL NOT present a separate free-text search field.

#### Scenario: Home shows search and summary
- **WHEN** the user opens Home
- **THEN** a "Поиск" filter panel, a recent-activity area, and a popular-films area are present, with no statistics summary and no separate free-text search field

#### Scenario: Search applied only on submit
- **WHEN** the user changes filter values but has not activated the "Найти" action
- **THEN** Home does not show results yet

#### Scenario: Results after submit
- **WHEN** the user activates the "Найти" action
- **THEN** Home shows the results for the active filters

#### Scenario: Empty search state on Home
- **WHEN** the user has not submitted a search
- **THEN** Home shows recent activity and popular films instead of results

### Requirement: Search with filters
Search SHALL be performed through a single filter panel offering title, genre, actor, director, and year, and SHALL clearly show which filters are active with a way to reset them. Search SHALL NOT require a separate free-text query field. On Home the filter options SHALL be drawn from the whole film catalog; on My Films they SHALL be drawn only from the user's watched films.

#### Scenario: Applying filters
- **WHEN** the user sets one or more filters (title, genre, actor, director, year)
- **THEN** results reflect the active filters and each active filter is shown as a removable chip

#### Scenario: Resetting filters
- **WHEN** the user activates "reset"
- **THEN** all filters are cleared and results return to the unfiltered state

#### Scenario: No matching results
- **WHEN** a filter combination matches no films
- **THEN** the results area presents the empty state with an explanation

#### Scenario: Director filter available
- **WHEN** the filter panel is shown
- **THEN** a Режиссёр filter control is present alongside title, genre, actor, and year

#### Scenario: Options drawn from watched films on My Films
- **WHEN** the user opens the filter panel in My Films
- **THEN** the genre, actor, director, and year options contain only values present among the watched films, while the title filter accepts free text

#### Scenario: Catalog-wide options on Home
- **WHEN** the user opens the filter panel on Home
- **THEN** the genre, actor, director, and year options are drawn from the whole film catalog

### Requirement: My Films screen
My Films SHALL list the user's watched records, SHALL allow filtering that list through the filter panel whose genre, actor, director, and year options are limited to the watched films, and SHALL allow editing, deleting, and adding records through a modal. My Films SHALL NOT present statistics or a separate free-text search field.

#### Scenario: Records listed
- **WHEN** the user opens My Films
- **THEN** the watched films are listed with rating and date, and no statistics are shown

#### Scenario: Live search over watched films
- **WHEN** the user changes filter values in the My Films filter panel
- **THEN** the list immediately filters to matching watched films, using options limited to watched values except title, and does not require a separate search field

#### Scenario: Opening a record
- **WHEN** the user selects a film card
- **THEN** that record's comment expands in place, showing "Нет комментария" when the record has no comment, and the page does not navigate away

#### Scenario: Editing and deleting a record
- **WHEN** the user activates the edit action on a record
- **THEN** a modal opens to change the rating and comment and to delete the record

#### Scenario: Adding a record
- **WHEN** the user activates the add action
- **THEN** a modal opens, equivalent to the edit modal, to create a new watched record

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
