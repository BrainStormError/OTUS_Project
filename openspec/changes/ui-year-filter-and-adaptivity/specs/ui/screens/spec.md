## MODIFIED Requirements

### Requirement: Search with filters
Search SHALL be performed through a single always-visible filter panel offering a free-text title field, a multi-value genre filter selected from a dropdown, and a year filter entered as a range with an optional lower and an optional upper bound, and SHALL clearly show which filters are active with a way to reset them. Each year bound SHALL be entered by hand as a number, and the panel SHALL NOT present increment or decrement controls for either bound. An empty lower bound SHALL mean "no earliest year" and an empty upper bound SHALL mean "no latest year", and a year bound entered above the current calendar year SHALL be reset to the current calendar year when the user commits it (leaves the field), so no bound ever holds a year later than the current calendar year. Entering a lower bound greater than the upper bound SHALL clear the upper bound so the range stays valid, while entering a lower bound that is not greater than the upper bound SHALL leave the upper bound unchanged. The year filter SHALL NOT be limited to the years present in the data, only to the current-year limit. The year range SHALL sit on its own row beneath the title and genre fields, with the field hints "с" and "по" on the lower and upper bound, and its active block SHALL present the bounds as "с X по Y", each bound individually removable. On My Films and My Series the year filter SHALL match each record's watch date and the field SHALL be labelled "год просмотра"; on Home and in every add/search dialog the year filter SHALL match the title's release year and the field SHALL be labelled "Год". Each multi-value filter's option list SHALL stay collapsed until the user opens that filter's dropdown, SHALL close when the user selects a value, clicks outside it, or presses Escape, and SHALL visibly mark each selected option. Active values SHALL be shown grouped as a single block per filter, and each value SHALL be individually removable. For the multi-value genre filter, a title SHALL match when it satisfies any one of the selected genres; a title SHALL match the whole search only when it satisfies every active filter. Search SHALL NOT require a separate free-text query field, SHALL NOT offer a rating filter, and SHALL NOT offer actor or director filters. On Home the filter options SHALL be drawn from the stored genre catalog for the selected kind; on My Films and My Series they SHALL be drawn only from the user's watched titles.

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
- **WHEN** the user enters a year into a year bound
- **THEN** the bound holds the entered year and the panel presents no increment or decrement control for it

#### Scenario: Year starts unset and first step selects the current year
- **WHEN** a year bound has no value and the user enters a year
- **THEN** the bound holds exactly the year the user entered, with no automatic current-year value applied

#### Scenario: Year above the current year resets on commit
- **WHEN** the user types a year later than the current calendar year into a year bound and then leaves the field
- **THEN** the bound resets to the current calendar year

#### Scenario: Year field on its own row
- **WHEN** the filter panel is displayed
- **THEN** the title and genre fields share the first row and the year range sits on its own row beneath them, with the hints "с" and "по" on its bounds

#### Scenario: Year block shows the range with per-bound removal
- **WHEN** the year range has both a lower and an upper bound
- **THEN** its active block reads "с X по Y" and each bound has its own remove control that clears only that bound

#### Scenario: Year range bounds are optional
- **WHEN** the user sets only a lower year bound, only an upper year bound, or neither
- **THEN** the search applies with the set bounds and leaves the unset side unbounded

#### Scenario: Year range narrows results
- **WHEN** the user sets a lower and an upper year bound
- **THEN** titles whose year falls within the range are returned and titles outside it are excluded

#### Scenario: Lower bound above upper bound clears the upper bound
- **WHEN** the user enters a lower bound greater than the upper bound
- **THEN** the upper bound is cleared so the range stays valid and the search applies with only the lower bound

#### Scenario: Lower bound within the upper bound keeps it
- **WHEN** the user enters a lower bound that is not greater than the upper bound
- **THEN** the upper bound is left unchanged

#### Scenario: Year is not limited to the data
- **WHEN** the user sets a year bound that does not match any available title, within the current-year limit
- **THEN** the bound is accepted and the results reflect the range

#### Scenario: Watch-year semantics on My Films and My Series
- **WHEN** the user sets a year range in the live filter on My Films or My Series
- **THEN** records whose watch date falls in the range are shown even when the title's release year differs, and the year field is labelled "год просмотра"

#### Scenario: Release-year semantics on Home and add search
- **WHEN** the user sets a year range in the Home filter panel or an add/search dialog
- **THEN** titles whose release year falls in the range are shown, and the year field is labelled "Год"

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
- **THEN** the genre options are limited to the values present among the watched films and the year range is matched against the records' watch dates, while the title filter accepts free text

#### Scenario: Catalog-wide options on Home
- **WHEN** the user opens the filter panel on Home
- **THEN** the genre options are drawn from the stored genre catalog for the selected kind

### Requirement: My Films screen
My Films SHALL list the signed-in account's persisted watched records as a table with the columns Название, Оценка, and Дата просмотра, where Оценка is the user's own rating for the record, and the same records SHALL remain after a reload or a new sign-in. It SHALL allow the list to be filtered live through the always-visible filter panel whose genre options are limited to the watched films and whose year filter matches each record's watch date rather than a title's release year. Activating a column header SHALL sort the list by that column, toggling between ascending and descending order, and the default order SHALL be by Дата просмотра, newest first. Selecting any part of a record's row SHALL expand that record in place, and rows SHALL show a highlight on hover. The "Изменить" action SHALL be shown only inside a record's expanded area, at its right, rather than permanently in every row. Deleting a record SHALL be available inside the expanded area and SHALL require confirmation before the record is removed. My Films SHALL allow adding and editing records through a modal. When the modal is opened to add, it SHALL present the filter-driven search panel and SHALL NOT show a list of catalog films before the user activates the "Найти" action; after a search it SHALL offer only matching films that are not already among the user's watched records, so the same film cannot be added twice. My Films SHALL NOT present statistics or a separate free-text search field.

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
- **THEN** the table immediately filters to matching watched films, using genre options limited to watched values and a watch-year range, and does not require a separate search field or a submit action

#### Scenario: Year filter matches the watch date
- **WHEN** the user sets a year range in My Films
- **THEN** records whose watch date falls in the range are shown even when the title's release year is different, and the year field is labelled "год просмотра"

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
