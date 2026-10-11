## ADDED Requirements

### Requirement: Feed retention

Activity events SHALL be retained for at most one day. An event older than one day SHALL NOT be shown in the feed and SHALL be removed so that the feed does not grow without bound.

#### Scenario: Recent event is shown

- **WHEN** an activity event was created within the last day
- **THEN** it appears in the feed

#### Scenario: Stale event is not shown

- **WHEN** the feed is loaded and an activity event is older than one day
- **THEN** that event is not shown

#### Scenario: Stale events are removed

- **WHEN** the feed is loaded
- **THEN** activity events older than one day are removed and do not accumulate indefinitely
