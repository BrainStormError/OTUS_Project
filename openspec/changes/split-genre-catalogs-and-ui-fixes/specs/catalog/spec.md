## MODIFIED Requirements

### Requirement: Genre mapping by TMDB identifier

The system SHALL map TMDB genre identifiers to the project's genre reference data for the entry's media kind by TMDB identifier, and SHALL NOT match genres by localized name. An identifier that exists in the other kind's reference data but not in the entry's own kind MUST NOT be treated as known.

#### Scenario: Known genre maps by identifier

- **WHEN** TMDB reports a genre whose identifier exists in the media kind's genre reference data
- **THEN** the catalog entry stores the matching project genre

#### Scenario: Unknown genre identifier is dropped

- **WHEN** TMDB reports a genre identifier that is not present in the media kind's genre reference data
- **THEN** that genre is not stored and no new genre is created

#### Scenario: Other kind's genre identifier is dropped

- **WHEN** TMDB reports a genre identifier that exists only in the other kind's genre reference data
- **THEN** that genre is not stored on the entry
