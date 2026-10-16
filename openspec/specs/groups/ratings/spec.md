# groups/ratings Specification

## Purpose
Defines group ratings for films and series: how members rate media inside a group, how the group rating is derived as the average of member ratings, the group's ratings tab, and how an administrator attaches exactly one discussion to a rated media.

## Requirements

### Requirement: Rating media in a group

A group administrator SHALL start rating a media in a group by saving their own rating for a film or series that has no group rating in that group yet; that first rating is what makes the media part of the group's ratings. A group member SHALL rate a media using the same rating experience as the personal My Films and My Series tabs: a rating from 0 to 10 in steps of 0.1, an optional comment, and a watch date. A member SHALL only be able to rate media that have already been started in the group; a member who is not an administrator SHALL NOT be able to start a media that has no group rating yet. A member's rating for one media in one group SHALL be upserted: re-rating the same media updates the member's rating. The attempt to start a media by a non-administrator SHALL be rejected with a permission error.

#### Scenario: Administrator starts a media

- **WHEN** an administrator saves a rating for a film that no member has rated in the group
- **THEN** the film becomes a rated media of the group carrying the administrator's rating

#### Scenario: Member rates a film

- **WHEN** a group member saves a rating of 8.4 with a comment for a film already rated in the group
- **THEN** the rating is persisted for that member, media, and group

#### Scenario: Re-rating updates

- **WHEN** a member saves a new rating for media they have already rated in the group
- **THEN** the member's existing rating is replaced, not duplicated

#### Scenario: Non-member cannot rate

- **WHEN** a user who is not a group member attempts to rate media in the group
- **THEN** the attempt is rejected with a permission error

#### Scenario: Non-administrator cannot start

- **WHEN** a member who is not an administrator attempts to save a rating for a media that has no group rating yet
- **THEN** the attempt is rejected with a permission error and no rating is saved

#### Scenario: Out-of-range rating rejected

- **WHEN** a member submits a rating below 0 or above 10
- **THEN** the form shows a validation message and nothing is saved

### Requirement: Group ratings tab

The group page SHALL provide a ratings tab listing the media rated in the group. Each entry SHALL show the media title, the group rating, and the attached discussion when one exists. Selecting an entry SHALL reveal the individual member ratings for that media. The tab SHALL offer the control that starts a media only to group administrators.

#### Scenario: Ratings list

- **WHEN** a group member opens the ratings tab
- **THEN** the media rated in the group are listed with their group rating

#### Scenario: Individual ratings revealed

- **WHEN** a member selects a rated media entry
- **THEN** each member's individual rating, comment, and watch date for that media are shown

#### Scenario: Empty ratings tab

- **WHEN** no media has been rated in the group
- **THEN** the tab shows the empty state explaining that an administrator starts the first rating

#### Scenario: Start control is administrator-only

- **WHEN** a member who is not an administrator opens the ratings tab
- **THEN** no control to start a media is offered, while an administrator is offered that control

### Requirement: Group rating is the members' average
The group rating of a media SHALL be the average of the ratings given to that media by group members, rounded to one decimal place, and SHALL be computed from the stored member ratings at read time. The group rating SHALL change when any member's rating changes.

#### Scenario: Average of member ratings
- **WHEN** two members rated a film 8 and 9 in a group
- **THEN** the group rating shown for that film is 8.5

#### Scenario: Average follows an update
- **WHEN** a member changes their rating for a media
- **THEN** the group rating of that media reflects the new average

### Requirement: Attaching a discussion to a rated media
Only a group administrator SHALL be able to attach a discussion to media rated in the group, and at most one discussion SHALL be attached to one media in a group. The attached discussion is a group discussion whose comments follow the forum rules of the group. Non-admin members MUST be rejected when attempting to attach a discussion.

#### Scenario: Admin attaches a discussion
- **WHEN** a group administrator attaches a discussion to a film rated in the group
- **THEN** the discussion is linked to that media and is shown in the ratings tab entry for it

#### Scenario: One discussion per media
- **WHEN** an administrator attempts to attach a second discussion to media that already has one
- **THEN** the attempt is rejected

#### Scenario: Only rated media can host a discussion
- **WHEN** an administrator attempts to attach a discussion to media that no member has rated in the group
- **THEN** the attempt is rejected

#### Scenario: Non-admin attach rejected
- **WHEN** a member without the admin role attempts to attach a discussion to a rated media
- **THEN** the attempt is rejected with a permission error

### Requirement: Rating activity events
Saving or updating a group rating SHALL be recorded as a group activity event carrying the media title and rating, visible in the group's activity feed.

#### Scenario: Rating recorded
- **WHEN** a member saves a group rating for a film
- **THEN** a group activity event is recorded for that group with the media title and the member's rating

#### Scenario: Update recorded
- **WHEN** a member updates their group rating
- **THEN** a new group activity event is recorded reflecting the updated rating

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
