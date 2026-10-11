## MODIFIED Requirements

### Requirement: Streaming fallback

When the real-time stream cannot be established or is lost, the client SHALL recover by re-fetching the feed so the viewer still sees current activity, and SHALL retry the stream using an increasing delay between attempts so that repeated failures do not produce a burst of connection attempts or exceed the server's allowance for concurrent connections.

#### Scenario: Stream unavailable

- **WHEN** the client cannot open the real-time stream
- **THEN** the feed is still populated from a data fetch and marks itself as up to date on the next successful refresh

#### Scenario: Stream drops

- **WHEN** an established stream disconnects
- **THEN** the client catches up on missed events and attempts to reconnect

#### Scenario: Repeated failures back off

- **WHEN** the stream cannot be established repeatedly
- **THEN** the delay between attempts grows and the number of attempts stays within the server's allowance

#### Scenario: Refusal does not cause an immediate retry

- **WHEN** the server refuses a connection because the allowance is exhausted
- **THEN** the client waits before retrying instead of reconnecting immediately

## ADDED Requirements

### Requirement: Stream connection persists across section navigation

The real-time stream SHALL be maintained across navigation between sections of the application, so that a viewer who is already connected does not open a new stream connection when moving between sections and returning to the feed.

#### Scenario: Returning to the feed reuses the connection

- **WHEN** the viewer moves to another section and returns to the feed while already connected
- **THEN** no new stream connection is opened for that visit

#### Scenario: Connection stays open across section changes

- **WHEN** the viewer navigates between sections
- **THEN** the established stream remains open until the viewer leaves the application
