# ui/screens Specification

## Purpose
Defines the required screens and their composition: discovery and search, the film card with rating and comment, profiles and statistics, friends, groups with an admin panel, and settings.

## Requirements

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

### Requirement: Film card

A title card SHALL present a poster, title, year, external rating, and genres obtained from TMDB, and an action to mark the title as watched, and SHALL provide a fallback when no poster is available. A card SHALL represent either a film or a series according to the kind that produced it. Activating the watched action SHALL open the rating and comment form for that title. When a title is watched, the card SHALL show a small check indicator in a corner that reveals the label "Просмотрено" on hover. The poster image SHALL be loaded lazily and asynchronously, with the poster's space reserved in the layout so that the card does not load images before they are needed and does not shift when an image arrives.

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

#### Scenario: Poster loads lazily

- **WHEN** a card is displayed outside the viewport
- **THEN** its poster image is not loaded until it is needed

#### Scenario: Poster space is reserved

- **WHEN** a poster image has not finished loading
- **THEN** the card reserves the poster's space and does not shift when the image appears

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

### Requirement: Profile screen

The application SHALL provide a profile screen for the current user and for other users. For the current user it SHALL show the signed-in account's identity and SHALL offer controls to edit the display name and the tag, each opening its own modal; for other users it SHALL show the addressed user's stored identity, resolved by handle, and SHALL NOT offer edit controls, and SHALL offer an action that follows the relationship between the viewer and that user: an accepted friend offers «Убрать из друзей», an outgoing pending request shows «Заявка отправлена» without an add action, an incoming pending request is shown as awaiting the viewer's response without an add action, and no relationship offers «Добавить в друзья». It SHALL show that user's persisted statistics and recent records. The recent records list SHALL show only records added within the last seven days; older records SHALL NOT be listed there while remaining part of the user's statistics and records.

#### Scenario: Own profile

- **WHEN** the user opens their own profile
- **THEN** the signed-in account's identity, its persisted statistics, and its persisted recent records are shown with edit and privacy entry points

#### Scenario: Other user's profile

- **WHEN** the user opens another user's profile and no friendship or pending request exists with that user
- **THEN** the profile shows the user's stored identity and, when permitted, persisted statistics, and offers an action to add the user as a friend

#### Scenario: Profile of a friend

- **WHEN** the user opens the profile of an accepted friend
- **THEN** the profile offers an action to remove the friend instead of an add action

#### Scenario: Profile with an outgoing request

- **WHEN** the user opens the profile of a user to whom the viewer has already sent a friend request
- **THEN** the profile shows that the request was sent and offers no add action

#### Scenario: Profile with an incoming request

- **WHEN** the user opens the profile of a user who has sent the viewer a friend request
- **THEN** the profile marks it as awaiting the viewer's response and offers no add action

#### Scenario: Unknown handle

- **WHEN** the user opens a profile for a handle that has no stored user
- **THEN** the screen presents a not-found state instead of a profile

#### Scenario: Edit controls on own profile

- **WHEN** the current user opens their own profile
- **THEN** an edit control is shown next to the display name and next to the tag, each opening a modal for that field

#### Scenario: No edit controls on another profile

- **WHEN** a user opens another user's profile
- **THEN** no edit control is shown

#### Scenario: Edit modal saves the value

- **WHEN** the current user confirms a valid new value in an edit modal
- **THEN** the profile reflects the new value

#### Scenario: Recent records limited to the last week

- **WHEN** the profile shows the recent records list
- **THEN** only records added within the last seven days are listed, and older records are not shown there

#### Scenario: Older records remain in statistics and records

- **WHEN** a record is older than seven days
- **THEN** it is absent from the recent records list but still counted in the profile statistics and present among the user's records

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

The friends section SHALL present profile search over real user records, incoming and outgoing requests, and the list of current friends as separate tabs within the section — a search tab, a requests tab that covers both incoming and outgoing requests, and a friends tab — and the requests tab SHALL show the pending incoming count. Search results SHALL offer a working action that follows the relationship — adding a friend where there is no relationship and removing a friend where one exists — and the searcher's own profile SHALL NOT appear in the results.

