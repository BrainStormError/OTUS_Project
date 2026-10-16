## MODIFIED Requirements

### Requirement: Shell links prefetch their destination

Navigation shell links SHALL prefetch their destination on user intent (pointer hover, keyboard focus, or touch) and during browser idle time, so an activation usually begins with the destination already being prepared. Prefetching MUST NOT delay rendering of the current screen, and an activation without a prior prefetch SHALL still navigate normally. Title-card links inside result grids SHALL NOT prefetch every card destination.

#### Scenario: Hover prefetches a shell link

- **WHEN** the user hovers or focuses a navigation shell link before activating it
- **THEN** the destination for that link is prefetched before activation

#### Scenario: Idle time warms the remaining shell links

- **WHEN** the browser becomes idle while the navigation shell is displayed
- **THEN** the remaining shell link destinations are prefetched in the background

#### Scenario: Activation without prefetch still navigates

- **WHEN** the user activates a shell link that was not prefetched (for example a fast tap on a touch device)
- **THEN** the destination opens through a normal navigation request

#### Scenario: Current screen renders immediately

- **WHEN** a screen with the navigation shell is displayed
- **THEN** prefetching does not block or delay the rendering of that screen

#### Scenario: Catalog cards are not prefetched

- **WHEN** a grid of title cards is displayed
- **THEN** displaying the grid does not prefetch every card's destination
