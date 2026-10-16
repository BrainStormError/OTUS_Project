## ADDED Requirements

### Requirement: Sign-in screen layout

The sign-in screen SHALL center its form horizontally within the viewport on viewports of every width, including wide desktop viewports where a fixed-width content container is narrower than the viewport.

#### Scenario: Centered on a wide desktop viewport

- **WHEN** the sign-in screen is viewed on a desktop viewport wider than the content container
- **THEN** the sign-in form is horizontally centered within the viewport

#### Scenario: Centered on a phone viewport

- **WHEN** the sign-in screen is viewed on a narrow phone viewport
- **THEN** the sign-in form is horizontally centered and fully visible without horizontal scrolling
