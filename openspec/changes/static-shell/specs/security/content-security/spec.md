## Purpose

Defines how the browser is permitted to execute the application's scripts, so that a statically served document can be locked down without issuing a fresh secret per request.

## ADDED Requirements

### Requirement: Inline scripts are authorized by content hash

The content security policy SHALL authorize inline scripts by a digest of their content rather than by a per-request secret. The policy SHALL allow only scripts the application itself serves, and SHALL refuse script sources that are neither self-hosted nor matched by a recorded digest.

#### Scenario: A known inline script runs

- **WHEN** the document is served with an inline script whose content matches a digest recorded in the policy
- **THEN** the browser executes that script and no secret is issued for the request

#### Scenario: An altered inline script is refused

- **WHEN** a script's content differs from every digest recorded in the policy
- **THEN** the browser refuses to execute it

#### Scenario: No per-request secret is issued

- **WHEN** any page is served
- **THEN** the response does not carry a per-request script secret, and the same document bytes are served to every viewer

### Requirement: The policy restricts every source category

The policy SHALL restrict each source category explicitly: documents and subresources load only from the application origin, embedded frames are refused, plugin content is refused, and form submission is limited to the application origin. Where the application loads images from an external media host, that host SHALL be the only external image source named.

#### Scenario: Frames and plugins are refused

- **WHEN** a document attempts to embed the application in a frame or to load plugin content
- **THEN** the policy refuses it

#### Scenario: Only the known media host supplies external images

- **WHEN** a document references an image hosted outside the application origin
- **THEN** the request is allowed only for the media host named in the policy and refused for any other host

### Requirement: The served document carries its own policy

Every response for a document or a resource under the application SHALL carry the content security policy header, so the policy applies regardless of which path is requested.

#### Scenario: Policy is present on a document response

- **WHEN** any application path is requested
- **THEN** the response carries the content security policy header
