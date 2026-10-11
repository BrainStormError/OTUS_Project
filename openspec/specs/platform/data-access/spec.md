# platform/data-access Specification

## Purpose
Ensures all persistence flows through isolated, parameterized access with transactional integrity and a schema that changes only through versioned migrations.

## Requirements

### Requirement: Single shared connection pool

The application process SHALL use one shared database connection pool. Application code MUST NOT open ad-hoc database connections.

#### Scenario: Queries reuse the shared pool

- **WHEN** any data-access function executes a query without an explicit transaction
- **THEN** it uses the shared pool and no additional pool is created

### Requirement: Service-owned transactions

Multi-step writes SHALL execute inside a transaction opened by the calling service. Data-access functions SHALL accept an existing transaction handle and MUST NOT open their own transaction.

#### Scenario: Atomic success

- **WHEN** a multi-step write completes without error
- **THEN** all its statements are committed together

#### Scenario: Failure rolls back

- **WHEN** any step of a multi-step write fails
- **THEN** every statement in that transaction is rolled back and no partial data remains

### Requirement: Parameterized SQL only

All SQL executed against the database SHALL bind values as parameters. User-provided values MUST NOT be concatenated into SQL text.

#### Scenario: User input reaches a query

- **WHEN** a query includes a value originating from user input
- **THEN** the value is passed as a bound parameter and never interpolated into the SQL string

### Requirement: Schema changes through migrations only

The database schema SHALL change only through versioned, reversible migrations. No runtime code path may alter the schema, and an already-applied migration MUST NOT be edited.

#### Scenario: Application starts

- **WHEN** the application starts against an initialized database
- **THEN** it does not mutate the schema and relies on prior migrations for its structure

#### Scenario: Schema change is required

- **WHEN** a schema change is needed
- **THEN** it is added as a new migration with a corresponding reverse step

### Requirement: Bounded list queries

List operations SHALL accept a limit and a cursor and SHALL return a next cursor. A maximum limit SHALL be enforced so callers cannot request unbounded result sets.

#### Scenario: Limit exceeds maximum

- **WHEN** a caller requests a limit greater than the allowed maximum
- **THEN** the request is rejected or clamped to the maximum and never returns an unbounded result set

#### Scenario: Pagination continues

- **WHEN** more rows exist than the current page size
- **THEN** the result includes a next cursor that retrieves the following page
