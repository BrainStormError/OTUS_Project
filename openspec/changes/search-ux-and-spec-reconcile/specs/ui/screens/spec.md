## MODIFIED Requirements

### Requirement: Home and search screen
Home SHALL present an always-expanded filter-driven search panel labelled "Поиск" with a kind selector that switches the search between films and series, a filter grid, and a "Найти" action presented as a full-width primary button below the filter grid. Home SHALL present search results only after the user activates the "Найти" action. Home SHALL also present a real-time, scrollable social activity feed of friends' and groups' activity and a popular-films area drawn from TMDB, SHALL NOT present a statistics summary, and SHALL NOT present a separate free-text search field. The activity feed SHALL show the five most recent entries by default with a control to show 10 or 25 instead, SHALL grow its container to fit the selected number of entries, and SHALL add newly arrived entries without a page reload while preserving the viewer's scroll position. The results area SHALL present titles one page at a time and SHALL offer a "Показать ещё" control at the end of the displayed results that appends the next page; activating a new search SHALL reset the results to the first page.

#### Scenario: Home shows search and summary
- **WHEN** the user opens Home
- **THEN** an always-expanded "Поиск" panel, a real-time activity feed, and a popular-films area are present, with no statistics summary and no separate free-text search field

#### Scenario: Submit action placement
- **WHEN** the Home search panel is displayed
- **THEN** the "Найти" action is shown as a full-width primary button below the filter grid, and not in the panel's header row

#### Scenario: Search applied only on submit
- **WHEN** the user changes filter values but has not activated the "Найти" action
- **THEN** Home does not show results yet

#### Scenario: Results after submit
- **WHEN** the user activates the "Найти" action
- **THEN** Home shows the first page of results for the selected kind and all active filters

#### Scenario: Load more results
- **WHEN** more results are available than the current page shows and the user activates "Показать ещё"
- **THEN** the next page of results is appended to the displayed results and the control remains available while further pages exist

#### Scenario: New search resets paging
- **WHEN** the user submits a new search
- **THEN** the results start again at the first page

#### Scenario: Kind selector on Home
- **WHEN** the Home search panel is displayed
- **THEN** a kind selector offering films and series is present, and results are drawn only from the selected kind

#### Scenario: Popular films come from TMDB
- **WHEN** Home renders its popular-films area before any search
- **THEN** the popular films are obtained from TMDB

#### Scenario: Empty search state on Home
- **WHEN** the user has not submitted a search
- **THEN** Home shows the activity feed and popular films instead of results

#### Scenario: Activity feed is real-time and scrollable
- **WHEN** Home is open and new friends' or groups' activity occurs
- **THEN** it appears in the feed without a page reload, the feed scrolls vertically when it overflows, and the viewer's current scroll position is preserved

#### Scenario: Activity feed size selection
- **WHEN** the viewer selects 10 or 25 entries in the feed size control
- **THEN** the feed displays up to that many of the most recent entries and its container grows to fit them

### Requirement: Search with filters
Search SHALL be performed through a single always-visible filter panel offering a free-text title field, a multi-value genre filter selected from a dropdown, and a year filter entered as a range with an optional lower and an optional upper bound, and SHALL clearly show which filters are active with a way to reset them. An empty lower bound SHALL mean "no earliest year" and an empty upper bound SHALL mean "no latest year"; when both bounds are set the lower bound SHALL NOT exceed the upper bound. The year filter SHALL NOT be limited to the years present in the data. Each multi-value filter's option list SHALL stay collapsed until the user opens that filter's dropdown, SHALL close when the user selects a value, clicks outside it, or presses Escape, and SHALL visibly mark each selected option. Active values SHALL be shown grouped as a single block per filter, and each value SHALL be individually removable. For the multi-value genre filter, a title SHALL match when it satisfies any one of the selected genres; a title SHALL match the whole search only when it satisfies every active filter. Search SHALL NOT require a separate free-text query field, SHALL NOT offer a rating filter, and SHALL NOT offer actor or director filters. On Home the filter options SHALL be drawn from the stored genre catalog for the selected kind; on My Films and My Series they SHALL be drawn only from the user's watched titles.

#### Scenario: Applying filters
- **WHEN** the user opens a filter's dropdown and selects one value
- **THEN** results reflect that value and it is shown within that filter's active-values block as an individually removable value

#### Scenario: Options collapsed until opened
- **WHEN** the filter panel is displayed
- **THEN** each multi-value filter's option list is collapsed until the user opens that filter's dropdown

