## ADDED Requirements

### Requirement: Query planner statistics are kept current

The database SHALL retain current query-planner statistics for every table the application reads, so plans are chosen from real cardinality estimates rather than defaults. The deployment pipeline SHALL refresh statistics as part of releasing a build, after schema migrations have applied.

#### Scenario: Deployment refreshes statistics

- **WHEN** a build is released and its migrations have been applied
- **THEN** the database statistics for application tables are refreshed before the application starts serving traffic

#### Scenario: Cardinality estimates reflect real row counts

- **WHEN** a query is planned against an application table that holds rows
- **THEN** the planner estimates are based on analysed statistics rather than an empty default estimate
