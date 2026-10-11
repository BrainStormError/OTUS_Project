## ADDED Requirements

### Requirement: Simultaneous group and personal rating

When a member saves a group rating, the save MAY also create or update that member's
personal rating for the same media. This SHALL be offered through an optional choice in the
group rating form, present both when starting a rating and when editing one. When the choice
is set, the group rating and the personal rating SHALL be written together in a single
operation using the same rating, comment, and watch date, so that either both records are
written or neither is. The personal rating written this way SHALL behave like a rating saved
from the personal My Films or My Series screen, including removal of the media from the
member's watchlist when present.

#### Scenario: Both ratings saved together

- **WHEN** a member saves a group rating with the "add to my films/series" choice set
- **THEN** both the group rating and the member's personal rating for that media exist

#### Scenario: Same values in both records

- **WHEN** the simultaneous save is performed
- **THEN** the personal rating carries the same rating, comment, and watch date as the group rating

#### Scenario: Choice not set leaves personal list unchanged

- **WHEN** a member saves a group rating without the choice
- **THEN** no personal rating is created or changed for that media

#### Scenario: Watchlist cleared on personal save

- **WHEN** the simultaneous save writes a personal rating for media on the member's watchlist
- **THEN** the media is removed from the member's watchlist

#### Scenario: Group deletion does not affect the personal rating

- **WHEN** the media entry is later deleted from the group
- **THEN** the member's personal rating for that media is unchanged

### Requirement: Overwriting an existing personal rating requires confirmation

When the simultaneous save is requested and the member already has a personal rating for that
media, the save SHALL be refused and nothing SHALL be written. The member SHALL be asked to
confirm that the existing personal rating will be overwritten. On confirmation the save SHALL
be retried and both records SHALL be written, replacing the personal rating's values. If the
confirmation is dismissed, the choice SHALL be cleared and nothing SHALL be saved.

#### Scenario: Existing personal rating blocks the save

- **WHEN** a member requests the simultaneous save for media they already rated personally
- **THEN** nothing is written and the member is asked to confirm the overwrite

#### Scenario: Confirmed overwrite writes both records

- **WHEN** the member confirms the overwrite
- **THEN** the personal rating is replaced with the form's values and the group rating is written

#### Scenario: Dismissed confirmation saves nothing

- **WHEN** the member dismisses the overwrite confirmation
- **THEN** the choice is cleared and neither the group nor the personal rating is changed
