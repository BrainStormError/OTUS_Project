## ADDED Requirements

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
