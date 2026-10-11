## ADDED Requirements

### Requirement: Group-scoped reads deny access on their own

A group-scoped read operation that returns restricted-group content (the group, its member roster, its ratings, or its discussions) SHALL itself take the viewer and deny access when the viewer is not entitled, rather than returning the content and relying on the caller to have checked first. A caller that omits its own check SHALL NOT cause content of a restricted group to be returned.

#### Scenario: Caller omits the check

- **WHEN** a caller invokes a group-scoped read for a restricted group without performing its own access check
- **THEN** the read still denies an unentitled viewer and returns nothing of the group

#### Scenario: Authorized viewer through any entry point

- **WHEN** a member or administrator invokes a group-scoped read
- **THEN** the group and its content are returned
