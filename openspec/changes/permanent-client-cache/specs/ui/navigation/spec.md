## MODIFIED Requirements

### Requirement: Route navigation reuses loaded state

Moving between sections SHALL reuse the navigation state already loaded for a previously visited route instead of requesting it again. Within a session the reused state SHALL stay valid for the whole session, and after a page reload a repeated navigation SHALL be satisfiable from the browser cache. Reused state from an earlier build MUST NOT be used after a deployment (see "A deployment clears the browser HTTP cache" in platform/http-contract).

#### Scenario: Returning to a recently visited section

- **WHEN** the user leaves a section and returns to it
- **THEN** the section is shown from already-loaded state without a request to the server

#### Scenario: Back and forward between sections

- **WHEN** the user moves back or forward in history between visited sections
- **THEN** the target section is shown from already-loaded state without a request to the server

#### Scenario: Repeated navigation after a reload

- **WHEN** the user reloads the application and repeats a navigation that was made before the reload
- **THEN** the navigation is satisfied from the browser cache without contacting the server

#### Scenario: State from an earlier build is never reused

- **WHEN** a new deployment is in place and the user opens the application
- **THEN** navigation state cached from an earlier build is not used

## REMOVED Requirements

### Requirement: Shell links do not prefetch

**Reason**: With prefetching fully disabled every section activation is a lazy navigation request, and the response the router receives for a statically built page never yields a reusable cache entry, so every tab change reaches the server forever. The original cost this requirement removed (an idle warm-up plus hover, focus, and activation prefetches per visit) came from custom warm-up code, not from the framework's single viewport prefetch.

**Migration**: Shell links use the framework's default prefetching again. Non-shell links (title cards, list rows, menu entries) keep prefetching disabled. No destination or link target changes.

## ADDED Requirements

### Requirement: Shell links prefetch their destination

Navigation shell links SHALL prefetch their destination in the background while the shell is visible, at most once per freshness window, so that activating a prefetched link issues no additional request. Pointer hover and keyboard focus MUST NOT cause additional prefetches of a destination that is already fresh. Non-shell links — title cards inside result grids, list rows, and menu entries — SHALL NOT prefetch their destinations.

#### Scenario: Visible shell links prefetch in the background

- **WHEN** the navigation shell is displayed
- **THEN** each shell link's destination is requested in the background at most once per freshness window

#### Scenario: Activating a prefetched link issues no request

- **WHEN** the user activates a shell link whose destination was prefetched and is still fresh
- **THEN** the destination is shown without a request to the server

#### Scenario: Hover and focus issue no additional request

- **WHEN** the user hovers over or focuses a shell link whose destination is already fresh
- **THEN** no additional request for that destination is issued

#### Scenario: Catalog cards are not prefetched

- **WHEN** a grid of title cards is displayed
- **THEN** displaying the grid does not prefetch every card's destination
