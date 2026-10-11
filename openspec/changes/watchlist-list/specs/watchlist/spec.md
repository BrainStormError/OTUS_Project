## Purpose

Provides a private, per-account watch-later list of the films and series a user intends to watch, kept separate from the watched records and never visible to other users.

## ADDED Requirements

### Requirement: Private watch-later list

Each account SHALL have a private watch-later list of films and series that the user intends to watch. The list SHALL be visible only to its owner and SHALL NOT be exposed to any other user, and adding to or removing from it SHALL NOT produce social activity.

#### Scenario: Adding a title to the list
- **WHEN** the signed-in user adds a title to the watch-later list
- **THEN** that title appears in the user's watch-later list

#### Scenario: List is scoped to the media kind
- **WHEN** the user views the watch-later list for films or for series
- **THEN** only titles of that kind are shown

#### Scenario: List is private
- **WHEN** any other user views the first user's content
- **THEN** the first user's watch-later list is not shown, and no watch-later activity appears in any feed

#### Scenario: Adding the same title twice
- **WHEN** the user adds a title already present in the watch-later list
- **THEN** the list still contains a single entry for that title

### Requirement: Watch-later entry carries media metadata

A watch-later entry SHALL be backed by normalized media metadata (kind, external identifier, title, year, and genres) obtained from the catalog, so the list can be displayed without a second lookup. A title the catalog cannot resolve SHALL NOT be added.

#### Scenario: Added title shows metadata
- **WHEN** a title is added to the watch-later list
- **THEN** the list entry can show its title, year, and genres

#### Scenario: Unknown title not added
- **WHEN** the user attempts to add a title the catalog cannot resolve
- **THEN** the add fails and the list is unchanged

### Requirement: Manual removal from the watch-later list

The user SHALL be able to remove an entry from the watch-later list without rating it. Removing an entry SHALL NOT create, change, or delete any watched record.

#### Scenario: Remove without rating
- **WHEN** the user removes an entry from the watch-later list
- **THEN** the entry disappears from the list and no watched record is created for that title

#### Scenario: Removal does not affect watched records
- **WHEN** the user removes an entry from the watch-later list while holding watched records for other titles
- **THEN** those watched records remain unchanged

### Requirement: Watching a title removes it from the watch-later list

Saving a personal rating for a title SHALL remove any watch-later entry for the same user and title, regardless of the screen that saves the rating, so a title is never both watched and on the watch-later list.

#### Scenario: Rate from the watch-later list
- **WHEN** the user rates a title from the watch-later list
- **THEN** the title is removed from the watch-later list and appears in the user's watched records

#### Scenario: Rate from Home
- **WHEN** the user rates a title from the Home screen that is also on the watch-later list
- **THEN** the title is removed from the watch-later list

#### Scenario: Rate from My Films or My Series
- **WHEN** the user rates a title from the My Films or My Series add flow that is also on the watch-later list
- **THEN** the title is removed from the watch-later list

### Requirement: Watched and planned are mutually exclusive

A title SHALL NOT be both watched and on the watch-later list. Adding a title the user has already rated SHALL be rejected without creating a watch-later entry.

#### Scenario: Adding a watched title is rejected
- **WHEN** the user attempts to add an already-watched title to the watch-later list
- **THEN** no watch-later entry is created and the title remains only in the watched records

#### Scenario: List never contains a watched title
- **WHEN** the watch-later list is displayed
- **THEN** it contains no title that is present among the user's watched records
