## MODIFIED Requirements

### Requirement: Tab-local search
Search SHALL be provided on the Home, My Films, Friends, and Groups sections, each operating on that section's own content, and SHALL NOT be provided as a global field in the top bar. On Home and My Films, search SHALL be performed through the section's always-visible filter panel rather than a separate free-text search field; on Home it SHALL apply only when the user activates the "Найти" action, while on My Films it SHALL apply live as filter values change.

#### Scenario: Search present on the searchable sections
- **WHEN** the user opens Home, My Films, Friends, or Groups
- **THEN** a search control is present on that section

#### Scenario: Filter-panel search on Home and My Films
- **WHEN** the user opens Home or My Films
- **THEN** search is available through an always-expanded filter panel and no separate free-text search field is present

#### Scenario: Home applies search on submit
- **WHEN** the user changes filter values on Home
- **THEN** results update only after the user activates "Найти"

#### Scenario: My Films applies search live
- **WHEN** the user changes filter values in My Films
- **THEN** the list filters immediately without a submit action

#### Scenario: No global search field
- **WHEN** the user is on any screen
- **THEN** the top bar does not present a global search field
