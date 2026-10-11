## MODIFIED Requirements

### Requirement: Genre options are drawn from the catalog

Every screen that offers a genre filter SHALL draw its selectable genre options from the stored genre catalog rather than from the genres present in the current result set, and SHALL receive those options together with the initial render of the screen rather than through a separate client request after the screen appears.

#### Scenario: Full option list offered

- **WHEN** the user opens a genre filter
- **THEN** every genre in the stored catalog is offered as a selectable option

#### Scenario: Options are stable across results

- **WHEN** the result set changes after a search
- **THEN** the offered genre options remain the full stored catalog and do not shrink to the genres of the returned titles

#### Scenario: Options arrive with the screen

- **WHEN** a screen that offers a genre filter is first displayed
- **THEN** its genre options are already available from the initial render and no separate client request is made to obtain them
