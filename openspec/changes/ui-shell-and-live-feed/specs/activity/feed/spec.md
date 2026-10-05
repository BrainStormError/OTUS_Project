## Purpose

Provides a persisted, real-time activity feed so a viewer can follow what their friends and groups are watching, with events recorded as domain changes happen and delivered to open clients without a page reload.

## ADDED Requirements

### Requirement: Activity events are recorded with the change
The system SHALL record an activity event when a feed-relevant action occurs — a user rates a film, a friend request is accepted, or a user joins a group — and SHALL record that event in the same transaction as the action, so an event exists if and only if the action succeeded.

#### Scenario: Rating records an event
- **WHEN** a user saves a watched record with a rating
- **THEN** an activity event for that rating is recorded with the user, the film, the rating value, and the watch date

#### Scenario: Accepting a friendship records an event
- **WHEN** a user accepts a friend request
- **THEN** an activity event for the new friendship is recorded

#### Scenario: Joining a group records an event
- **WHEN** a user joins a group
- **THEN** an activity event for the membership is recorded

#### Scenario: Failed action records no event
- **WHEN** a feed-relevant action fails
- **THEN** no activity event is recorded for it

### Requirement: Feed visibility
A viewer SHALL see activity authored by users they are accepted friends with and by groups they belong to, and SHALL see their own activity. Activity authored by profile-hidden users SHALL NOT be shown, and activity from restricted groups SHALL NOT be shown to viewers who are not members.

#### Scenario: Friends' activity is visible
- **WHEN** a friend of the viewer rates a film
- **THEN** that event appears in the viewer's feed

#### Scenario: Group activity is visible to members
- **WHEN** a member of a group the viewer belongs to posts activity
- **THEN** that event appears in the viewer's feed

#### Scenario: Strangers' activity is hidden
- **WHEN** a user who is not a friend and shares no group with the viewer is active
- **THEN** that user's events do not appear in the viewer's feed

#### Scenario: Hidden and restricted sources are excluded
- **WHEN** the author has a hidden profile or the group is restricted and the viewer is not a member
- **THEN** their events do not appear in the viewer's feed

### Requirement: Feed ordering and pagination
The feed SHALL be ordered newest first and SHALL be paginated with a stable cursor so that a client can load additional entries and resume after a reconnect without duplicates or gaps.

#### Scenario: Newest first
- **WHEN** the viewer loads the feed
- **THEN** entries are ordered by creation time descending

#### Scenario: Loading older entries
- **WHEN** the client requests the next page with the cursor returned by the previous page
- **THEN** it receives the next set of older entries and a new cursor, and no entry already received is repeated

#### Scenario: Reconnect catch-up
- **WHEN** a client reconnects after being offline and requests everything newer than the last entry it holds
- **THEN** it receives every event created since that entry, without gaps

### Requirement: Feed display size
The feed SHALL show the five most recent entries by default, SHALL offer a control to show 10 or 25 entries instead, and SHALL expand its container to fit the selected number of entries rather than clipping them.

#### Scenario: Default size
- **WHEN** the feed is first shown
- **THEN** the five most recent entries are displayed

#### Scenario: Selecting a larger size
- **WHEN** the viewer selects 10 or 25
- **THEN** the feed displays up to that many most recent entries and its container grows to fit them

#### Scenario: Scrollable when entries exceed the container
- **WHEN** the number of entries exceeds the displayed area
- **THEN** the feed scrolls vertically within its container

### Requirement: Real-time delivery
New activity SHALL be delivered to an open client without a page reload, and the client SHALL show it without disrupting the viewer's current position in the feed.

#### Scenario: Event arrives live
- **WHEN** an event becomes visible to the connected viewer after the feed was loaded
- **THEN** the client receives it and presents it among the newest entries without reloading the page

#### Scenario: Scroll position preserved
- **WHEN** a new event arrives while the viewer is scrolled down
- **THEN** the viewer's scroll position is not moved unexpectedly, and new entries are indicated until the viewer returns to the top

### Requirement: Streaming fallback
When the real-time stream cannot be established or is lost, the client SHALL recover by re-fetching the feed so the viewer still sees current activity, and SHALL retry the stream.

#### Scenario: Stream unavailable
- **WHEN** the client cannot open the real-time stream
- **THEN** the feed is still populated from a data fetch and marks itself as up to date on the next successful refresh

#### Scenario: Stream drops
- **WHEN** an established stream disconnects
- **THEN** the client catches up on missed events and attempts to reconnect