#### Scenario: Searching profiles

- **WHEN** the user searches for a profile
- **THEN** matching users from the database are listed with an action that follows the relationship: add where there is none, remove where the user is already a friend, or a pending marker

#### Scenario: Own profile not in results

- **WHEN** the user searches for their own name or handle
- **THEN** their own profile is not shown in the results

#### Scenario: Sending a request from search

- **WHEN** the user activates the add action on an eligible search result
- **THEN** a friend request is sent and the result reflects the pending status

#### Scenario: Removing a friend from search

- **WHEN** the user activates the remove action on a search result that is already a friend
- **THEN** the friendship is removed after confirmation and the result offers the add action again

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
- **THEN** current friends are listed with a link to each profile and an action to remove the friend

### Requirement: Groups and admin panel

The groups section SHALL provide a list of the user's groups, a fully clickable group card, a control to create a new group that opens a modal for its name, description, tags, and visibility, and an admin panel for editing the group's settings and managing members, roles, and invitations. Any signed-in user SHALL be able to create a group, and creating it SHALL open its page. A group page SHALL be organized into tabs: Обсуждения, Оценки, Активность, Участники, and Статистика, each showing that part of the group's content. The group detail screen SHALL show the group's members and statistics. The section SHALL show the signed-in user's pending group invitations with accept and decline actions. In the admin panel, sending an invitation SHALL switch that user's action to a non-interactive "Отправлено" state and SHALL NOT allow a second invitation to the same user while one is pending. The admin panel SHALL NOT offer removing the administrator's own membership, and SHALL offer a "Распустить группу" action for an administrator. In the Оценки tab the control that starts a media SHALL be offered only to an administrator, while rating a listed media SHALL be offered from that media's row: a row SHALL offer Оценить when the signed-in user has no rating for that media and Изменить when the user already has one, and SHALL show a К обсуждению action alongside when a discussion is attached to that media.

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
- **THEN** they can edit the group's settings, manage members and roles, invite users by search, and remove members other than themselves

#### Scenario: Non-admin access

- **WHEN** a non-admin user attempts to open the group admin panel
- **THEN** the panel presents a no-permission state instead of admin controls

#### Scenario: Group created from the section

- **WHEN** a signed-in user opens the creation modal, fills in a name and optional details, and confirms
- **THEN** the group is created and its page is opened

#### Scenario: Duplicate name shown as an error

- **WHEN** the creation modal is submitted with a name that collides with an existing group by letter case
- **THEN** the modal shows an error and no group is created

#### Scenario: Pending invitations shown

- **WHEN** a signed-in user has pending group invitations
- **THEN** the groups section lists them with accept and decline actions

#### Scenario: Invitation reflects its sent state

- **WHEN** an administrator sends an invitation to a user in the admin panel
- **THEN** that user's action shows "Отправлено" and is no longer actionable

#### Scenario: A pending invitation cannot be sent twice

- **WHEN** a user already has a pending invitation in the admin panel
- **THEN** the invite action is not available for that user again until the invitation is withdrawn

#### Scenario: Self-removal is not offered

- **WHEN** an administrator views their own row in the member list of the admin panel
- **THEN** no action to remove themselves is offered

#### Scenario: Member leaves the group

- **WHEN** a non-administrator member uses the leave action
- **THEN** the group is removed from their group list

#### Scenario: Administrator dissolves the group

- **WHEN** an administrator uses the "Распустить группу" action and confirms
- **THEN** the group is dissolved and the user is returned to the groups section without the group

#### Scenario: Administrator is offered the start control

- **WHEN** an administrator opens the Оценки tab
- **THEN** the control that starts a media is offered

#### Scenario: Member is not offered the start control

- **WHEN** a member who is not an administrator opens the Оценки tab
- **THEN** no control that starts a media is offered

#### Scenario: Member rates a started media from its row

- **WHEN** a member opens the Оценки tab and a listed media has no rating from that member
- **THEN** that media's row offers an Оценить action

