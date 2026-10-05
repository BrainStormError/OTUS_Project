## MODIFIED Requirements

### Requirement: Two selectable themes
The application SHALL provide exactly two themes, light and dark, selectable by the user in Settings. The theme SHALL NOT be selectable from the top bar or any screen other than Settings.

#### Scenario: User selects a theme
- **WHEN** the user selects a theme in Settings
- **THEN** the application applies the selected theme to all screens immediately

#### Scenario: Theme choice persists
- **WHEN** a user has selected a theme and later reloads or returns to the application
- **THEN** the previously selected theme is applied on load without the user re-selecting it

#### Scenario: Theme switch available from main screens
- **WHEN** the user is on any screen other than Settings
- **THEN** no theme switch is presented there; the theme is selected only in Settings
