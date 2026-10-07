## Purpose

Provides account-backed user identity and interconnected social data (friendships, group memberships, ratings, discussions) as the single source for profiles and social screens, together with a deterministic development seed that populates linked data for testing.

## ADDED Requirements

### Requirement: Account-backed identity

The system SHALL derive the current user's identity, and any user profile, from stored user data associated with the signed-in account, and SHALL resolve other users by their handle.

#### Scenario: Signed-in account identity

- **WHEN** a signed-in user opens the header or their own profile
- **THEN** the displayed name and handle are those of the signed-in account, not a fixed demo identity

#### Scenario: Other user resolved by handle

- **WHEN** a user opens another user's profile by handle
- **THEN** the profile shows that user's stored identity when it exists, and a not-found state otherwise

#### Scenario: Newly created demo account is linkable

- **WHEN** a user signs in with an email that has no stored record and an account is created
- **THEN** the account has a non-null handle usable in profile links

### Requirement: Interconnected user data

The system SHALL store and query social relationships and personal activity (friendships, group memberships, ratings, discussions) as connected records, and SHALL present a user's own records and statistics from that data.

#### Scenario: Profile reflects stored data

- **WHEN** a user opens their own profile
- **THEN** statistics and recent records are computed from their stored ratings, and the friend list contains only users connected to them by an accepted friendship

#### Scenario: Relationship consistency

- **WHEN** a user creates a comment or a rating
- **THEN** it is attributed to that account and appears on that account's profile and to others permitted to see it

### Requirement: Deterministic development seed

The system SHALL provide a development seed that populates connected data for the demo accounts, including ratings, friendships, group memberships, and discussions, so profiles and social screens are populated for testing, and re-running the seed SHALL produce the same data set.

#### Scenario: Populated profiles after seed

- **WHEN** the development seed has run
- **THEN** every demo account has ratings that produce non-empty statistics and appears in at least one connected relationship

#### Scenario: Deterministic re-run

- **WHEN** the seed is run again
- **THEN** it resets and recreates the same fixed data set without duplicate or conflicting records

### Requirement: Reference catalog separation

Media catalog content SHALL remain reference data provided by the application, independent of user data, while ratings and discussions reference catalog entries by a stable identifier.

#### Scenario: Rating references a catalog entry

- **WHEN** a user rates a film or a series
- **THEN** the stored record references that catalog entry by its stable identifier and does not duplicate the catalog