#### Scenario: Rate action becomes an edit action

- **WHEN** a member has already rated a media listed in the Оценки tab
- **THEN** that media's row offers Изменить instead of Оценить

#### Scenario: Discussion link sits beside the rate action

- **WHEN** a listed media in the Оценки tab has an attached discussion
- **THEN** that media's row offers К обсуждению together with the rate action

### Requirement: Settings screen

Settings SHALL provide theme selection, controls for how moments in time are displayed (timezone and 12/24-hour clock), an identity display preference, privacy controls for the profile and statistics, and actions to edit the signed-in account's display name and tag, each opening its own modal. Profile and statistics privacy SHALL be stored on the user's account, so a changed value persists when the user navigates away and returns, or reloads the application, and SHALL drive the server-side visibility of the user's activity and friendships.

#### Scenario: Theme and privacy controls

- **WHEN** the user opens Settings
- **THEN** the theme selection and the profile and statistics privacy toggles are available

#### Scenario: Time display controls

- **WHEN** the user opens Settings
- **THEN** a timezone selector and a 12/24-hour choice are available and reflect the current selection

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

#### Scenario: Identity edit actions in Settings

- **WHEN** the user opens Settings
- **THEN** buttons to edit the display name and the tag are shown, each opening a modal for that field

### Requirement: Shared component inventory
The screens SHALL be composed from a shared component inventory: film card, series card with season and episode levels, search field with filters, decimal rating input, comment field, statistic card, privacy toggle, identity display selector, user avatar, friend and request list items, group card with tags, and admin member panel.

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

### Requirement: Watch date not in the future

The rating and comment form SHALL NOT accept a watch date later than the current day, where the current day SHALL be determined in the user's selected time zone. The date control SHALL offer the current day and earlier dates and SHALL NOT offer future dates, and a watch date later than the current day SHALL be rejected with a validation message without saving the record.

#### Scenario: Future dates are not offered

- **WHEN** the user opens the watch-date control
- **THEN** dates after the current day are not selectable, while the current day and earlier dates are

#### Scenario: Future date rejected on submit

- **WHEN** the user submits a watch date later than the current day in the user's time zone
- **THEN** the form shows a validation message and does not save the record

#### Scenario: Current day and earlier accepted

- **WHEN** the user provides a watch date equal to or earlier than the current day
- **THEN** the form accepts it and the record is saved with that date

#### Scenario: Current day follows the user's time zone

- **WHEN** the user's selected time zone makes their local date differ from the UTC date
- **THEN** the latest accepted watch date is the user's local current day, not the UTC day

### Requirement: Expanded record stays within the table row

In My Films and My Series, an expanded record's comment and its actions SHALL stay within the bounds of the table at any viewport width: a long comment SHALL wrap instead of widening the table or overflowing the row, and the actions SHALL move below the comment when there is not enough horizontal space.

#### Scenario: Long comment wraps

- **WHEN** a record with a long comment is expanded
- **THEN** the comment wraps inside the expanded row and does not extend past the table's right edge

#### Scenario: Actions stay inside the row on narrow viewports

- **WHEN** the viewport is narrow and a record is expanded
- **THEN** the edit and delete actions remain within the row, moving below the comment when needed

### Requirement: Table column hover highlight

In My Films and My Series, hovering a cell SHALL highlight the entire column that contains it, including that column's header, while the existing row hover highlight SHALL remain.

#### Scenario: Hovered column is highlighted

- **WHEN** the pointer rests over a cell in a column
- **THEN** that column's cells and its header are highlighted

#### Scenario: Row highlight is preserved

- **WHEN** the pointer rests over a record's row
- **THEN** the row is highlighted, as before

#### Scenario: Highlight clears on leaving the table

- **WHEN** the pointer leaves the table
- **THEN** the column highlight is removed

### Requirement: Watch-later action on cards and title detail

