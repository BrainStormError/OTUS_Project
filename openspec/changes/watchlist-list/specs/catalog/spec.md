## ADDED Requirements

### Requirement: Catalog stores only rated or planned titles

A title SHALL enter the local catalog only when a user rates it, whether as a personal rating or within a group, or adds it to their watch-later list. The catalog SHALL store, for each title: its media kind, its external TMDB identifier, title, year, director (creators for series), and genres. Searching or opening a title without rating it and without adding it to the watch-later list SHALL NOT create a catalog entry. The same kind and external identifier SHALL map to a single catalog entry.

#### Scenario: Rating creates a catalog entry
- **WHEN** the user rates a title returned by search
- **THEN** a single catalog entry for that title is stored with title, year, director, and genres

#### Scenario: Adding to the watch-later list creates a catalog entry
- **WHEN** the user adds a title returned by search to their watch-later list without rating it
- **THEN** a single catalog entry for that title is stored with title, year, director, and genres

#### Scenario: Browsing without rating stores nothing
- **WHEN** users search and open titles without rating any of them or adding any to a watch-later list
- **THEN** the local catalog remains empty

#### Scenario: Deduplication by kind and identifier
- **WHEN** more than one user rates the same title, or the same user rates it again or adds it to the watch-later list
- **THEN** the catalog still holds a single entry for that title

## REMOVED Requirements

### Requirement: Catalog stores only rated titles

**Reason**: A title now enters the local catalog when it is rated or added to the user's watch-later list, so the "only rated" rule no longer reflects the system. It is replaced by the requirement "Catalog stores only rated or planned titles".

**Migration**: Add watch-later titles to the catalog through the existing TMDB metadata enrichment when a watch-later entry is created, exactly as rating does. No existing catalog data changes, and no stored title needs to be re-rated or re-added.
