## ADDED Requirements

### Requirement: Watch-later entries linked by identifiers

A watch-later entry SHALL be persisted as its own entity with a numeric identifier, a foreign key to the owning user, a foreign key to the media, and a compact creation timestamp. At most one watch-later entry SHALL exist per user and media, and a new addition for an existing pair SHALL resolve to the existing entry instead of storing a duplicate.

#### Scenario: Entry stored with identifiers
- **WHEN** a watch-later entry is created
- **THEN** it stores the owning user and the media as numeric foreign keys and records when it was added

#### Scenario: One entry per user and media
- **WHEN** the same user adds the same media to the watch-later list again
- **THEN** no duplicate entry is stored

#### Scenario: Entry round-trips
- **WHEN** a watch-later entry is stored and read back
- **THEN** it resolves to the same user and media

#### Scenario: Deleting a user or media removes its entries
- **WHEN** a user or a media referenced by a watch-later entry is deleted
- **THEN** the affected watch-later entries are removed with it
