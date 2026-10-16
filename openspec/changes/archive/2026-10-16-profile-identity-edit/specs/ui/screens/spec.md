## MODIFIED Requirements

### Requirement: Profile screen

The application SHALL provide a profile screen for the current user and for other users. For the current user it SHALL show the signed-in account's identity and SHALL offer controls to edit the display name and the tag, each opening its own modal; for other users it SHALL show the addressed user's stored identity, resolved by handle, and SHALL NOT offer edit controls. It SHALL show that user's persisted statistics and recent records and the actions relevant to the relationship.

#### Scenario: Own profile

- **WHEN** the user opens their own profile
- **THEN** the signed-in account's identity, its persisted statistics, and its persisted recent records are shown with edit and privacy entry points

#### Scenario: Other user's profile

- **WHEN** the user opens another user's profile
- **THEN** that user's stored identity and, when permitted, persisted statistics are shown with a relationship action such as adding a friend

#### Scenario: Unknown handle

- **WHEN** the user opens a profile for a handle that has no stored user
- **THEN** the screen presents a not-found state instead of a profile

#### Scenario: Edit controls on own profile

- **WHEN** the current user opens their own profile
- **THEN** an edit control is shown next to the display name and next to the tag, each opening a modal for that field

#### Scenario: No edit controls on another profile

- **WHEN** a user opens another user's profile
- **THEN** no edit control is shown

#### Scenario: Edit modal saves the value

- **WHEN** the current user confirms a valid new value in an edit modal
- **THEN** the profile reflects the new value

### Requirement: Settings screen

Settings SHALL provide theme selection, an identity display preference, privacy controls for the profile and statistics, and actions to edit the signed-in account's display name and tag, each opening its own modal. Profile and statistics privacy SHALL be stored on the user's account, so a changed value persists when the user navigates away and returns, or reloads the application, and SHALL drive the server-side visibility of the user's activity and friendships.

#### Scenario: Theme and privacy controls

- **WHEN** the user opens Settings
- **THEN** the theme selection and the profile and statistics privacy toggles are available

#### Scenario: Privacy change feedback

- **WHEN** the user toggles a privacy control
- **THEN** the control reflects the new value and provides a saving or saved indication

#### Scenario: Privacy persists across navigation

- **WHEN** the user changes a privacy toggle, navigates to another section, and returns to Settings
- **THEN** the toggle still shows the changed value

#### Scenario: Privacy persists across reload

- **WHEN** the user changes a privacy toggle and reloads the application
- **THEN** the account's stored privacy value is applied on load

#### Scenario: Privacy change reported on failure

- **WHEN** saving a privacy change fails
- **THEN** the control reports that the change was not saved and does not present the saved state

#### Scenario: Identity edit actions in Settings

- **WHEN** the user opens Settings
- **THEN** buttons to edit the display name and the tag are shown, each opening a modal for that field
