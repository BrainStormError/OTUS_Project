## MODIFIED Requirements

### Requirement: Statistics presentation
Statistics SHALL present two counters — the number of watched films and the number of watched series — a genre breakdown, and a year distribution using dedicated statistic cards, and SHALL appear only as dedicated screens in Profile and Groups. The favourite-genre card SHALL show the genre with the most entries, and the favourite-year card SHALL show the release year with the most entries, regardless of which release year is the newest. In Profile the counted entries are the user's watched records; in Groups they are the media rated by the group as listed in the group's Оценки tab. Statistics SHALL NOT present an average rating.

#### Scenario: Statistics displayed

- **WHEN** statistics are available and not restricted
- **THEN** a films counter, a series counter, a genre breakdown, and a year distribution are shown as statistic cards, and no average-rating card is present

#### Scenario: Counters separate films and series

- **WHEN** the counted entries include both films and series
- **THEN** the films counter counts only the films and the series counter counts only the series

#### Scenario: Favourite year is the most watched release year

- **WHEN** one release year has more counted entries than any other release year and a different, newer release year has fewer entries
- **THEN** the favourite-year card shows the release year with the most entries

#### Scenario: Group statistics follow the Оценки tab

- **WHEN** a group member saves a rating and the group statistics are shown afterwards
- **THEN** the statistics count the group's rated media from the Оценки tab and reflect the new rating

#### Scenario: Restricted statistics

- **WHEN** the owner has hidden their statistics and the viewer is not permitted
- **THEN** the statistics area shows the hidden state instead of values

#### Scenario: Statistics only in Profile and Groups

- **WHEN** the user opens Home or My Films
- **THEN** no statistics are shown there

### Requirement: Settings screen

Settings SHALL provide theme selection, a control for how the clock is displayed (the 12/24-hour clock), an identity display preference, privacy controls for the profile and statistics, and actions to edit the signed-in account's display name and tag, each opening its own modal. Settings SHALL NOT provide a timezone control. Profile and statistics privacy SHALL be stored on the user's account, so a changed value persists when the user navigates away and returns, or reloads the application, and SHALL drive the server-side visibility of the user's activity and friendships.

#### Scenario: Theme and privacy controls

- **WHEN** the user opens Settings
- **THEN** the theme selection and the profile and statistics privacy toggles are available

#### Scenario: Time display controls

- **WHEN** the user opens Settings
- **THEN** a 12/24-hour choice is available and reflects the current selection, and no timezone selector is present

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

### Requirement: Watch date not in the future

The rating and comment form SHALL NOT accept a watch date later than the current day, where the current day SHALL be determined in the browser's time zone. The date control SHALL offer the current day and earlier dates and SHALL NOT offer future dates, and a watch date later than the current day SHALL be rejected with a validation message without saving the record.

#### Scenario: Future dates are not offered

- **WHEN** the user opens the watch-date control
- **THEN** dates after the current day are not selectable, while the current day and earlier dates are

#### Scenario: Future date rejected on submit

- **WHEN** the user submits a watch date later than the current day in the browser's time zone
- **THEN** the form shows a validation message and does not save the record

#### Scenario: Current day and earlier accepted

- **WHEN** the user provides a watch date equal to or earlier than the current day
- **THEN** the form accepts it and the record is saved with that date

#### Scenario: Current day follows the user's time zone

- **WHEN** the browser's time zone makes the local date differ from the UTC date
- **THEN** the latest accepted watch date is the local current day in that zone, not the UTC day

## ADDED Requirements

### Requirement: Watch-later rows highlight on hover

In the "Буду смотреть" tab of My Films and My Series, hovering a row SHALL highlight it the same way rows of the watched list are highlighted.

#### Scenario: Row hover highlight on the watch-later tab

- **WHEN** the pointer rests over a row in the "Буду смотреть" tab
- **THEN** the row is highlighted as in the watched list
