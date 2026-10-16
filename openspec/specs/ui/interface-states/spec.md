# ui/interface-states Specification

## Purpose
Defines the loading, empty, error, and privacy-restricted interface states that every screen must be able to present consistently.

## Requirements

### Requirement: Loading state

Any screen or section that depends on asynchronous data SHALL present a loading state as a skeleton that matches the shape of the expected content. The skeleton SHALL replace only the part of the interface that is waiting, leaving the surrounding shell in place. When switching between the tabs of a section, the section's header and its tab list SHALL remain visible while the skeleton of the selected tab is shown until that tab's content arrives.

#### Scenario: Loading content

- **WHEN** a screen or section is waiting for data
- **THEN** a skeleton placeholder matching the expected content shape is shown

#### Scenario: Loading completes

- **WHEN** the data arrives
- **THEN** the skeleton is replaced by the content without a full-page reload

#### Scenario: Switching tabs shows the tab's skeleton

- **WHEN** a user switches to another tab of a section
- **THEN** the section's header and tab list stay visible and the selected tab shows its own skeleton until its content loads

#### Scenario: Surrounding shell is not replaced

- **WHEN** a section that is part of a larger screen is loading
- **THEN** only that section shows a skeleton and the rest of the screen remains rendered

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

### Requirement: Route navigation loading state

During a client-side navigation to another route, the application SHALL keep the surrounding shell of the destination screen rendered and SHALL show a content skeleton in the content area until that route's content arrives. The skeleton SHALL be exposed to assistive technology as a busy loading status.

#### Scenario: Skeleton shown during navigation

- **WHEN** a user activates a link to another route whose content is still being prepared
- **THEN** the surrounding shell remains visible and a content skeleton is shown in the content area

#### Scenario: Skeleton replaced by content

- **WHEN** the destination route's content arrives
- **THEN** the skeleton is replaced by the content without a full-page reload

#### Scenario: Loading is announced

- **WHEN** the content skeleton is shown during navigation
- **THEN** the loading region is exposed to assistive technology as a busy status

### Requirement: Progressive section rendering

A screen whose content depends on a slow or remote source SHALL render its shell before that content is ready, and SHALL stream each slow section into a skeleton placeholder in the content area when its data arrives. The shell MUST NOT be withheld while a slow section is still loading.

#### Scenario: Shell renders before a slow section

- **WHEN** a screen includes a section that waits on a slow or remote source
- **THEN** the screen shell is rendered immediately and that section shows a skeleton

#### Scenario: Section streams in

- **WHEN** a slow section's data arrives
- **THEN** the skeleton is replaced by the section content without a full-page reload

#### Scenario: Slow section fails

- **WHEN** a slow section's source fails or times out
- **THEN** only that section shows an error or empty state and the rest of the screen stays rendered
