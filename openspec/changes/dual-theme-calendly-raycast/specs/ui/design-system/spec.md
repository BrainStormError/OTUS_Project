## MODIFIED Requirements

### Requirement: Two selectable themes
The application SHALL provide exactly two themes, light and dark, selectable by the user at runtime. The light theme SHALL follow the Calendly style reference (`LIGHT_DESIGN.md`) and the dark theme SHALL follow the Raycast style reference (`DARK_DESIGN.md`).

#### Scenario: User selects a theme
- **WHEN** the user activates the theme switch on a main screen
- **THEN** the application applies the selected theme to all screens immediately

#### Scenario: Theme choice persists
- **WHEN** a user has selected a theme and later reloads or returns to the application
- **THEN** the previously selected theme is applied on load without the user re-selecting it

#### Scenario: Theme switch available from main screens
- **WHEN** the user is on Home/Search, My Films, Profile, Friends, or Groups
- **THEN** a theme switch control is reachable without leaving the screen, and it is also present in Settings

#### Scenario: Light theme follows the Calendly reference
- **WHEN** the light theme is active
- **THEN** the interface uses the Calendly composition: a cool near-white canvas, white elevated surfaces, navy text, and a single signal-blue primary action

#### Scenario: Dark theme follows the Raycast reference
- **WHEN** the dark theme is active
- **THEN** the interface uses the Raycast composition: a near-black canvas, hairline borders, a neutral light primary action, and coral reserved for brand marks

### Requirement: Strictly matte palette per theme
Each theme SHALL be composed only from its reference palette, and the interface SHALL NOT use toxic or acid colors and SHALL NOT use gradients or accent color as the fill of a primary action.

The light theme anchors are Calendly's Cloud `#F8F9FB` canvas, Paper `#FFFFFF` surfaces, Ink Navy `#0B3558` text, Signal Blue `#006BFF` primary action, Slate Gray `#476788` muted text, and Hairline `#D4E0ED` borders. The dark theme anchors are Raycast's Void Black `#040506` canvas, Ink `#07080A` surfaces, Pure White `#FFFFFF` / Ash `#9C9C9D` text, Mist `#E6E6E6` primary action with Iron `#454647` label, Coral Pulse `#FF6363` brand accent, and hairline `#363739` borders.

#### Scenario: Light theme composition
- **WHEN** the light theme is active
- **THEN** the canvas is the cool near-white Cloud, surfaces are Paper white, text is Ink Navy or Slate Gray, and the primary action is the Signal Blue fill

#### Scenario: Dark theme composition
- **WHEN** the dark theme is active
- **THEN** the canvas is Void Black, surfaces step up to Ink, text is Pure White or Ash, and the primary action is the neutral Mist fill with an Iron label

#### Scenario: Accent reserved for brand marks
- **WHEN** a theme is rendered
- **THEN** decorative accent color appears only in brand marks, key indicators, and atmospheric surfaces, never as the fill of a primary action

#### Scenario: No toxic or gradient color
- **WHEN** any screen is rendered in either theme
- **THEN** no toxic or acid color and no gradient appear on primary actions

### Requirement: Theme tokens resolve all colors
Both palettes SHALL be expressed through shared semantic token roles — background, surface, border, foreground, muted foreground, primary action, accent, destructive, and focus ring — plus radius and elevation roles, so that screens reference tokens rather than hardcoded colors or ad-hoc shadow/radius utilities.

#### Scenario: Screen uses tokens
- **WHEN** a screen needs a color for text, surface, border, or action
- **THEN** it resolves through a shared theme token

#### Scenario: Switching theme re-resolves tokens
- **WHEN** the active theme changes
- **THEN** every element that uses a token updates to the corresponding value of the new theme

#### Scenario: Radius and elevation resolve through tokens
- **WHEN** a screen applies a corner radius or an elevation treatment to a surface
- **THEN** it resolves through a shared radius or elevation token rather than a hardcoded value

## ADDED Requirements

### Requirement: Interface typography
The interface SHALL be rendered in a loaded webfont rather than the browser default: Inter for the dark theme and Manrope (the prescribed Gilroy substitute) for the light theme, plus a monospace face for technical metadata.

#### Scenario: Themed typeface is applied
- **WHEN** either theme is active
- **THEN** the interface text is rendered in that theme's typeface and is not left to the system default sans

#### Scenario: Monospace for technical metadata
- **WHEN** technical metadata such as a version string or an identifier is displayed
- **THEN** it is rendered in the monospace face
