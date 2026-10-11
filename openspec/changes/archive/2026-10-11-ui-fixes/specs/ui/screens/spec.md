## MODIFIED Requirements

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
