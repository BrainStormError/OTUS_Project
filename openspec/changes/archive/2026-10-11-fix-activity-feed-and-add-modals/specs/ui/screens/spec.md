## MODIFIED Requirements

### Requirement: My Films screen

My Films SHALL list the signed-in account's persisted watched records as a table with the columns Название, Оценка, and Дата просмотра, where Оценка is the user's own rating for the record, and the same records SHALL remain after a reload or a new sign-in. It SHALL allow the list to be filtered live through the always-visible filter panel whose genre, actor, director, and year options are limited to the watched films. Activating a column header SHALL sort the list by that column, toggling between ascending and descending order, and the default order SHALL be by Дата просмотра, newest first. Selecting any part of a record's row SHALL expand that record in place, and rows SHALL show a highlight on hover. The "Изменить" action SHALL be shown only inside a record's expanded area, at its right, rather than permanently in every row. Deleting a record SHALL be available inside the expanded area and SHALL require confirmation before the record is removed. My Films SHALL allow adding and editing records through a modal. When the modal is opened to add, it SHALL present the filter-driven search panel and SHALL NOT show a list of catalog films before the user activates the "Найти" action; after a search it SHALL offer only matching films that are not already among the user's watched records, so the same film cannot be added twice. My Films SHALL NOT present statistics or a separate free-text search field.

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

#### Scenario: No catalog list before a search

- **WHEN** the add modal for My Films is opened
- **THEN** no list of catalog films is shown until the user activates "Найти"

#### Scenario: Already watched films are not offered

- **WHEN** the user searches in the My Films add modal
- **THEN** films already present among the watched records are not offered for selection, so a film cannot be added twice

#### Scenario: Records persist per account

- **WHEN** the user saves a record and later reloads or signs in again
- **THEN** the record is still present for that account and is not taken from a per-browser sample

### Requirement: Add-rating search

The modal that opens when the user adds a rating SHALL present the same filter-driven search panel as Home — a free-text title field and multi-value genre, actor, director, and year filters with a "Найти" submit — and SHALL search the whole catalog of films and series rather than only the user's existing records. The modal SHALL NOT present a list of catalog entries before the user activates "Найти". After "Найти" it SHALL offer only matching entries, and when adding a film or series it SHALL exclude media already present in the user's records so the same film or series cannot be added twice. This add-modal search SHALL be distinct from, and SHALL NOT replace, the live in-list search.

#### Scenario: Add modal presents the filter panel

- **WHEN** the user activates the add action in My Films, My Series, or group ratings
- **THEN** the opened modal shows the search panel with a title field, genre, actor, director, and year filters, and a "Найти" action instead of only a plain text field

#### Scenario: Add search applied on submit

- **WHEN** the user changes add-modal filters but has not activated "Найти"
- **THEN** the picker does not apply the changed filters until "Найти" is activated, after which it offers matching catalog entries

#### Scenario: No list before a search

- **WHEN** the add modal is opened
- **THEN** no list of films or series is shown until the user activates "Найти"

#### Scenario: Catalog-wide options in the add modal

- **WHEN** the user opens the add-modal filters
- **THEN** genre, actor, director, and year options are drawn from the whole catalog, not from the user's already-added records

#### Scenario: Series picker omits actor and director

- **WHEN** the add modal is for series, which carry no actor or director data
- **THEN** title, genre, and year filters are offered, and the actor and director filters are not shown

#### Scenario: Already added media is excluded

- **WHEN** the user searches in the add modal of My Films or My Series
- **THEN** films or series already present in the user's records are not offered, so the same title cannot be added twice

#### Scenario: In-list search stays live

- **WHEN** the user changes filter values in the My Films, My Series, or group-ratings list itself
- **THEN** the list filters immediately without a submit action, and the add-modal search does not affect it
