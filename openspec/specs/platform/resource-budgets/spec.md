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
- **THEN** it runs with shared buffers of 128 MB, per-query working memory of 4 MB, and a connection limit of 20

### Requirement: Cache maintenance stays outside the request path

Background maintenance of the TMDB response cache — expired-entry cleanup and over-budget eviction — SHALL NOT execute inline with request rendering. The application SHALL schedule this work separately so that serving a request does not compete with cache maintenance for processor time.

#### Scenario: Serving a request does not trigger cache maintenance

- **WHEN** a request reads through the TMDB response cache and the read fills or misses the cache
- **THEN** no expired-entry sweep or over-budget eviction runs as part of serving that request

#### Scenario: Maintenance still runs on its own schedule

- **WHEN** cached entries pass their TTL expiry or storage usage exceeds the budget
- **THEN** the maintenance pass removes them on its own cadence, independent of request volume

### Requirement: Eviction cost is bounded by the target, not by cache size

Over-budget eviction SHALL perform work proportional to the number of bytes it must reclaim, not to the total size of the cached table. Eviction SHALL stop as soon as the reclaim target is reached, and SHALL continue to remove the oldest entries first.

#### Scenario: Small reclaim targets do not scan the whole cache

- **WHEN** storage usage exceeds the budget by a small amount
- **THEN** eviction inspects only enough entries to reclaim that excess and does not read the remaining cached rows

#### Scenario: Oldest entries are still evicted first

- **WHEN** eviction reclaims space under the budget
- **THEN** entries are removed in order of least recent update, and entries updated more recently are kept

### Requirement: Cache freshness checks do not transfer cached payloads

Determining whether a cached entry is still fresh SHALL require reading only its expiry timestamp. The stored payload SHALL be read only when the entry is fresh and is being served.

#### Scenario: A stale entry costs no payload transfer

- **WHEN** a cache lookup finds an entry whose expiry has passed
- **THEN** the lookup does not transfer the stored payload and proceeds to fetch a replacement

#### Scenario: A fresh entry serves its payload

- **WHEN** a cache lookup finds an entry whose expiry is in the future
- **THEN** the stored payload is read and served without contacting TMDB
