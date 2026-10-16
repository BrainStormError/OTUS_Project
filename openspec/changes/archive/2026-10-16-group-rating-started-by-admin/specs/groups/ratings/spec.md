## MODIFIED Requirements

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
