## MODIFIED Requirements

### Requirement: Search with filters
Search SHALL be performed through a single always-visible filter panel offering a free-text title field, multi-value genre, actor, and director filters selected from a dropdown, and a year filter entered as an incrementable numeric value that starts with no year selected (an empty value means "all years") and changes by one through dedicated controls, and SHALL clearly show which filters are active with a way to reset them. The year filter SHALL NOT be limited to the years present in the data, and the first increment or decrement from the empty state SHALL select the current calendar year. Each multi-value filter's option list SHALL stay collapsed until the user opens that filter's dropdown, SHALL close when the user selects a value, clicks outside it, or presses Escape, and SHALL visibly mark each selected option. Active values SHALL be shown grouped as a single block per filter, and each value SHALL be individually removable. For a multi-value filter, a film SHALL match when it satisfies any one of the selected values; a film SHALL match the whole search only when it satisfies every active filter. Search SHALL NOT require a separate free-text query field and SHALL NOT offer a rating filter. On Home the filter options SHALL be drawn from the whole film catalog; on My Films they SHALL be drawn only from the user's watched films.

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
- **WHEN** the user activates the increment or decrement control of the year filter
- **THEN** the year value changes by one and the results reflect the resulting year

#### Scenario: Year starts unset and first step selects the current year
- **WHEN** the year filter has no year selected and the user activates the increment or decrement control
- **THEN** the year is set to the current calendar year, and a further activation moves it by one from there

#### Scenario: Year is not limited to the data
- **WHEN** the user sets a year that is not present among the available titles
- **THEN** the year is accepted and the results reflect that year

#### Scenario: Every active value is removable
- **WHEN** the user activates the remove control on any active filter value, including the year
- **THEN** that value is removed and the remaining filters stay in effect

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
