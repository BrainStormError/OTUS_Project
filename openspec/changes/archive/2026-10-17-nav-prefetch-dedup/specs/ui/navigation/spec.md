## REMOVED Requirements

### Requirement: Shell links prefetch their destination

**Reason**: The requirement caused redundant server rendering on every section visit: an idle warm-up prefetched all seven shell destinations on each full load, hover and focus prefetched the same link again, and the activation added its own request. On a single-vCPU host this is the dominant per-navigation cost.

**Migration**: Activation issues the only request for a section navigation. No client or API change is required; destinations and link targets are unchanged.

## ADDED Requirements

### Requirement: Shell links do not prefetch

Navigation shell links SHALL NOT prefetch their destinations — neither on pointer hover, keyboard focus, touch, nor during browser idle time — and activating a shell link SHALL be the only request a section navigation makes. Title-card links inside result grids SHALL NOT prefetch every card destination.

#### Scenario: Hover and focus issue no request

- **WHEN** the user hovers over or focuses a navigation shell link without activating it
- **THEN** no request for that link's destination is issued

#### Scenario: Idle time issues no request

- **WHEN** the browser is idle while the navigation shell is displayed
- **THEN** no shell link destination is requested in the background

#### Scenario: Activation issues a single request

- **WHEN** the user activates a navigation shell link
- **THEN** the destination is loaded by one navigation request and no prefetch request precedes it

#### Scenario: Catalog cards are not prefetched

- **WHEN** a grid of title cards is displayed
- **THEN** displaying the grid does not prefetch every card's destination
