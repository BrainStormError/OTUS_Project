## MODIFIED Requirements

### Requirement: Home and search screen
Home SHALL present an always-expanded filter-driven search panel labelled "Поиск" with a "Найти" action positioned on the same row as the label, to its right, and a kind selector that switches the search between films and series. Home SHALL present search results only after the user activates the "Найти" action. Home SHALL also present a real-time, scrollable social activity feed of friends' and groups' activity and a popular-films area drawn from TMDB, SHALL NOT present a statistics summary, and SHALL NOT present a separate free-text search field. The activity feed SHALL show the five most recent entries by default with a control to show 10 or 25 instead, SHALL grow its container to fit the selected number of entries, and SHALL add newly arrived entries without a page reload while preserving the viewer's scroll position.

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
- **THEN** Home shows the results for the selected kind and all active filters

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

### Requirement: Film card
A title card SHALL present a poster, title, year, external rating, and genres obtained from TMDB, and an action to mark the title as watched, and SHALL provide a fallback when no poster is available. A card SHALL represent either a film or a series according to the kind that produced it. Activating the watched action SHALL open the rating and comment form for that title. When a title is watched, the card SHALL show a small check indicator in a corner that reveals the label "Просмотрено" on hover.

#### Scenario: Card content
- **WHEN** a title card is displayed
- **THEN** it shows poster, title, year, external rating, genres, and a "watched" action

#### Scenario: Missing poster
- **WHEN** a title has no poster image
- **THEN** the card shows a neutral placeholder instead of a broken image

#### Scenario: Watched action opens the rating form
- **WHEN** the user activates the watched action on a card
- **THEN** the rating and comment form opens for that title

#### Scenario: Watched indicator
- **WHEN** a card represents a title the user has watched
- **THEN** a small check indicator is shown in a corner of the card and reveals "Просмотрено" on hover
