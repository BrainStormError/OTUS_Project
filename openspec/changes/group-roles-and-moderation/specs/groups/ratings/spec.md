## MODIFIED Requirements

### Requirement: Rating media in a group

The owner of a group, and a moderator of that group, SHALL start rating a media in a group by saving their own rating for a film or series that has no group rating in that group yet; that first rating is what makes the media part of the group's ratings. A group member SHALL rate a media using the same rating experience as the personal My Films and My Series tabs: a rating from 0 to 10 in steps of 0.1, an optional comment, and a watch date. A member SHALL only be able to rate media that have already been started in the group; a member who is neither the owner nor a moderator SHALL NOT be able to start a media that has no group rating yet. A member's rating for one media in one group SHALL be upserted: re-rating the same media updates the member's rating. The attempt to start a media by a member who is neither the owner nor a moderator SHALL be rejected with a permission error.

#### Scenario: Owner or moderator starts a media

- **WHEN** the owner or a moderator saves a rating for a film that no member has rated in the group
- **THEN** the film becomes a rated media of the group carrying that member's rating

#### Scenario: Member rates a film

- **WHEN** a group member saves a rating of 8.4 with a comment for a film already rated in the group
- **THEN** the rating is persisted for that member, media, and group

#### Scenario: Re-rating updates

- **WHEN** a member saves a new rating for media they have already rated in the group
- **THEN** the member's existing rating is replaced, not duplicated

#### Scenario: Non-member cannot rate

- **WHEN** a user who is not a group member attempts to rate media in the group
- **THEN** the attempt is rejected with a permission error

#### Scenario: Ordinary member cannot start

- **WHEN** a member who is neither the owner nor a moderator attempts to save a rating for a media that has no group rating yet
- **THEN** the attempt is rejected with a permission error and no rating is saved

#### Scenario: Out-of-range rating rejected

- **WHEN** a member submits a rating below 0 or above 10
- **THEN** the form shows a validation message and nothing is saved

### Requirement: Group ratings tab

The group page SHALL provide a ratings tab listing the media rated in the group. Each entry SHALL show the media title, the group rating, and the attached discussion when one exists. Selecting an entry SHALL reveal the individual member ratings for that media. The tab SHALL offer the control that starts a media only to the owner and moderators of the group.

#### Scenario: Ratings list

- **WHEN** a group member opens the ratings tab
- **THEN** the media rated in the group are listed with their group rating

#### Scenario: Individual ratings revealed

- **WHEN** a member selects a rated media entry
- **THEN** each member's individual rating, comment, and watch date for that media are shown

#### Scenario: Empty ratings tab

- **WHEN** no media has been rated in the group
- **THEN** the tab shows the empty state explaining that the owner or a moderator starts the first rating

#### Scenario: Start control is owner-and-moderator only

- **WHEN** a member who is neither the owner nor a moderator opens the ratings tab
- **THEN** no control to start a media is offered, while the owner and moderators are offered that control

### Requirement: Attaching a discussion to a rated media

The owner of a group, and a moderator of that group, SHALL be able to attach a discussion to media rated in the group, and at most one discussion SHALL be attached to one media in a group. The attached discussion is a group discussion whose comments follow the forum rules of the group. Members who are neither the owner nor a moderator MUST be rejected when attempting to attach a discussion.

#### Scenario: Admin attaches a discussion

- **WHEN** the owner or a moderator attaches a discussion to a film rated in the group
- **THEN** the discussion is linked to that media and is shown in the ratings tab entry for it

#### Scenario: One discussion per media

- **WHEN** the owner or a moderator attempts to attach a second discussion to media that already has one
- **THEN** the attempt is rejected

#### Scenario: Only rated media can host a discussion

- **WHEN** the owner or a moderator attempts to attach a discussion to media that no member has rated in the group
- **THEN** the attempt is rejected

#### Scenario: Non-admin attach rejected

- **WHEN** a member who is neither the owner nor a moderator attempts to attach a discussion to a rated media
- **THEN** the attempt is rejected with a permission error

## ADDED Requirements

### Requirement: Deleting a media entry from the group

The owner of a group SHALL be able to delete a media entry from the group's ratings, used when the wrong film or series was chosen for the group. Deleting a media entry SHALL remove every member's rating for that group and media, SHALL remove the discussion attached to that media together with its comments, and SHALL remove the group activity events for that media. Deleting a media entry SHALL NOT remove the media from the shared catalog and SHALL NOT affect any member's personal rating of that media. A moderator, a member, and a non-member MUST be rejected when attempting to delete a media entry.

#### Scenario: Owner deletes a media entry

- **WHEN** the owner deletes a media entry from the group
- **THEN** that media no longer appears in the group's ratings tab and no member's group rating for it remains

#### Scenario: Attached discussion removed with the entry

- **WHEN** the owner deletes a media entry that has an attached discussion with comments
- **THEN** that discussion and its comments are removed

#### Scenario: Activity removed with the entry

- **WHEN** the owner deletes a media entry
- **THEN** the group activity events for that media are removed and no feed entry referencing it remains

#### Scenario: Personal ratings untouched

- **WHEN** the owner deletes a media entry for media that members also rated personally
- **THEN** each member's personal rating of that media is unchanged

#### Scenario: Moderator and member cannot delete a media entry

- **WHEN** a moderator or a member who is not the owner attempts to delete a media entry
- **THEN** the attempt is rejected with a permission error
