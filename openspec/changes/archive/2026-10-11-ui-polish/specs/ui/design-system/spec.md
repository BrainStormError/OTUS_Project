## MODIFIED Requirements

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

## ADDED Requirements

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
