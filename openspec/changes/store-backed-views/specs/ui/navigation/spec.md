## MODIFIED Requirements

### Requirement: Route navigation reuses loaded state

Moving between sections SHALL reuse the state already loaded in the running client, so that a section the user has already visited renders without issuing a read request and without a new server render. Session data SHALL be loaded once per session and refreshed by completed mutations and by received invalidation signals rather than by re-reading on navigation. A section visited for the first time in the session SHALL load its data before it is shown.

#### Scenario: Returning to a recently visited section

- **WHEN** the user leaves a section and returns to it
- **THEN** the section is shown from already-loaded state without a read request and without a new server render

#### Scenario: Back and forward between sections

- **WHEN** the user moves back or forward in history between already visited sections
- **THEN** the target section is shown from already-loaded state without a read request

#### Scenario: First visit loads once

- **WHEN** the user opens a section for the first time in the session
- **THEN** its data is loaded once and later visits reuse it

#### Scenario: Mutations refresh the loaded state

- **WHEN** a mutation or an invalidation signal changes data a section shows
- **THEN** the loaded state is refreshed so the section presents the current data without a manual reload

## ADDED Requirements

### Requirement: Non-navigation links do not prefetch

Links outside the primary navigation shell - the product brand, the account menu, section back links, and the links rendered by cards, list rows, and feed items - SHALL NOT prefetch their destinations, so displaying or hovering over a list issues no destination reads. Activating such a link SHALL still navigate normally.

#### Scenario: Displaying a list issues no destination reads

- **WHEN** a list of friends, groups, watch-list rows, or title cards is displayed
- **THEN** no destination read is issued for the links it contains

#### Scenario: Hovering a chrome link issues no read

- **WHEN** the user hovers over or focuses the product brand or an account-menu link
- **THEN** no destination read is issued before activation

#### Scenario: Activation still navigates

- **WHEN** the user activates a link that did not prefetch
- **THEN** the destination opens through a normal navigation
