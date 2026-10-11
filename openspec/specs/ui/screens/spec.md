# ui/screens Specification

## Purpose
Defines the required screens and their composition: discovery and search, the film card with rating and comment, profiles and statistics, friends, groups with an admin panel, and settings.

## Requirements

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

### Requirement: Profile screen

The application SHALL provide a profile screen for the current user and for other users. For the current user it SHALL show the signed-in account's identity; for other users it SHALL show the addressed user's stored identity, resolved by handle. It SHALL show that user's persisted statistics and recent records and the actions relevant to the relationship.

#### Scenario: Own profile

- **WHEN** the user opens their own profile
- **THEN** the signed-in account's identity, its persisted statistics, and its persisted recent records are shown with edit and privacy entry points

#### Scenario: Other user's profile

- **WHEN** the user opens another user's profile
- **THEN** that user's stored identity and, when permitted, persisted statistics are shown with a relationship action such as adding a friend

#### Scenario: Unknown handle

- **WHEN** the user opens a profile for a handle that has no stored user
- **THEN** the screen presents a not-found state instead of a profile

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

### Requirement: Friends screen
The friends section SHALL present profile search over real user records, incoming and outgoing requests, and the list of current friends as separate tabs within the section — a search tab, a requests tab that covers both incoming and outgoing requests, and a friends tab — and the requests tab SHALL show the pending incoming count. Search results SHALL offer a working action to send a friend request where the relationship allows it, and the searcher's own profile SHALL NOT appear in the results.

#### Scenario: Searching profiles
- **WHEN** the user searches for a profile
- **THEN** matching users from the database are listed with an action to send a friend request, or a friend/pending marker when a relationship already exists

#### Scenario: Own profile not in results
- **WHEN** the user searches for their own name or handle
- **THEN** their own profile is not shown in the results

#### Scenario: Sending a request from search
- **WHEN** the user activates the add action on an eligible search result
- **THEN** a friend request is sent and the result reflects the pending status

#### Scenario: Requests in a dedicated tab
- **WHEN** the user opens the friends section
- **THEN** incoming and outgoing requests are shown together in a dedicated requests tab, not mixed into the search or friends content

#### Scenario: Managing requests
- **WHEN** a user has incoming friend requests
- **THEN** each request offers accept and decline actions, and the pending count is visible on the requests tab

#### Scenario: Viewing and withdrawing outgoing requests
- **WHEN** the user has sent friend requests that are still pending
- **THEN** each outgoing request is listed with a withdrawal action

#### Scenario: Friend list
- **WHEN** the user views their friends
- **THEN** current friends are listed with a link to each profile

### Requirement: Groups and admin panel
The groups section SHALL provide a list of the user's groups, a fully clickable group card, and an admin panel for managing members and roles. A group page SHALL be organized into tabs: Обсуждения, Оценки, Активность, Участники, and Статистика, each showing that part of the group's content. The group detail screen SHALL show the group's members and statistics.

#### Scenario: Group list and card
- **WHEN** the user opens Groups and activates any part of a group card
- **THEN** the group's detail screen opens and the card shows only the group's name, description, and tags

#### Scenario: Group card content
- **WHEN** a group card is displayed
- **THEN** it shows the group's name, description, and tags, and does not show statistics

#### Scenario: Group detail shows statistics
- **WHEN** the user opens a group's detail screen
- **THEN** the group's members and statistics are shown

#### Scenario: Tab content
- **WHEN** the user opens each tab of a group page
- **THEN** the tab shows the group's discussions, group ratings, group activity, members, and group statistics respectively

#### Scenario: Admin management
- **WHEN** a user with the admin role opens the group admin panel
- **THEN** they can manage members, change roles, invite by handle, and remove members

#### Scenario: Non-admin access
- **WHEN** a non-admin user attempts to open the group admin panel
- **THEN** the panel presents a no-permission state instead of admin controls

### Requirement: Settings screen
Settings SHALL provide theme selection and privacy controls for the profile and statistics. Profile and statistics privacy SHALL be stored on the user's account, so a changed value persists when the user navigates away and returns, or reloads the application, and SHALL drive the server-side visibility of the user's activity and friendships.

#### Scenario: Theme and privacy controls
- **WHEN** the user opens Settings
- **THEN** the theme selection and the profile and statistics privacy toggles are available

#### Scenario: Privacy change feedback
- **WHEN** the user toggles a privacy control
- **THEN** the control reflects the new value and provides a saving or saved indication

#### Scenario: Privacy persists across navigation
- **WHEN** the user changes a privacy toggle, navigates to another section, and returns to Settings
- **THEN** the toggle still shows the changed value

#### Scenario: Privacy persists across reload
- **WHEN** the user changes a privacy toggle and reloads the application
- **THEN** the account's stored privacy value is applied on load

#### Scenario: Privacy change reported on failure
- **WHEN** saving a privacy change fails
- **THEN** the control reports that the change was not saved and does not present the saved state

### Requirement: Shared component inventory
The screens SHALL be composed from a shared component inventory: film card, series card with season and episode levels, search field with filters, decimal rating input, comment field, statistic card, privacy toggle, identity display selector, friend and request list items, group card with tags, and admin member panel.

#### Scenario: Components reused across screens
- **WHEN** the same element appears on more than one screen
- **THEN** it is the shared component with consistent appearance and behavior