#### Scenario: Multi-value dropdown closes predictably
- **WHEN** the user has opened a multi-value filter's dropdown
- **THEN** that dropdown closes when the user selects a value, clicks outside it, or presses Escape

#### Scenario: Selected option is visible
- **WHEN** a value is selected within a multi-value filter's dropdown
- **THEN** that option is visibly marked as selected while the dropdown is open

#### Scenario: Year entered as an incrementable value
- **WHEN** the user activates the increment or decrement control of a year bound
- **THEN** that bound changes by one and the results reflect the resulting range

#### Scenario: Year starts unset and first step selects the current year
- **WHEN** a year bound has no value and the user activates its increment or decrement control
- **THEN** that bound is set to the current calendar year, and a further activation moves it by one from there

#### Scenario: Year range bounds are optional
- **WHEN** the user sets only a lower year bound, only an upper year bound, or neither
- **THEN** the search applies with the set bounds and leaves the unset side unbounded

#### Scenario: Year range narrows results
- **WHEN** the user sets a lower and an upper year bound
- **THEN** titles whose year falls within the range are returned and titles outside it are excluded

#### Scenario: Inverted year range rejected
- **WHEN** the user sets a lower bound greater than the upper bound
- **THEN** the range is not applied and the panel indicates the range is invalid

#### Scenario: Year is not limited to the data
- **WHEN** the user sets a year bound that does not match any available title
- **THEN** the bound is accepted and the results reflect the range

#### Scenario: Every active value is removable
- **WHEN** the user activates the remove control on any active filter value, including either bound of the year range
- **THEN** that value is removed and the remaining filters stay in effect

#### Scenario: Multiple values within one filter
- **WHEN** the user selects several genres in the genre filter
- **THEN** titles matching any of the selected genres are shown

#### Scenario: Active values grouped per filter
- **WHEN** several values are selected in one filter
- **THEN** those values are shown together in a single block for that filter, and removing one value leaves the others selected

#### Scenario: Combining filters
- **WHEN** the user has more than one active filter
- **THEN** only titles satisfying every active filter are shown

#### Scenario: Resetting filters
- **WHEN** the user activates "reset"
- **THEN** all filters are cleared and results return to the unfiltered state

#### Scenario: No matching results
- **WHEN** a filter combination matches no titles
- **THEN** the results area presents the empty state with an explanation

#### Scenario: No rating filter
- **WHEN** the filter panel is shown
- **THEN** no rating (оценка) filter control is present

#### Scenario: Director filter available
- **WHEN** the filter panel is shown
- **THEN** it offers title, genre, and year-range filters and presents no Режиссёр (director) or actor filter

#### Scenario: Options drawn from watched films on My Films
- **WHEN** the user opens the filter panel in My Films
- **THEN** the genre and year options are limited to the values present among the watched films, while the title filter accepts free text

#### Scenario: Catalog-wide options on Home
- **WHEN** the user opens the filter panel on Home
- **THEN** the genre options are drawn from the stored genre catalog for the selected kind

### Requirement: My Films screen
My Films SHALL list the signed-in account's persisted watched records as a table with the columns Название, Оценка, and Дата просмотра, where Оценка is the user's own rating for the record, and the same records SHALL remain after a reload or a new sign-in. It SHALL allow the list to be filtered live through the always-visible filter panel whose genre and year options are limited to the watched films. Activating a column header SHALL sort the list by that column, toggling between ascending and descending order, and the default order SHALL be by Дата просмотра, newest first. Selecting any part of a record's row SHALL expand that record in place, and rows SHALL show a highlight on hover. The "Изменить" action SHALL be shown only inside a record's expanded area, at its right, rather than permanently in every row. Deleting a record SHALL be available inside the expanded area and SHALL require confirmation before the record is removed. My Films SHALL allow adding and editing records through a modal. When the modal is opened to add, it SHALL present the filter-driven search panel and SHALL NOT show a list of catalog films before the user activates the "Найти" action; after a search it SHALL offer only matching films that are not already among the user's watched records, so the same film cannot be added twice. My Films SHALL NOT present statistics or a separate free-text search field.

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
- **THEN** the table immediately filters to matching watched films, using genre and year options limited to watched values, and does not require a separate search field or a submit action

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

