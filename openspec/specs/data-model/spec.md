# data-model Specification

## Purpose
Defines the persistence contract for the tracker's domain: compact numeric identifiers and id-based relations, normalized media metadata, a single ratings model for personal and group ratings, coded genre/tag references, activity events linked by foreign keys, bounded user text, and coherent, meaningful seed data.

## Requirements

### Requirement: Numeric identifiers and id-based relations

Every persisted entity SHALL use a positive integer identifier as its primary key, and every relation between entities SHALL be expressed through that numeric identifier as a foreign key. String-based identifiers (UUIDs) and random-UUID generation SHALL NOT be used for primary or foreign keys.

#### Scenario: Entity identifiers are numeric

- **WHEN** any entity (user, media, rating, group, discussion, post, friendship, activity event) is stored
- **THEN** its identifier is a positive integer

#### Scenario: Relations use identifiers

- **WHEN** any entity references another entity
- **THEN** the reference is stored as the referenced entity's numeric identifier with a foreign-key constraint

#### Scenario: Public responses expose numeric identifiers

- **WHEN** an API response or feed cursor exposes an entity identifier
- **THEN** the exposed value is the numeric identifier, parseable as an integer

### Requirement: Normalized media metadata

Media metadata (kind, external reference, title, year, genres) SHALL be stored once per media entity. Ratings and discussions SHALL reference the media entity by its identifier instead of repeating media metadata.

#### Scenario: One record per media

- **WHEN** two users rate the same film
- **THEN** a single media record exists for that film and both ratings reference it

#### Scenario: Discussion references media by identifier

- **WHEN** a discussion is attached to a media
- **THEN** the discussion stores the media identifier rather than a kind/reference pair

### Requirement: Unified ratings model

Personal ratings and group ratings SHALL share a single ratings model. A rating is personal when it has no group, and a group rating when it is associated with a group. A user SHALL have at most one personal rating per media, and at most one group rating per media per group; saving again SHALL update the existing rating instead of creating a duplicate.

#### Scenario: Personal rating uniqueness

- **WHEN** a user saves a second personal rating for the same media
- **THEN** the existing personal rating is updated, not duplicated

#### Scenario: Group rating uniqueness

- **WHEN** a member saves a second rating for the same media in the same group
- **THEN** the existing group rating for that member is updated, not duplicated

#### Scenario: Group rating is distinct from personal rating

- **WHEN** a user has a personal rating and a group rating for the same media
- **THEN** both exist independently, distinguished by the group association

#### Scenario: Rating value stored compactly

- **WHEN** a rating between 0 and 10 with one decimal place is saved
- **THEN** it is persisted in a compact numeric representation and read back with the same value

### Requirement: Coded genre and tag references

Genres of media and tags of groups SHALL be selected from shared dictionaries and referenced by numeric dictionary codes stored inline with the media or group. Free-text genre and tag lists SHALL NOT be stored per rating.

#### Scenario: Media stores genre codes

- **WHEN** a media is saved with genres
- **THEN** it stores the numeric codes of those genres from the genre dictionary

#### Scenario: Group stores tag codes

- **WHEN** a group is saved with tags
- **THEN** it stores the numeric codes of those tags from the tag dictionary

#### Scenario: Genre names resolved from dictionary

- **WHEN** media genres are displayed
- **THEN** the numeric codes resolve to names through the genre dictionary

### Requirement: Activity events linked by identifier

An activity event SHALL reference its actor and its target entities through foreign-key identifiers (media and/or discussion, plus group when applicable). Denormalized display payloads (titles, ratings, links, actor names) SHALL NOT be stored in the event; display data SHALL be derived from the referenced entities.

#### Scenario: Rating event references media

- **WHEN** a rating activity event is recorded
- **THEN** it references the rated media by identifier and carries no stored title or rating copy

#### Scenario: Discussion event references discussion

- **WHEN** a discussion or comment activity event is recorded
- **THEN** it references the discussion by identifier and carries no stored title or link

#### Scenario: Feed display data derived

- **WHEN** a feed entry is displayed
- **THEN** its title, rating, actor, and link are derived from the referenced entities

