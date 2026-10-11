## MODIFIED Requirements

### Requirement: Adaptive layout
Screens SHALL remain usable from a narrow mobile viewport up to a desktop viewport without clipping content; content wider than its viewport, such as a data table, SHALL scroll within its container instead of being cut off, and a control that does not fit the available width SHALL wrap or stack instead of overflowing its container. The layout SHALL remain usable at the 320, 375, 768, 1024, and 1440 pixel widths.

#### Scenario: Narrow viewport is usable
- **WHEN** a screen is viewed on a narrow mobile viewport
- **THEN** no content is clipped and controls remain reachable

#### Scenario: Wide content scrolls
- **WHEN** tabular content is wider than its container
- **THEN** the container scrolls horizontally rather than clipping columns

#### Scenario: Narrowest phone width
- **WHEN** a screen is viewed at a 320 pixel width
- **THEN** no horizontal overflow occurs, controls that cannot share a row stack instead, and every control remains reachable

#### Scenario: Tablet and desktop widths
- **WHEN** a screen is viewed at the 768, 1024, and 1440 pixel widths
- **THEN** content is not clipped and tables either fit or scroll within their container

#### Scenario: Year range does not overflow
- **WHEN** the filter panel with the from–to year range is shown at a narrow width
- **THEN** the year bounds stay within the panel, wrapping or stacking rather than overflowing it

### Requirement: Consistent control and surface geometry
Shared form controls and surfaces SHALL use one consistent geometry so screens do not drift from each other: filter controls that carry a label SHALL share a single label-and-control height rhythm and SHALL align in one row where space allows or stack one per row on narrow viewports; a multi-control filter such as a year range SHALL sit on its own row beneath the single-field filters and keep all of its controls inside the panel, wrapping or stacking rather than overflowing when the row does not fit; interactable controls SHALL use a consistent height and horizontal padding for a given size; and data tables SHALL render with fully rounded, non-clipped outer corners.

#### Scenario: Filter fields align
- **WHEN** a filter panel is displayed with more than one control
- **THEN** every control shares the same label-and-height rhythm and either aligns in a single row or stacks one per row on narrow viewports

#### Scenario: Year range fits its panel
- **WHEN** a year range control is displayed at a width too narrow for both bounds and the separator in one line
- **THEN** its bounds wrap or stack within the panel and none of them overflows the panel

#### Scenario: Year range on its own row
- **WHEN** the filter panel is displayed
- **THEN** the year range sits on its own row beneath the single-field filters and keeps all of its controls inside the panel

#### Scenario: Control and button sizing consistent
- **WHEN** two controls or buttons of the same size are displayed
- **THEN** they share the same height and horizontal padding

#### Scenario: Data tables have rounded corners
- **WHEN** a data table is displayed
- **THEN** its outer corners are rounded and are not clipped or rendered square