### Requirement: Scoped search in Friends and Groups
Friends and Groups SHALL provide a search that first matches the user's own friends or groups and, when nothing matches, falls back to searching all non-hidden profiles or groups. People search SHALL operate on real user records and SHALL exclude the searcher's own profile from the results.

#### Scenario: Friend found among own friends
- **WHEN** the user searches in Friends and a match exists among their friends
- **THEN** matching friends are shown

#### Scenario: Friend fallback to all profiles
- **WHEN** the user searches in Friends and no friend matches
- **THEN** matching non-hidden profiles other than the searcher's own are shown

#### Scenario: Group found among own groups
- **WHEN** the user searches in Groups and a match exists among their groups
- **THEN** matching groups are shown

#### Scenario: Group fallback to all groups
- **WHEN** the user searches in Groups and no own group matches
- **THEN** matching non-hidden groups are shown

### Requirement: Social activity feed
Home SHALL present a vertically scrolling feed of the user's friends' and groups' watch activity, newest first, limited to the friends and groups the user has. Each entry SHALL identify its source as a friend or a group. Activity from hidden profiles SHALL NOT appear.

#### Scenario: Feed shows friends and groups
- **WHEN** the user has friends and groups with watch activity
- **THEN** Home shows their activity in a single feed ordered newest first

#### Scenario: Source identified
- **WHEN** a feed entry is displayed
- **THEN** the entry shows whether it came from a friend or a group, together with the title and rating

#### Scenario: Hidden profile excluded
- **WHEN** a friend has hidden their profile
- **THEN** that friend's activity does not appear in the feed

#### Scenario: Series included
- **WHEN** a friend or group has watched a series
- **THEN** the series event appears in the feed with the series' average rating

#### Scenario: Empty feed
- **WHEN** the user has no friends or groups with activity
- **THEN** the feed area presents an empty state

### Requirement: My Series screen
The application SHALL provide a My Series screen at its own route with a navigation entry directly below My Films. My Series SHALL list the user's series and allow searching, filtering, and sorting that list, adding, editing, and deleting series through modals, and expanding a series from its whole row. A series in per-episode mode with a single season SHALL expand directly to its episodes; with multiple seasons it SHALL expand to seasons and each season to its episodes. A series in whole-series mode SHALL NOT expand into seasons or episodes.

#### Scenario: Series listed
- **WHEN** the user opens My Series
- **THEN** the watched series are listed with their rating and date, and no statistics are shown

#### Scenario: Whole-row expansion
- **WHEN** the user activates a series row
- **THEN** the series expands in place without navigating away

#### Scenario: Single-season series expands to episodes
- **WHEN** a series in per-episode mode has one season and is expanded
- **THEN** its episodes are shown directly without a season level

#### Scenario: Multi-season series expands in two levels
- **WHEN** a series in per-episode mode has multiple seasons and is expanded
- **THEN** its seasons are shown, and expanding a season shows its episodes

#### Scenario: Whole-series mode has no expansion
- **WHEN** a series is in whole-series mode
- **THEN** expanding it does not present seasons or episodes

#### Scenario: Adding, editing, and deleting
- **WHEN** the user adds, edits, or deletes a series
- **THEN** the matching modal opens and the list reflects the change after saving

#### Scenario: Search, filters, and sorting
- **WHEN** the user types in the My Series search field, sets filters, or activates a column header
- **THEN** the list filters and sorts the same way it does on My Films

### Requirement: Series rating model
A series SHALL be rated in one of two modes, chosen when the series is added: per-episode or whole-series.

In per-episode mode, episodes carry ratings and comments, a season's average SHALL be the mean of its rated episodes, and a series' average SHALL be the mean of its season averages. Averages SHALL be computed immediately as ratings are set and SHALL NOT wait until every episode is rated. For a series with a single season, the series average SHALL be the season average.

In whole-series mode, the series SHALL carry a single rating and comment and SHALL NOT present seasons or episodes.

Ratings SHALL be mandatory: a series SHALL NOT be added without at least one rating — an episode rating in per-episode mode, or the whole-series rating in whole-series mode. Comments SHALL be optional at every level. The rating mode SHALL be changeable after the series is added, but changing it SHALL require confirmation that the ratings from the previous mode will be deleted, and on confirmation those ratings SHALL be removed. Individual ratings and comments SHALL be editable after they are set.

#### Scenario: Per-episode average over rated episodes
- **WHEN** a series in per-episode mode has some episodes rated and others not
- **THEN** each season average and the series average are computed over the rated episodes only

#### Scenario: Averages update immediately
- **WHEN** the user sets or changes an episode rating
- **THEN** the affected season average and series average update immediately

#### Scenario: Single-season series average
- **WHEN** a series in per-episode mode has a single season
- **THEN** the series average equals that season's average

#### Scenario: Whole-series rating
- **WHEN** a series is in whole-series mode
- **THEN** it presents a single series rating and comment with no season or episode ratings

#### Scenario: Rating required to add
- **WHEN** the user tries to add a series without any rating
- **THEN** the series is not added and a validation message is shown

#### Scenario: Changing mode deletes previous ratings
- **WHEN** the user changes a series' rating mode and confirms the deletion warning
- **THEN** the ratings from the previous mode are removed and the new mode is applied

#### Scenario: Ratings and comments are editable
- **WHEN** the user edits an episode rating, a season, or a series rating or comment
- **THEN** the change is saved and any dependent averages update

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