### Requirement: Bounded user-authored text

Every user-authored text field SHALL be bounded both by a database constraint and by input validation: a rating comment, a discussion title, and a post body SHALL be limited to at most 1000 characters; a user display name and a group name SHALL be limited to at most 100 characters; a group tag SHALL be limited to at most 80 characters.

#### Scenario: Over-limit comment rejected

- **WHEN** a user submits a comment longer than 1000 characters
- **THEN** the input is rejected and nothing is saved

#### Scenario: Boundary comment accepted

- **WHEN** a user submits a comment of exactly 1000 characters
- **THEN** it is saved successfully

#### Scenario: Over-limit name or tag rejected

- **WHEN** a user submits a display name longer than 100 characters, a group name longer than 100 characters, or a tag longer than 80 characters
- **THEN** the input is rejected and nothing is saved

#### Scenario: Boundary name and tag accepted

- **WHEN** a display name of exactly 100 characters, a group name of exactly 100 characters, or a tag of exactly 80 characters is submitted
- **THEN** it is saved successfully

### Requirement: Case-insensitive unique names

Group names and tag names SHALL be unique without regard to letter case, while their stored and displayed text SHALL preserve the original case.

#### Scenario: Group name collision by case rejected

- **WHEN** a group name is stored that differs from an existing group name only by letter case
- **THEN** the second name is rejected

#### Scenario: Tag collision by case reuses the existing tag

- **WHEN** a tag is stored that differs from an existing tag only by letter case
- **THEN** the existing tag row is reused instead of inserting a duplicate

#### Scenario: Original case preserved

- **WHEN** a name with mixed case is stored
- **THEN** reading it back returns the original case

### Requirement: Extensible tag dictionary

The tag dictionary SHALL accept a new tag value when a group is saved with a tag not yet present, assigning it a generated numeric identifier, and groups SHALL continue to reference tags only by their numeric dictionary codes.

#### Scenario: New tag receives an identifier

- **WHEN** a group is saved with a tag value that does not exist in the dictionary
- **THEN** a new tag row with a generated numeric identifier is created

#### Scenario: Groups reference tags by code

- **WHEN** a group's tags are stored
- **THEN** the group stores the numeric codes of those tags, not the tag text

### Requirement: Group invitation relation

An invitation to a group SHALL be persisted as its own entity with a numeric identifier, foreign keys to the group, the inviting user, and the invited user, and a compact status code (pending, accepted, declined). At most one invitation SHALL exist per group and invited user.

#### Scenario: Invitation stored with identifiers

- **WHEN** an invitation is created
- **THEN** it stores the group, inviter, and invitee as numeric foreign keys and a status code

#### Scenario: One invitation per group and invitee

- **WHEN** a second invitation would be created for the same group and invited user
- **THEN** it is rejected or resolves to the existing invitation rather than storing a duplicate

#### Scenario: Status round-trips

- **WHEN** an invitation status is stored and read back
- **THEN** it returns the same logical status

### Requirement: Compact enumerated values

Fixed-choice fields (user role, friendship status, media kind, activity kind, group member role) SHALL be stored as compact codes rather than free text, with the allowed set enforced by the schema.

#### Scenario: Invalid code rejected

- **WHEN** a value outside the allowed set is written to an enumerated field
- **THEN** the write is rejected

#### Scenario: Enumerated value round-trips

- **WHEN** an entity with an enumerated field is stored and read back
- **THEN** it returns the same logical value

### Requirement: Coherent seed data

Development seed data SHALL be internally consistent: every activity event SHALL reference existing ratings or discussions, every group SHALL have members, every discussion SHALL have at least one post, and every referenced identifier SHALL resolve. Seed data SHALL exercise the text limit and the full range of enumerated values.

#### Scenario: Events match stored ratings

- **WHEN** the seed is applied and the feed is read
- **THEN** each rating event corresponds to a stored rating with the same value and media

#### Scenario: No orphan references

- **WHEN** the seed is applied
- **THEN** every foreign key in the seeded rows resolves to an existing row

#### Scenario: Seed is deterministic

- **WHEN** the seed is run more than once
- **THEN** the resulting dataset is the same
