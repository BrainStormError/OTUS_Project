# ui/design-system Specification

## Purpose
Defines the visual foundation every screen composes from: the two selectable themes, their strictly matte palettes, the persisted theme switch, and the allowed motion tokens.

## Requirements

### Requirement: Two selectable themes
The application SHALL provide exactly two themes, light and dark, selectable by the user at runtime.

#### Scenario: User selects a theme
- **WHEN** the user activates the theme switch on a main screen
- **THEN** the application applies the selected theme to all screens immediately

#### Scenario: Theme choice persists
- **WHEN** a user has selected a theme and later reloads or returns to the application
- **THEN** the previously selected theme is applied on load without the user re-selecting it

#### Scenario: Theme switch available from main screens
- **WHEN** the user is on Home/Search, My Films, Profile, Friends, or Groups
- **THEN** a theme switch control is reachable without leaving the screen, and it is also present in Settings

### Requirement: Strictly matte palette per theme
Each theme SHALL be composed only from its matte anchor palette, and the interface SHALL NOT use toxic, acid, or neon colors or gradients on primary actions.

The dark anchors are deep dark-maroon `#4A1F2B`, gray `#2B2B2B`, and near-black `#121212`. The light anchors are matte light-sky `#D6EAF8`, white `#FFFFFF`, and beige `#F3E9DA`.

#### Scenario: Dark theme composition
- **WHEN** the dark theme is active
- **THEN** the canvas uses near-black, surfaces use gray, and the brand and chrome color is the deep dark-maroon

#### Scenario: Light theme composition
- **WHEN** the light theme is active
- **THEN** surfaces use white and beige and the matte light-sky is used for selection, chips, and informational surfaces

#### Scenario: No toxic or gradient color
- **WHEN** any screen is rendered in either theme
- **THEN** no neon, acid, or high-saturation toxic color and no gradient appear on primary actions

### Requirement: Theme tokens resolve all colors
Both palettes SHALL be expressed through shared semantic token roles — background, surface, border, foreground, muted foreground, primary action, accent, destructive, and focus ring — so that screens reference tokens rather than hardcoded colors.

#### Scenario: Screen uses tokens
- **WHEN** a screen needs a color for text, surface, border, or action
- **THEN** it resolves through a shared theme token

#### Scenario: Switching theme re-resolves tokens
- **WHEN** the active theme changes
- **THEN** every element that uses a token updates to the corresponding value of the new theme

### Requirement: Allowed motion only
The interface SHALL use only fade, slide, hover, and skeleton animations, with a duration between 150 ms and 250 ms, and SHALL honor the user's reduced-motion preference.

#### Scenario: Animation duration
- **WHEN** a fade, slide, hover, or skeleton animation runs
- **THEN** its duration is within 150–250 ms

#### Scenario: Reduced motion honored
- **WHEN** the operating system signals a reduced-motion preference
- **THEN** transitions become immediate state changes and no looping or continuous motion is presented

#### Scenario: Excluded motion types
- **WHEN** any screen is rendered
- **THEN** no parallax, bounce, rotation, scaling flourish, or multi-step complex transition is used
