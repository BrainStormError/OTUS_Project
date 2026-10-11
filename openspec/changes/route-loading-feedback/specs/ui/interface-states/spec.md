## ADDED Requirements

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
