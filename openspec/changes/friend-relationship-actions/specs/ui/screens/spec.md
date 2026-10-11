## MODIFIED Requirements

### Requirement: Profile screen

The application SHALL provide a profile screen for the current user and for other users. For the current user it SHALL show the signed-in account's identity; for other users it SHALL show the addressed user's stored identity, resolved by handle, and an action that follows the relationship between the viewer and that user: an accepted friend offers «Убрать из друзей», an outgoing pending request shows «Заявка отправлена» without an add action, an incoming pending request is shown as awaiting the viewer's response without an add action, and no relationship offers «Добавить в друзья». It SHALL show that user's persisted statistics and recent records.

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