On the title card on Home and on the film/series detail page, a watch-later action SHALL appear next to the "watched" action and SHALL let a signed-in user add the title to, or remove it from, their watch-later list. When the title is not watched, the action SHALL toggle between adding and removing and SHALL show the active state while the title is on the list. When the title is already watched, the watch-later action SHALL NOT create an entry. The watch-later action and the watched action SHALL remain inside their container at any viewport width and SHALL wrap or shrink instead of overflowing the card or the detail layout.

#### Scenario: Add from the card
- **WHEN** the user activates the watch-later action on a title card that is neither watched nor on the list
- **THEN** the title is added to the watch-later list and the action shows the active state

#### Scenario: Remove by toggling
- **WHEN** the user activates the watch-later action on a title already on the watch-later list
- **THEN** the title is removed from the list and the action returns to its inactive state

#### Scenario: Add from the detail page
- **WHEN** the user activates the watch-later action on the film or series detail page
- **THEN** the title is added to or removed from the watch-later list as on a card

#### Scenario: Watched title
- **WHEN** the title is already watched
- **THEN** the watch-later action does not add the title to the watch-later list

#### Scenario: Actions do not overflow
- **WHEN** the card or the detail page is shown at a narrow viewport
- **THEN** the watch-later action and the watched action stay within their container, wrapping or shrinking instead of extending past its edge

### Requirement: Watch-later tab in My Films and My Series

My Films and My Series SHALL each provide a "Буду смотреть" tab alongside the watched list, showing the signed-in user's watch-later titles of that section's media kind. The tab SHALL offer the same live filter panel as the watched list, applied to the watch-later titles, and SHALL list Название, Год, and the date the title was added. Each entry SHALL offer an "Оценить" action that opens the rating form and an "Удалить" action that removes the entry without rating. Rating an entry SHALL remove it from the tab and add it to the watched list, and the watched list SHALL remain the default tab.

#### Scenario: Tab shows planned titles of the kind
- **WHEN** the user opens the "Буду смотреть" tab of My Films or My Series
- **THEN** the watch-later titles of that kind are listed with Название, Год, and the added date

#### Scenario: Live filtering on the tab
- **WHEN** the user changes filter values in the "Буду смотреть" tab
- **THEN** the tab filters immediately to matching watch-later titles using options limited to the watch-later titles, without a submit action

#### Scenario: Rating from the tab
- **WHEN** the user activates "Оценить" on a watch-later entry and saves a rating
- **THEN** the title is removed from the "Буду смотреть" tab and appears in the watched list

#### Scenario: Removing from the tab
- **WHEN** the user activates "Удалить" on a watch-later entry
- **THEN** the entry is removed from the list without creating a watched record

#### Scenario: Empty list
- **WHEN** the user's watch-later list is empty
- **THEN** the tab presents an empty state

#### Scenario: Default tab
- **WHEN** the user opens My Films or My Series
- **THEN** the watched list is shown by default

### Requirement: Group rating form also adds to the personal list

The group rating form SHALL present an optional checkbox labelled to add the media to the
member's personal list — "также добавить в мои фильмы" for a film and "также добавить в мои
сериалы" for a series. The checkbox SHALL be unchecked by default and SHALL be present both
when a rating is added and when an existing rating is edited. When the member has an existing
personal rating for that media and the checkbox is set, submitting SHALL present a confirmation
dialog stating that the personal rating will be overwritten; confirming proceeds with the save
and dismissing clears the checkbox without saving.

#### Scenario: Checkbox shown when adding a rating

- **WHEN** a member opens the group rating form to add a rating
- **THEN** the "add to my films/series" checkbox is shown, unchecked

#### Scenario: Checkbox shown when editing a rating

- **WHEN** a member opens the group rating form to edit their existing rating
- **THEN** the same checkbox is shown

#### Scenario: Overwrite confirmation shown

- **WHEN** the member has an existing personal rating for the media and submits with the checkbox set
- **THEN** a confirmation dialog states that the personal rating will be overwritten

#### Scenario: Dismissing clears the checkbox

- **WHEN** the member dismisses the overwrite confirmation
- **THEN** the checkbox is cleared and nothing is saved

### Requirement: Card actions work in every context

