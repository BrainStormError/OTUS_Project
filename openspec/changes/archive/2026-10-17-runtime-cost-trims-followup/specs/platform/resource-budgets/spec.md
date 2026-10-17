## ADDED Requirements

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
