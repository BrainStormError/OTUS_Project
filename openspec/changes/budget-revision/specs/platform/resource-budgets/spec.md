## MODIFIED Requirements

### Requirement: Bounded catalog cache storage

The TMDB response cache SHALL stay within a storage budget of 16 MB. When cached payloads exceed the budget, the oldest entries SHALL be evicted until usage is back within budget. While usage is within budget, entries SHALL NOT be evicted before their TTL expiry, and expired entries SHALL remain eligible for the regular expired-entry sweep.

#### Scenario: Over-budget cache evicts the oldest entries

- **WHEN** cache storage usage exceeds 16 MB
- **THEN** the oldest cached payloads are removed until usage is back within budget

#### Scenario: Under-budget cache keeps fresh entries

- **WHEN** cache storage usage is within budget
- **THEN** cached payloads are kept until their TTL expiry

#### Scenario: Expired entries are swept regardless of size

- **WHEN** a cached payload passes its TTL expiry
- **THEN** it is eligible for the regular expired-entry sweep even while the cache is under budget

### Requirement: Database memory fits the small-host budget

The database SHALL run with shared-buffer, per-query memory, and connection budgets sized for a 1 GB host so its resident memory fits the deployment budget alongside the application and the operating system.

#### Scenario: Database starts with small-host budgets

- **WHEN** the database service starts on the target host
- **THEN** it runs with shared buffers of 128 MB, per-query working memory of 4 MB, and a connection limit of 20
