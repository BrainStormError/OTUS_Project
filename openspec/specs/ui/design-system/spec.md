# ui/design-system Specification

## Purpose
Defines the visual foundation every screen composes from: the two selectable themes, their strictly matte palettes, the persisted theme switch, and the allowed motion tokens.

## Requirements

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

### Requirement: Allowed motion only
The interface SHALL use only fade, slide, hover, skeleton, and panel/dropdown reveal-collapse animations, with a duration between 150 ms and 250 ms, and SHALL honor the user's reduced-motion preference.

#### Scenario: Animation duration
- **WHEN** a fade, slide, hover, skeleton, or reveal-collapse animation runs
- **THEN** its duration is within 150–250 ms

#### Scenario: Shell panels and dropdowns animate
- **WHEN** the sidebar is collapsed or expanded, or a dropdown or dialog is opened or closed
- **THEN** it transitions with a fade or slide within the timing budget rather than appearing or disappearing instantly

#### Scenario: Reduced motion honored
- **WHEN** the operating system signals a reduced-motion preference
- **THEN** transitions become immediate state changes and no looping or continuous motion is presented

#### Scenario: Excluded motion types
- **WHEN** any screen is rendered
- **THEN** no parallax, bounce, rotation, scaling flourish, or multi-step complex transition is used

### Requirement: Brand wordmark prominence
The product wordmark ("Смотровик") in the top bar SHALL be rendered at a prominent heading size that is visibly larger than the surrounding body and control text, in both themes and on both desktop and mobile shells.

#### Scenario: Wordmark larger than surrounding text
- **WHEN** the top bar is rendered on desktop or mobile
- **THEN** the wordmark's font size is larger than the body and control text around it

#### Scenario: Wordmark remains legible in both themes
- **WHEN** either theme is active
- **THEN** the wordmark keeps sufficient contrast against the top bar surface

### Requirement: Interface typography
The interface SHALL be rendered in a loaded webfont rather than the browser default: Inter for the dark theme and Manrope (the prescribed Gilroy substitute) for the light theme, plus a monospace face for technical metadata.

#### Scenario: Themed typeface is applied
- **WHEN** either theme is active
- **THEN** the interface text is rendered in that theme's typeface and is not left to the system default sans

#### Scenario: Monospace for technical metadata
- **WHEN** technical metadata such as a version string or an identifier is displayed
- **THEN** it is rendered in the monospace face

### Requirement: Navigation shell surface
The sidebar rail and the bottom tab bar SHALL use the theme's brand accent surface (Signal Blue in light, Coral Pulse in dark), distinct from the card surface, so the shell separates visually from the content, and the current-section indicator SHALL use a high-contrast fill on that surface so it remains distinguishable.

#### Scenario: Shell panels distinct from content
- **WHEN** either theme is active
- **THEN** the sidebar rail and the bottom tab bar render on the brand accent surface, distinct from the content cards

#### Scenario: Active item stays distinguishable
- **WHEN** a section is the current one
- **THEN** its navigation indicator is a high-contrast fill against the brand accent surface in both themes

### Requirement: Adaptive layout
Screens SHALL remain usable from a narrow mobile viewport up to a desktop viewport without clipping content; content wider than its viewport, such as a data table, SHALL scroll within its container instead of being cut off.

#### Scenario: Narrow viewport is usable
- **WHEN** a screen is viewed on a narrow mobile viewport
- **THEN** no content is clipped and controls remain reachable

#### Scenario: Wide content scrolls
- **WHEN** tabular content is wider than its container
- **THEN** the container scrolls horizontally rather than clipping columns

### Requirement: Dialog sizing
Dialogs SHALL stay within the viewport, and the catalog add dialog SHALL be wide enough to present its search field, filters, and result list together without being cramped.

#### Scenario: Add dialog fits its content
- **WHEN** the catalog add dialog is open
- **THEN** its search field, filters, and result list are presented together without being cramped

#### Scenario: Dialog fits the viewport
- **WHEN** any dialog is opened on a narrow viewport
- **THEN** it stays within the viewport and its content remains scrollable

### Requirement: Consistent control and surface geometry
Shared form controls and surfaces SHALL use one consistent geometry so screens do not drift from each other: filter controls that carry a label SHALL share a single label-and-control height rhythm and SHALL align in one row where space allows or stack one per row on narrow viewports; interactable controls SHALL use a consistent height and horizontal padding for a given size; and data tables SHALL render with fully rounded, non-clipped outer corners.

#### Scenario: Filter fields align
- **WHEN** a filter panel is displayed with more than one control
- **THEN** every control shares the same label-and-height rhythm and either aligns in a single row or stacks one per row on narrow viewports

#### Scenario: Control and button sizing consistent
- **WHEN** two controls or buttons of the same size are displayed
- **THEN** they share the same height and horizontal padding

#### Scenario: Data tables have rounded corners
- **WHEN** a data table is displayed
- **THEN** its outer corners are rounded and are not clipped or rendered square
