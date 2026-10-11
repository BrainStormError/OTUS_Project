## ADDED Requirements

### Requirement: Client identity is derived only from a trusted edge

The client identity used for throttling SHALL be derived only from headers that a trusted edge is known to overwrite, and only when the request arrives from that trusted edge. A client-supplied `X-Forwarded-For` or `X-Real-IP` SHALL NOT be trusted on its own, and a request that cannot be attributed to a trusted identity SHALL NOT be given a fresh limiter key on every request by supplying forwarding headers.

#### Scenario: Attacker forges the forwarding chain

- **WHEN** a request reaches the application through the trusted edge with an `X-Forwarded-For` value the client chose
- **THEN** the edge-derived address is used for throttling, not the client-chosen value

#### Scenario: Forged header does not reset the allowance

- **WHEN** a client that has exhausted its auth-endpoint allowance repeats the request with a different client-supplied client-IP header
- **THEN** the attempts still count against the same identity and further requests are refused

#### Scenario: Direct request bypassing the edge

- **WHEN** a request arrives from an address that is not a configured trusted edge and carries forwarding headers
- **THEN** the forwarded values are not trusted as client identity

### Requirement: Long-lived stream connections are bounded per identity

The activity event stream SHALL limit how many concurrent long-lived connections a single identity may hold, and SHALL apply the shared rate limiter to new connections, so that one client cannot grow listeners, timers, and sockets without bound. A connection beyond the allowance SHALL be refused instead of opened.

#### Scenario: Client opens many streams

- **WHEN** one identity holds the maximum allowed concurrent streams and requests another
- **THEN** the extra request is refused with a too-many-requests response and no new listener is registered

#### Scenario: Connection released on disconnect

- **WHEN** a stream connection ends
- **THEN** its slot is released so a later connection from the same identity is allowed
