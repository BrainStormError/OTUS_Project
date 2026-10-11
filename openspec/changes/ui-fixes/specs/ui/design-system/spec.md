## ADDED Requirements

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
