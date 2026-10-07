## ADDED Requirements

### Requirement: Brand wordmark prominence
The product wordmark ("Смотровик") in the top bar SHALL be rendered at a prominent heading size that is visibly larger than the surrounding body and control text, in both themes and on both desktop and mobile shells.

#### Scenario: Wordmark larger than surrounding text
- **WHEN** the top bar is rendered on desktop or mobile
- **THEN** the wordmark's font size is larger than the body and control text around it

#### Scenario: Wordmark remains legible in both themes
- **WHEN** either theme is active
- **THEN** the wordmark keeps sufficient contrast against the top bar surface
