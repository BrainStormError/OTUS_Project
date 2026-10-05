## MODIFIED Requirements

### Requirement: Home and search screen
Home SHALL present an always-expanded filter-driven search panel labelled "Поиск" with a "Найти" action positioned on the same row as the label, to its right, and SHALL present search results only after the user activates the "Найти" action. Home SHALL also present a real-time, scrollable social activity feed of friends' and groups' activity and a popular-films area, SHALL NOT present a statistics summary, and SHALL NOT present a separate free-text search field. The activity feed SHALL show the five most recent entries by default with a control to show 10 or 25 instead, SHALL grow its container to fit the selected number of entries, and SHALL add newly arrived entries without a page reload while preserving the viewer's scroll position.

#### Scenario: Home shows search and summary
- **WHEN** the user opens Home
- **THEN** an always-expanded "Поиск" panel, a real-time activity feed, and a popular-films area are present, with no statistics summary and no separate free-text search field

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
- **THEN** Home shows the activity feed and popular films instead of results

#### Scenario: Activity feed is real-time and scrollable
- **WHEN** Home is open and new friends' or groups' activity occurs
- **THEN** it appears in the feed without a page reload, the feed scrolls vertically when it overflows, and the viewer's current scroll position is preserved

#### Scenario: Activity feed size selection
- **WHEN** the viewer selects 10 or 25 entries in the feed size control
- **THEN** the feed displays up to that many of the most recent entries and its container grows to fit them

### Requirement: Statistics presentation
Statistics SHALL present the number of films, a genre breakdown, and a year distribution using dedicated statistic cards, and SHALL appear only as dedicated screens in Profile and Groups. Statistics SHALL NOT present an average rating.

#### Scenario: Statistics displayed
- **WHEN** statistics are available and not restricted
- **THEN** count, genre breakdown, and year distribution are shown as statistic cards, and no average-rating card is present

#### Scenario: Restricted statistics
- **WHEN** the owner has hidden their statistics and the viewer is not permitted
- **THEN** the statistics area shows the hidden state instead of values

#### Scenario: Statistics only in Profile and Groups
- **WHEN** the user opens Home or My Films
- **THEN** no statistics are shown there
