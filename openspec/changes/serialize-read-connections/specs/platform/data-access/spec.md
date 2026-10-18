## ADDED Requirements

### Requirement: Sequential connection use within a request

A multi-step read SHALL acquire at most one pooled connection at a time. When a request performs several independent reads, it MUST execute them in sequence rather than concurrently, so that a single request never occupies more than one connection of the shared pool simultaneously.

#### Scenario: Multi-step read holds one connection

- **WHEN** a request reads several independent lists (for example friends, incoming requests, and outgoing requests)
- **THEN** it acquires and releases the pooled connection for each read in turn, never holding more than one connection at the same time

#### Scenario: A burst of reads does not exhaust the pool

- **WHEN** several read requests are served while each performs multiple queries
- **THEN** the number of concurrently held pooled connections does not grow with the number of steps inside a single request

### Requirement: Connections are reused instead of re-established

The shared connection pool SHALL keep its database connections established for the lifetime of the process and reuse them across requests. Serving a request MUST NOT depend on establishing a new database connection while the pool is within its configured size, and the pool's connections SHALL be established before the first request is served.

#### Scenario: Request served after an idle period

- **WHEN** no request has been served for a while and a new request needs the database
- **THEN** it is served by an already-established connection and no new database connection is opened

#### Scenario: A finished request returns its connection to the pool

- **WHEN** a request completes after taking a pooled connection
- **THEN** that connection is returned to the pool and stays established for later requests

#### Scenario: Application serves its first request

- **WHEN** the application has started and the first request arrives
- **THEN** the pool's connections are already established and the request does not wait for a connection to be opened

### Requirement: Bounded wait for a pooled connection

When no pooled connection is available, a request SHALL wait for one for a bounded period of at most 10 seconds and, if none becomes available within that period, SHALL fail with an error rather than waiting indefinitely.

#### Scenario: Pool is busy

- **WHEN** every pooled connection is checked out and a new request needs one
- **THEN** the request waits no longer than 10 seconds and, if no connection frees up, fails with an error

#### Scenario: Connection frees within the bound

- **WHEN** a pooled connection becomes available within the bounded wait
- **THEN** the request acquires it and proceeds instead of failing
