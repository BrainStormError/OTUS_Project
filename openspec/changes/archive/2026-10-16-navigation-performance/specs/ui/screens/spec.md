## MODIFIED Requirements

### Requirement: Film card

A title card SHALL present a poster, title, year, external rating, and genres obtained from TMDB, and an action to mark the title as watched, and SHALL provide a fallback when no poster is available. A card SHALL represent either a film or a series according to the kind that produced it. Activating the watched action SHALL open the rating and comment form for that title. When a title is watched, the card SHALL show a small check indicator in a corner that reveals the label "Просмотрено" on hover. The poster image SHALL be loaded lazily and asynchronously, with the poster's space reserved in the layout so that the card does not load images before they are needed and does not shift when an image arrives.

#### Scenario: Card content

- **WHEN** a title card is displayed
- **THEN** it shows poster, title, year, external rating, genres, and a "watched" action

#### Scenario: Missing poster

- **WHEN** a title has no poster image
- **THEN** the card shows a neutral placeholder instead of a broken image

#### Scenario: Watched action opens the rating form

- **WHEN** the user activates the watched action on a card
- **THEN** the rating and comment form opens for that title

#### Scenario: Watched indicator

- **WHEN** a card represents a title the user has watched
- **THEN** a small check indicator is shown in a corner of the card and reveals "Просмотрено" on hover

#### Scenario: Poster loads lazily

- **WHEN** a card is displayed outside the viewport
- **THEN** its poster image is not loaded until it is needed

#### Scenario: Poster space is reserved

- **WHEN** a poster image has not finished loading
- **THEN** the card reserves the poster's space and does not shift when the image appears
