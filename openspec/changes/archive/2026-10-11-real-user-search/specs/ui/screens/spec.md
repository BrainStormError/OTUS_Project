## MODIFIED Requirements

### Requirement: Friends screen
The friends section SHALL provide profile search over real user records, incoming and outgoing requests, and the list of current friends. Search results SHALL offer a working action to send a friend request where the relationship allows it, and the searcher's own profile SHALL NOT appear in the results.

#### Scenario: Searching profiles
- **WHEN** the user searches for a profile
- **THEN** matching users from the database are listed with an action to send a friend request, or a friend/pending marker when a relationship already exists

#### Scenario: Own profile not in results
- **WHEN** the user searches for their own name or handle
- **THEN** their own profile is not shown in the results

#### Scenario: Sending a request from search
- **WHEN** the user activates the add action on an eligible search result
- **THEN** a friend request is sent and the result reflects the pending status

#### Scenario: Managing requests
- **WHEN** a user has incoming friend requests
- **THEN** each request offers accept and decline actions, and the pending count is visible

#### Scenario: Viewing and withdrawing outgoing requests
- **WHEN** the user has sent friend requests that are still pending
- **THEN** each outgoing request is listed with a withdrawal action

#### Scenario: Friend list
- **WHEN** the user views their friends
- **THEN** current friends are listed with a link to each profile

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
