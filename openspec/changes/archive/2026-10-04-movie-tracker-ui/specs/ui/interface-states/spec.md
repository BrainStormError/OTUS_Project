## Purpose

Defines the loading, empty, error, and privacy-restricted interface states that every screen must be able to present consistently.

## ADDED Requirements

### Requirement: Loading state
Any screen or section that depends on asynchronous data SHALL present a loading state as a skeleton that matches the shape of the expected content.

#### Scenario: Loading content
- **WHEN** a screen or section is waiting for data
- **THEN** a skeleton placeholder matching the expected content shape is shown

#### Scenario: Loading completes
- **WHEN** the data arrives
- **THEN** the skeleton is replaced by the content without a full-page reload

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
Every screen listed in the interface SHALL define its loading, empty (where applicable), and error states, and SHALL reuse the same shared state components across screens.

#### Scenario: Screen defines states
- **WHEN** a screen can be loading, empty, or in error
- **THEN** it renders the corresponding shared state component rather than a screen-specific variant
