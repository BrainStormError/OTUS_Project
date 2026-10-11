## ADDED Requirements

### Requirement: Rail collapse control placement
In the desktop shell, the sidebar collapse control SHALL be horizontally aligned with the column of section icons rather than offset to the opposite edge, and it SHALL remain centered over the icon column when the rail is collapsed.

#### Scenario: Expanded rail alignment
- **WHEN** the desktop rail is expanded
- **THEN** the collapse control is positioned in the same horizontal column as the section icons

#### Scenario: Collapsed rail alignment
- **WHEN** the desktop rail is collapsed
- **THEN** the expand control remains centered over the icon column

### Requirement: Distinct section icons
Each primary section SHALL use an icon that is visually distinguishable from the others, and in particular the Friends and Groups entries SHALL NOT use near-identical icons.

#### Scenario: Friends and Groups distinguishable
- **WHEN** the navigation shell is rendered on desktop or mobile
- **THEN** the Friends and Groups entries show different icon shapes that can be told apart at a glance

### Requirement: Sign-in destination
A successful sign-in SHALL land the user on Home, and no retired or non-product screen SHALL be used as the post-authentication destination.

#### Scenario: Demo sign-in lands on Home
- **WHEN** the user signs in with valid credentials
- **THEN** they are taken to Home

#### Scenario: OAuth sign-in lands on Home
- **WHEN** the user completes OAuth sign-in
- **THEN** they are taken to Home
