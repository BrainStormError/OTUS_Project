## MODIFIED Requirements

### Requirement: Responsive navigation shell
The shell SHALL present the same sections on desktop and mobile and SHALL require equivalent effort to navigate on both. The top bar SHALL NOT provide a global search field; search is provided per section (see the "Tab-local search" requirement).

#### Scenario: Desktop shell
- **WHEN** the application is viewed on a desktop viewport
- **THEN** a persistent sidebar rail lists the primary sections and a top bar provides the theme switch and the account menu, without a global search field

#### Scenario: Mobile shell
- **WHEN** the application is viewed on a mobile viewport
- **THEN** a bottom tab bar exposes the primary sections and a top bar provides the theme switch, with Settings reachable from the account menu or Profile, and without a global search field

## ADDED Requirements

### Requirement: Tab-local search
Search SHALL be provided on the Home, My Films, Friends, and Groups sections, each operating on that section's own content, and SHALL NOT be provided as a global field in the top bar.

#### Scenario: Search present on the searchable sections
- **WHEN** the user opens Home, My Films, Friends, or Groups
- **THEN** a search field is present on that section

#### Scenario: No global search field
- **WHEN** the user is on any screen
- **THEN** the top bar does not present a global search field