Every action a title card offers SHALL perform its function wherever the card is rendered — the popular area on Home, Home search results, and any other list — so the same card does not present an inert control in one context while the action works in another. In particular, on a card shown among Home search results, the watch-later ("Буду смотреть") action SHALL add the title to, or remove it from, the viewer's watch-later list exactly as it does on a card in the popular area, and the card SHALL reflect the title's current watched and watch-later state.

#### Scenario: Watch-later works on a search-result card

- **WHEN** the user activates the "Буду смотреть" action on a card shown among Home search results for a title that is neither watched nor on the watch-later list
- **THEN** the title is added to the watch-later list and the action shows its active state

#### Scenario: Watch-later toggles off on a search-result card

- **WHEN** the user activates the "Буду смотреть" action on a Home search-result card whose title is already on the watch-later list
- **THEN** the title is removed from the watch-later list and the action returns to its inactive state

#### Scenario: State is consistent between the popular area and search results

- **WHEN** a title that is on the watch-later list is shown both in the popular area and among search results
- **THEN** its card shows the active watch-later state in both places

### Requirement: Sign-in screen layout

The sign-in screen SHALL center its form horizontally within the viewport on viewports of every width, including wide desktop viewports where a fixed-width content container is narrower than the viewport.

#### Scenario: Centered on a wide desktop viewport

- **WHEN** the sign-in screen is viewed on a desktop viewport wider than the content container
- **THEN** the sign-in form is horizontally centered within the viewport

#### Scenario: Centered on a phone viewport

- **WHEN** the sign-in screen is viewed on a narrow phone viewport
- **THEN** the sign-in form is horizontally centered and fully visible without horizontal scrolling

### Requirement: Instant group tab switching

Switching between the tabs of a group page (Обсуждения, Оценки, Активность, Участники, Статистика) SHALL show the selected tab's content immediately from the data already loaded with the page, without a page navigation, without a request to the server, and without a loading state. Selecting a discussion from the discussions tab, or a discussion link on the ratings or activity tab, SHALL open that discussion in place under the same rule. Content shown in the tabs SHALL come from the single server pass made when the group page was opened.

#### Scenario: Tab switch is immediate

- **WHEN** the user activates a group tab other than the current one
- **THEN** the selected tab's content is shown immediately, without a page navigation and without a loading state

#### Scenario: Opening a discussion is immediate

- **WHEN** the user selects a discussion in the discussions tab
- **THEN** the discussion opens with its comments and comment form in place, without a page navigation

#### Scenario: Cross-tab discussion link opens in place

- **WHEN** the user activates a discussion link on the ratings or activity tab
- **THEN** the discussions tab becomes active with that discussion open, without a page navigation

#### Scenario: Tab content stays complete

- **WHEN** the user switches between several tabs back and forth
- **THEN** each tab shows its full content every time, matching what the group page loaded

### Requirement: Addressable group tab state

The active tab and the open discussion SHALL be reflected in the page address (`?tab=`, `?discussion=`), so reloading the page, sharing the address, or following a link to it (for example a discussion link from the home activity feed) lands on the same tab and discussion. Switching tabs or opening a discussion SHALL NOT create browser history entries: the back button SHALL leave the group page for the previous screen instead of stepping through previously viewed tabs. An unknown tab value in the address SHALL fall back to the discussions tab.

#### Scenario: Address reflects the active tab

- **WHEN** the user switches to the ratings tab and reloads the page or copies the address
- **THEN** the page opens with the ratings tab active

#### Scenario: Deep link to a discussion

- **WHEN** the user follows a link to `/groups/<id>?tab=discussions&discussion=<discussion-id>`
- **THEN** the discussions tab is active and that discussion is open with its comments

#### Scenario: Back leaves the group page

- **WHEN** the user switches between several tabs and activates the back button
- **THEN** the previous screen is shown, not a previously viewed tab

#### Scenario: Unknown tab falls back

- **WHEN** the user opens a group page address whose `tab` value is not a known tab
- **THEN** the discussions tab is active
