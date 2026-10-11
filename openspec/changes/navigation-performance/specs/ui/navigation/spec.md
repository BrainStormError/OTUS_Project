## ADDED Requirements

### Requirement: Route navigation reuses loaded state

Moving between sections SHALL reuse the state already loaded for a previously visited route within a short freshness window, so that returning to a section or moving back and forward does not require a new full server render.

#### Scenario: Returning to a recently visited section

- **WHEN** the user leaves a section and returns to it within the freshness window
- **THEN** the section is shown from already-loaded state without a new full server render

#### Scenario: Back and forward between sections

- **WHEN** the user moves back or forward in history between recently visited sections
- **THEN** the target section is shown from already-loaded state

### Requirement: Shell links prefetch their destination

Navigation shell links SHALL prefetch their destination so an activation begins with the destination already being prepared, and title-card links inside result grids SHALL NOT prefetch every card destination.

#### Scenario: Shell link prefetches

- **WHEN** a navigation shell link is displayed and can be activated
- **THEN** the destination for that link is prefetched before activation

#### Scenario: Catalog cards are not prefetched

- **WHEN** a grid of title cards is displayed
- **THEN** displaying the grid does not prefetch every card's destination
