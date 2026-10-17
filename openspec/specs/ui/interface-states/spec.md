# ui/interface-states Specification

## Purpose
Defines the loading, empty, error, and privacy-restricted interface states that every screen must be able to present consistently.

## Requirements

### Requirement: Empty state
Any list or collection that has no items SHALL present an empty state with a short explanation and, where the user can act, a call to action.

#### Scenario: Empty collection
- **WHEN** a list has no items to show
- **THEN** an empty state with an explanation is shown

#### Scenario: Actionable empty state
- **WHEN** the empty state has a natural next action, such as finding films or joining a group
- **THEN** the empty state offers a call to action to that action

### Requirement: Error state
Any failed data operation SHALL present an error state with a short message and a retry action.

#### Scenario: Failed operation
- **WHEN** a data operation fails
- **THEN** an error state is shown with a message and a retry control

#### Scenario: Retrying
- **WHEN** the user activates retry
- **THEN** the operation is attempted again and the state reflects the new result

### Requirement: Privacy-restricted states
The application SHALL present distinct restricted states for a hidden profile, hidden statistics, and a screen the viewer is not permitted to access.

#### Scenario: Hidden profile
- **WHEN** a viewer opens a profile whose owner restricted visibility and the viewer is not permitted
- **THEN** the profile shows a restricted state with the relationship action available

#### Scenario: Hidden statistics
- **WHEN** a viewer views statistics the owner hid and the viewer is not permitted
- **THEN** the statistics area shows a restricted state instead of values

#### Scenario: No permission
- **WHEN** a viewer opens a screen they are not permitted to access, such as a group admin panel without the admin role
- **THEN** the screen shows a no-permission state instead of the restricted controls

### Requirement: Consistent state coverage

Every screen listed in the interface SHALL define its empty (where applicable) and error states, and SHALL reuse the same shared state components across screens.

#### Scenario: Screen defines states

- **WHEN** a screen can be empty or in error
- **THEN** it renders the corresponding shared state component rather than a screen-specific variant

### Requirement: Reserved content area while loading

A screen or section that depends on asynchronous data SHALL reserve the area its content will occupy and SHALL leave that area empty while the data is pending. The surrounding shell SHALL remain rendered and surrounding content SHALL NOT shift when the content arrives.

#### Scenario: Area stays empty while pending

- **WHEN** a screen or section is waiting for data
- **THEN** its reserved area is empty and no placeholder is shown

#### Scenario: Content renders without layout shift

- **WHEN** the data arrives
- **THEN** the content renders in the reserved area and surrounding content does not move

#### Scenario: Surrounding shell is not replaced

- **WHEN** a section that is part of a larger screen is waiting
- **THEN** the rest of the screen remains rendered and only that section's area is empty

#### Scenario: Switching tabs keeps the section chrome

- **WHEN** a user switches to another tab of a section
- **THEN** the section's header and tab list stay visible and the selected tab's area stays empty until its content loads

### Requirement: Route navigation content area

During a client-side navigation to another route, the application SHALL keep the surrounding shell of the destination screen rendered and SHALL leave the destination's content area empty until that route's content arrives.

#### Scenario: Content area stays empty during navigation

- **WHEN** a user activates a link to another route whose content is still being prepared
- **THEN** the surrounding shell remains visible and the content area is empty

#### Scenario: Content replaces the empty area

- **WHEN** the destination route's content arrives
- **THEN** it renders in the content area without a full-page reload

### Requirement: Progressive section rendering without placeholders

A screen whose content depends on a slow or remote source SHALL render its shell before that content is ready and SHALL render each slow section into its reserved area when its data arrives. The shell MUST NOT be withheld while a slow section is still loading.

#### Scenario: Shell renders before a slow section

- **WHEN** a screen includes a section that waits on a slow or remote source
- **THEN** the screen shell is rendered immediately and that section's area is empty

#### Scenario: Section renders when ready

- **WHEN** a slow section's data arrives
- **THEN** the section content renders in its reserved area without a full-page reload

#### Scenario: Slow section fails

- **WHEN** a slow section's source fails or times out
- **THEN** only that section shows an error or empty state and the rest of the screen stays rendered
