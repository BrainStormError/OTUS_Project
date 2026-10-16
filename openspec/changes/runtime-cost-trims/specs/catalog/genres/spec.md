## ADDED Requirements

### Requirement: Genre catalog responses are cacheable

Responses carrying the stored genre catalog MAY be cached at intermediate layers: the client MAY reuse a cached response for up to one hour, and the application process MAY serve the catalog from a short-lived in-process cache instead of reading the database on every request. Any cached copy SHALL reflect the stored catalog within one hour of a deploy-time genre sync, so a synchronized update becomes visible to all clients within that bound.

#### Scenario: Client reuses a cached response

- **WHEN** a client requests the genre catalog twice within the cache lifetime
- **THEN** the second response may be served from the client's cache without a new server round trip

#### Scenario: Sync becomes visible within the bound

- **WHEN** a deploy runs the genre sync and the stored catalog changes
- **THEN** clients observe the updated catalog within one hour of the sync

#### Scenario: In-process cache does not change results

- **WHEN** the application serves the genre catalog from its in-process cache
- **THEN** the response contains the same stored genres as a database read would return
