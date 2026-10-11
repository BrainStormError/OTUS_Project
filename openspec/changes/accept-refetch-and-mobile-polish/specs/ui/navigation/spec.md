## ADDED Requirements

### Requirement: Mobile tab-bar label alignment

In the mobile bottom tab bar, each section label SHALL be horizontally centered within its tab, including when the label wraps onto more than one line on a narrow viewport.

#### Scenario: Label wraps onto two lines

- **WHEN** a section label such as "Мои фильмы" or "Мои сериалы" wraps onto two lines on a narrow phone viewport
- **THEN** both lines of the label are horizontally centered within the tab

#### Scenario: Label fits on one line

- **WHEN** a section label fits on a single line
- **THEN** the label remains horizontally centered within its tab
