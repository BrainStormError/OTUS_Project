## ADDED Requirements

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
