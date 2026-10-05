## ADDED Requirements

### Requirement: Brand placement in the shell
The shell SHALL present the product brand as a single control that links to Home, centered in the top bar on both desktop and mobile, and SHALL NOT present the brand in the sidebar rail. The brand control SHALL have an accessible name.

#### Scenario: Brand centered in the top bar
- **WHEN** the application is viewed on a desktop or mobile viewport
- **THEN** the product brand is shown centered in the top bar

#### Scenario: Brand links to Home
- **WHEN** the user activates the brand control from any screen
- **THEN** the application navigates to Home

#### Scenario: Brand absent from the sidebar rail
- **WHEN** the sidebar rail is displayed, expanded or collapsed
- **THEN** the rail does not present the product brand
