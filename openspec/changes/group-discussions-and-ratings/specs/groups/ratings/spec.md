## Purpose

Defines group ratings for films and series: how members rate media inside a group, how the group rating is derived as the average of member ratings, the group's ratings tab, and how an administrator attaches exactly one discussion to a rated media.

## ADDED Requirements

### Requirement: Rating media in a group
A group member SHALL be able to rate a film or series within a group using the same rating experience as the personal My Films and My Series tabs: a rating from 0 to 10 in steps of 0.1, an optional comment, and a watch date. A member's rating for one media in one group SHALL be upserted: re-rating the same media updates the member's rating.

#### Scenario: Member rates a film
- **WHEN** a group member saves a rating of 8.4 with a comment for a film in a group
- **THEN** the rating is persisted for that member, media, and group

#### Scenario: Re-rating updates
- **WHEN** a member saves a new rating for media they have already rated in the group
- **THEN** the member's existing rating is replaced, not duplicated

#### Scenario: Non-member cannot rate
- **WHEN** a user who is not a group member attempts to rate media in the group
- **THEN** the attempt is rejected with a permission error

#### Scenario: Out-of-range rating rejected
- **WHEN** a member submits a rating below 0 or above 10
- **THEN** the form shows a validation message and nothing is saved

### Requirement: Group ratings tab
The group page SHALL provide a ratings tab listing the media rated in the group. Each entry SHALL show the media title, the group rating, and the attached discussion when one exists. Selecting an entry SHALL reveal the individual member ratings for that media.

#### Scenario: Ratings list
- **WHEN** a group member opens the ratings tab
- **THEN** the media rated in the group are listed with their group rating

#### Scenario: Individual ratings revealed
- **WHEN** a member selects a rated media entry
- **THEN** each member's individual rating, comment, and watch date for that media are shown

#### Scenario: Empty ratings tab
- **WHEN** no media has been rated in the group
- **THEN** the tab shows the empty state explaining how a member adds the first rating

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
