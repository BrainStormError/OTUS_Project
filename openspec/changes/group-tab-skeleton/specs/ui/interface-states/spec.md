## MODIFIED Requirements

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
