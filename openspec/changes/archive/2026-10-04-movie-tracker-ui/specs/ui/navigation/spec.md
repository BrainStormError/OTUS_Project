## Purpose

Defines the section information architecture, the maximum navigation depth, and the responsive shell so that every key screen is reachable in at most three transitions on both desktop and mobile.

## ADDED Requirements

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
The shell SHALL present the same sections on desktop and mobile and SHALL require equivalent effort to navigate on both.

#### Scenario: Desktop shell
- **WHEN** the application is viewed on a desktop viewport
- **THEN** a persistent sidebar rail lists the primary sections and a top bar provides global search, the theme switch, and the account menu

#### Scenario: Mobile shell
- **WHEN** the application is viewed on a mobile viewport
- **THEN** a bottom tab bar exposes the primary sections and a top bar provides global search, with Settings reachable from the account menu or Profile

### Requirement: Current location indication
The shell SHALL visually indicate the section the user is currently in.

#### Scenario: Active section marked
- **WHEN** the user is viewing a section
- **THEN** that section's navigation entry is marked as current in both desktop and mobile shells
