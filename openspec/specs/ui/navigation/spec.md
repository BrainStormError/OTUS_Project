# ui/navigation Specification

## Purpose
Defines the section information architecture, the maximum navigation depth, and the responsive shell so that every key screen is reachable in at most three transitions on both desktop and mobile.

## Requirements

### Requirement: Primary sections
The application SHALL expose six primary sections: Home/Search, My Films, Profile, Friends, Groups, and Settings.

#### Scenario: Sections reachable from the shell
- **WHEN** the user is on any screen
- **THEN** all six primary sections are reachable from the navigation shell

### Requirement: Navigation depth limit
Every key screen SHALL be reachable from Home in at most three navigation transitions.

Key screens include film results, film card, the rating and comment form, a profile, another user's profile, statistics, friend requests, a group card, the group admin panel, and privacy settings.

#### Scenario: Key screen within depth budget
- **WHEN** a user navigates from Home to any key screen
- **THEN** the number of transitions is three or fewer

#### Scenario: Settings are near
- **WHEN** the user is on any primary section
- **THEN** Settings is reachable in at most two transitions

### Requirement: Responsive navigation shell
The shell SHALL present the same sections on desktop and mobile and SHALL require equivalent effort to navigate on both. The top bar SHALL NOT provide a global search field; search is provided per section (see the "Tab-local search" requirement).

#### Scenario: Desktop shell
- **WHEN** the application is viewed on a desktop viewport
- **THEN** a persistent sidebar rail lists the primary sections and a top bar provides the theme switch and the account menu, without a global search field

#### Scenario: Mobile shell
- **WHEN** the application is viewed on a mobile viewport
- **THEN** a bottom tab bar exposes the primary sections and a top bar provides the theme switch, with Settings reachable from the account menu or Profile, and without a global search field

### Requirement: Current location indication
The shell SHALL visually indicate the section the user is currently in.

#### Scenario: Active section marked
- **WHEN** the user is viewing a section
- **THEN** that section's navigation entry is marked as current in both desktop and mobile shells

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
