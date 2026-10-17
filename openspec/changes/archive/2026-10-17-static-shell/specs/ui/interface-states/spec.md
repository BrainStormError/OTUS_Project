## MODIFIED Requirements

### Requirement: Consistent state coverage

Every screen listed in the interface SHALL define its empty (where applicable) and error states, and SHALL reuse the same shared state components across screens.

#### Scenario: Screen defines states

- **WHEN** a screen can be empty or in error
- **THEN** it renders the corresponding shared state component rather than a screen-specific variant

## REMOVED Requirements

### Requirement: Loading state

**Reason**: Placeholder art that mirrors the shape of the expected content is no longer produced. The area reserved for content stays empty until data arrives, which removes per-screen placeholder design work and the components that carried it.

**Migration**: Screens keep their shell and their reserved content area; they render content into that area when it arrives and show no placeholder while waiting. For tabbed sections the header and tab list stay visible and the selected tab's area stays empty.

### Requirement: Route navigation loading state

**Reason**: The content skeleton shown during client-side navigation is removed together with the placeholder components. Its assistive-technology busy announcement is dropped along with it.

**Migration**: During navigation the surrounding shell of the destination screen stays rendered and its content area stays empty until the route's content arrives. If an assistive-technology busy indication is needed later, it can be attached to the reserved area as a single attribute without reintroducing placeholder art.

### Requirement: Progressive section rendering

**Reason**: Slow sections no longer stream into skeleton placeholders; they render into their reserved area when ready.

**Migration**: A screen with a slow or remote section still renders its shell immediately and does not withhold it while the section loads. The section renders into its reserved area when its data arrives, and a failing section still shows only its own error or empty state.

## ADDED Requirements

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
