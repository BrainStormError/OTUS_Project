## MODIFIED Requirements

### Requirement: Navigation depth limit
Every key screen SHALL be reachable from Home in at most three navigation transitions.

Key screens include film results, film card, the rating and comment form, a series card and the series rating form, a profile, another user's profile, statistics, friend requests, a group card, the group admin panel, and privacy settings.

#### Scenario: Key screen within depth budget
- **WHEN** a user navigates from Home to any key screen
- **THEN** the number of transitions is three or fewer

#### Scenario: Settings are near
- **WHEN** the user is on any primary section
- **THEN** Settings is reachable in at most two transitions
