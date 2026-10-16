## ADDED Requirements

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
