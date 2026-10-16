## MODIFIED Requirements

### Requirement: Settings screen

Settings SHALL provide theme selection, controls for how moments in time are displayed (timezone and 12/24-hour clock), an identity display preference, privacy controls for the profile and statistics, and actions to edit the signed-in account's display name and tag, each opening its own modal. Profile and statistics privacy SHALL be stored on the user's account, so a changed value persists when the user navigates away and returns, or reloads the application, and SHALL drive the server-side visibility of the user's activity and friendships.

#### Scenario: Theme and privacy controls

- **WHEN** the user opens Settings
- **THEN** the theme selection and the profile and statistics privacy toggles are available

#### Scenario: Time display controls

- **WHEN** the user opens Settings
- **THEN** a timezone selector and a 12/24-hour choice are available and reflect the current selection

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
