## Purpose

Lets a signed-in user change their own display name and unique tag (handle) under clear validation, uniqueness, reserved-value, and frequency rules.

## ADDED Requirements

### Requirement: Editable own identity

A signed-in user SHALL be able to update their own display name and their own tag. Only the owner of the account SHALL be able to change them; an anonymous request or a request targeting another account SHALL be rejected without changing anything.

#### Scenario: Owner updates identity

- **WHEN** a signed-in user submits a new display name and/or a new tag for their own account
- **THEN** the stored identity is updated and the new values are shown afterwards

#### Scenario: Anonymous request rejected

- **WHEN** a request without a valid session attempts to change an identity
- **THEN** the change is rejected and no value is modified

#### Scenario: Another account cannot be changed

- **WHEN** a signed-in user attempts to change another user's identity
- **THEN** the change is rejected and the other account is left unchanged

### Requirement: Display name bounds

The display name SHALL be trimmed of leading and trailing whitespace and SHALL contain between 1 and 100 characters after trimming. Display names MAY repeat between different accounts, and a user SHALL be able to change their display name without a frequency limit.

#### Scenario: Name accepted

- **WHEN** a user submits a non-empty display name of at most 100 characters
- **THEN** the trimmed value is stored

#### Scenario: Empty name rejected

- **WHEN** a user submits a display name that is empty or only whitespace
- **THEN** the input is rejected and the stored name is unchanged

#### Scenario: Over-limit name rejected

- **WHEN** a user submits a display name longer than 100 characters
- **THEN** the input is rejected and the stored name is unchanged

#### Scenario: Duplicate name allowed

- **WHEN** a user saves a display name already used by another account
- **THEN** the name is saved

#### Scenario: Name has no cooldown

- **WHEN** a user changes their display name repeatedly
- **THEN** each valid change is accepted without a frequency limit

### Requirement: Tag format and reserved values

A tag (handle) SHALL consist only of lowercase Latin letters `a-z`, digits `0-9`, underscore `_`, and hyphen `-`, SHALL contain between 1 and 50 characters, and SHALL contain no whitespace. The values `admin` and `root` SHALL be reserved and rejected.

#### Scenario: Valid tag accepted

- **WHEN** a user submits a tag such as `film_club-2`
- **THEN** the tag is accepted

#### Scenario: Uppercase or invalid character rejected

- **WHEN** a user submits a tag containing an uppercase letter, whitespace, or any character outside the allowed set
- **THEN** the input is rejected and the stored tag is unchanged

#### Scenario: Over-limit tag rejected

- **WHEN** a user submits a tag longer than 50 characters
- **THEN** the input is rejected and the stored tag is unchanged

#### Scenario: Reserved tag rejected

- **WHEN** a user submits the tag `admin` or `root`
- **THEN** the input is rejected and the stored tag is unchanged

### Requirement: Tag uniqueness

Tags SHALL be unique across accounts. A change to a tag already taken by another account SHALL be rejected and SHALL NOT modify the stored tag.

#### Scenario: Taken tag rejected

- **WHEN** a user submits a tag already used by another account
- **THEN** the change is rejected and the stored tag is unchanged

#### Scenario: Submitting the current tag is not a change

- **WHEN** a user submits their own current tag
- **THEN** the request succeeds without modifying the tag and without starting or resetting the cooldown

### Requirement: Tag change cooldown

A user SHALL be able to change their tag at most once per month. A change attempted before one month has elapsed since the previous tag change SHALL be rejected, and the response SHALL indicate that the change is not yet allowed.

#### Scenario: First change accepted

- **WHEN** a user who has never changed their tag submits a valid new tag
- **THEN** the tag is changed and the change time is recorded

#### Scenario: Change within the cooldown rejected

- **WHEN** a user who changed their tag less than one month ago submits another valid new tag
- **THEN** the change is rejected and the stored tag is unchanged

#### Scenario: Change after the cooldown accepted

- **WHEN** at least one month has elapsed since the user's previous tag change and they submit a valid new tag
- **THEN** the change is accepted

### Requirement: Profile links follow the current tag

A profile SHALL be addressable by the account's current tag. After a tag change, the new tag SHALL resolve to the profile and the previous tag SHALL no longer resolve to it.

#### Scenario: New tag resolves

- **WHEN** a user changes their tag and another user opens the profile by the new tag
- **THEN** the profile of that account is shown

#### Scenario: Old tag no longer resolves

- **WHEN** a profile is opened by the account's previous tag after a change
- **THEN** the previous tag no longer resolves to that account
