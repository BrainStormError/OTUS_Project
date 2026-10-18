## MODIFIED Requirements

### Requirement: Bounded catalog cache storage

The catalogue cache SHALL stay within a storage budget of 16 MB. The budget covers every cached row, both the search-result indexes and the individual title records, and the occupied size of a row SHALL be measured as its key together with its stored value. When cached rows exceed the budget, the oldest entries SHALL be evicted until usage is back within budget. While usage is within budget, entries SHALL NOT be evicted before their TTL expiry, and expired entries SHALL remain eligible for the regular expired-entry sweep.

#### Scenario: Over-budget cache evicts the oldest entries

- **WHEN** cache storage usage exceeds 16 MB
- **THEN** the oldest cached rows are removed until usage is back within budget

#### Scenario: Under-budget cache keeps fresh entries

- **WHEN** cache storage usage is within budget
- **THEN** cached rows are kept until their TTL expiry

#### Scenario: Expired entries are swept regardless of size

- **WHEN** a cached row passes its TTL expiry
- **THEN** it is eligible for the regular expired-entry sweep even while the cache is under budget

#### Scenario: Row size includes its key

- **WHEN** cache usage is measured or entries are evicted
- **THEN** a row counts the size of its key together with the size of its stored value
