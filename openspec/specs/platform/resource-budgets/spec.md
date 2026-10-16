# platform/resource-budgets Specification

## Purpose
Governs the runtime resource budgets the deployed system must respect on a small (1 GB RAM) host so the application, database, cache, and logs stay within fixed limits instead of degrading into swap thrash.

## Requirements

### Requirement: Bounded application heap

The application process SHALL run with a fixed upper bound on its heap memory, enforced by deployment configuration at container startup, and that bound SHALL NOT exceed 320 MB. Under allocation pressure the runtime SHALL reclaim memory within the process and keep serving instead of growing past the bound.

#### Scenario: Heap bound is enforced at startup

- **WHEN** the application container starts
- **THEN** the process runs with a heap limit fixed by deployment configuration that does not exceed 320 MB

#### Scenario: Allocation pressure is absorbed inside the process

- **WHEN** allocation approaches the heap bound while the application serves traffic
- **THEN** the runtime reclaims memory and continues serving instead of growing past the bound

### Requirement: Bounded catalog cache storage

The TMDB response cache SHALL stay within a storage budget of 100 MB. When cached payloads exceed the budget, the oldest entries SHALL be evicted until usage is back within budget. While usage is within budget, entries SHALL NOT be evicted before their TTL expiry, and expired entries SHALL remain eligible for the regular expired-entry sweep.

#### Scenario: Over-budget cache evicts the oldest entries

- **WHEN** cache storage usage exceeds 100 MB
- **THEN** the oldest cached payloads are removed until usage is back within budget

#### Scenario: Under-budget cache keeps fresh entries

- **WHEN** cache storage usage is within budget
- **THEN** cached payloads are kept until their TTL expiry

#### Scenario: Expired entries are swept regardless of size

- **WHEN** a cached payload passes its TTL expiry
- **THEN** it is eligible for the regular expired-entry sweep even while the cache is under budget

### Requirement: Bounded container log storage

Container log storage SHALL be capped by log rotation so each service's logs take at most 5 MB on disk. Application logging SHALL keep emitting structured entries to standard output; the rotation cap SHALL NOT change the application logging contract.

#### Scenario: Log rotation caps storage

- **WHEN** a service writes log output beyond the per-service cap
- **THEN** rotated log files are discarded oldest-first so total log storage for that service stays within 5 MB

#### Scenario: Application logs still reach the log driver

- **WHEN** the application records an event
- **THEN** the structured entry is written to standard output and captured by the container log driver as before

### Requirement: Database memory fits the small-host budget

The database SHALL run with shared-buffer, per-query memory, and connection budgets sized for a 1 GB host so its resident memory fits the deployment budget alongside the application and the operating system.

#### Scenario: Database starts with small-host budgets

- **WHEN** the database service starts on the target host
- **THEN** it runs with shared buffers of 64 MB, per-query working memory of 4 MB, and a connection limit of 20