### Requirement: Shared component inventory
The screens SHALL be composed from a shared component inventory: film card, series card, search field with filters, decimal rating input, comment field, statistic card, privacy toggle, identity display selector, friend and request list items, group card with tags, and admin member panel.

#### Scenario: Components reused across screens
- **WHEN** the same element appears on more than one screen
- **THEN** it is the shared component with consistent appearance and behavior

### Requirement: My Series screen
The application SHALL provide a My Series screen at its own route with a navigation entry directly below My Films. My Series SHALL list the user's series and allow searching, filtering, and sorting that list, adding, editing, and deleting series through modals, and expanding a series from its whole row. A series SHALL carry a single whole-series rating and SHALL NOT present seasons or episodes.

#### Scenario: Series listed
- **WHEN** the user opens My Series
- **THEN** the watched series are listed with their rating and date, and no statistics are shown

#### Scenario: Whole-row expansion
- **WHEN** the user activates a series row
- **THEN** the series expands in place without navigating away

#### Scenario: Single-season series expands to episodes
- **WHEN** a series is expanded
- **THEN** no episode list is shown, because a series carries a single whole-series rating and has no season structure

#### Scenario: Multi-season series expands in two levels
- **WHEN** a series is expanded
- **THEN** no season level is shown, because a series carries a single whole-series rating

#### Scenario: Whole-series mode has no expansion
- **WHEN** a series is expanded
- **THEN** no seasons or episodes are presented

#### Scenario: Adding, editing, and deleting
- **WHEN** the user adds, edits, or deletes a series
- **THEN** the matching modal opens and the list reflects the change after saving

#### Scenario: Search, filters, and sorting
- **WHEN** the user types in the My Series search field, sets filters, or activates a column header
- **THEN** the list filters and sorts the same way it does on My Films

### Requirement: Add-rating search
The modal that opens when the user adds a rating SHALL present the same filter-driven search panel as Home — a free-text title field, a multi-value genre filter, and a year-range filter with a full-width "Найти" submit below the filter grid — and SHALL search the whole catalog of films and series rather than only the user's existing records. The modal SHALL NOT present a list of catalog entries before the user activates "Найти". After "Найти" it SHALL offer only matching entries one page at a time with the same "Показать ещё" control as Home, and when adding a film or series it SHALL exclude media already present in the user's records so the same film or series cannot be added twice. The add-modal search SHALL NOT offer actor or director filters. This add-modal search SHALL be distinct from, and SHALL NOT replace, the live in-list search.

#### Scenario: Add modal presents the filter panel
- **WHEN** the user activates the add action in My Films, My Series, or group ratings
- **THEN** the opened modal shows the search panel with a title field, genre, and year-range filters, and a full-width "Найти" action below the filter grid instead of only a plain text field

#### Scenario: Add search applied on submit
- **WHEN** the user changes add-modal filters but has not activated "Найти"
- **THEN** the picker does not apply the changed filters until "Найти" is activated, after which it offers matching catalog entries

#### Scenario: No list before a search
- **WHEN** the add modal is opened
- **THEN** no list of films or series is shown until the user activates "Найти"

#### Scenario: Catalog-wide options in the add modal
- **WHEN** the user opens the add-modal filters
- **THEN** the genre options are drawn from the stored genre catalog for the modal's kind, and the year range is not limited to the user's already-added records

#### Scenario: Series picker omits actor and director
- **WHEN** the add modal filters are shown
- **THEN** title, genre, and year-range filters are offered, and no actor or director filter is shown for either kind

#### Scenario: Add modal loads more results
- **WHEN** more matching entries exist than the current page shows and the user activates "Показать ещё"
- **THEN** the next page of matching entries is appended to the picker

#### Scenario: Already added media is excluded
- **WHEN** the user searches in the add modal of My Films or My Series
- **THEN** films or series already present in the user's records are not offered, so the same title cannot be added twice

#### Scenario: In-list search stays live
- **WHEN** the user changes filter values in the My Films, My Series, or group-ratings list itself
- **THEN** the list filters immediately without a submit action, and the add-modal search does not affect it

## REMOVED Requirements

### Requirement: Series rating model
**Reason**: The TMDB-based rework rates every series as a whole and removed the per-episode/season model from the product; the code no longer stores or presents seasons or episodes, so the two-mode rating contract no longer reflects the system.
**Migration**: Rate a series with a single whole-series rating, as defined by the "Whole-series rating" requirement in the `catalog` capability. There is no per-episode or per-season data to migrate, and no series has an episode-level rating to preserve.
