## MODIFIED Requirements

### Requirement: Create a group

Any authenticated user SHALL be able to create a group by providing a name and optional description, tags, and visibility (open or closed). The creator SHALL become the sole owner of the new group, and after creation the new group's page SHALL be opened.

#### Scenario: Group created

- **WHEN** an authenticated user submits a valid group name
- **THEN** the group is created with the chosen attributes and the creator is its owner

#### Scenario: Creator becomes administrator

- **WHEN** a user creates a group
- **THEN** the creator's membership role in that group is owner (the group's administrator)

#### Scenario: Landing on the new group

- **WHEN** a group is created successfully
- **THEN** the main page of the created group is shown

#### Scenario: Anonymous creation rejected

- **WHEN** a request without a valid session attempts to create a group
- **THEN** the request is rejected and no group is created

### Requirement: Edit group settings

The owner of a group SHALL be able to change the group's name, description, tags, and visibility between open and closed. A moderator, a member, and a non-member SHALL NOT be able to change any of these.

#### Scenario: Administrator edits settings

- **WHEN** the group's owner changes the group's name, description, tags, or visibility
- **THEN** the changes are saved and shown on the group

#### Scenario: Non-administrator denied

- **WHEN** a moderator or member of the group, or a non-member, attempts to change group settings
- **THEN** the change is rejected and nothing is modified

### Requirement: Open and closed group visibility

An open group SHALL be discoverable in search by any authenticated user; a closed group SHALL NOT appear in search results, and its only entry path SHALL be an accepted invitation. The owner SHALL be able to switch a group between open and closed.

#### Scenario: Open group discoverable

- **WHEN** a user searches for a group that is open
- **THEN** the group appears in the results

#### Scenario: Closed group not discoverable

- **WHEN** a user searches for a group that is closed and is not a member
- **THEN** the group does not appear in the results

#### Scenario: Visibility changed by administrator

- **WHEN** the group's owner switches a group from open to closed, or the reverse
- **THEN** the group's discoverability follows the new visibility

### Requirement: Manage members and roles

The owner of a group SHALL be able to set a member's role between moderator and member, remove a member other than the owner, and transfer ownership to another member. These changes SHALL be persisted and reflected on the group. The owner SHALL NOT be removed or demoted through member management; only an ownership transfer SHALL change which member is the owner.

#### Scenario: Role changed

- **WHEN** the owner changes a member's role between moderator and member
- **THEN** the new role is stored and reflected on the group

#### Scenario: Member removed

- **WHEN** the owner removes a member who is not the owner
- **THEN** the member no longer belongs to the group

#### Scenario: Non-administrator cannot manage members

- **WHEN** a moderator, member, or non-member attempts to change a role or remove a member
- **THEN** the change is rejected

#### Scenario: Owner cannot be removed or demoted

- **WHEN** the owner attempts to remove themselves or change their own role without transferring ownership
- **THEN** the attempt is rejected and the owner keeps the owner role

## ADDED Requirements

### Requirement: Single owner per group

Every group SHALL have exactly one owner, enforced by the persistence layer. A group SHALL have any number of moderators and any number of members.

#### Scenario: One owner at creation

- **WHEN** a group is created
- **THEN** exactly one membership of that group carries the owner role

#### Scenario: Second owner rejected

- **WHEN** an operation other than ownership transfer would assign the owner role to a member of a group that already has an owner
- **THEN** the operation is rejected

#### Scenario: Every group has an owner

- **WHEN** a group's membership is read
- **THEN** exactly one of its members carries the owner role

### Requirement: Ownership transfer

The owner of a group SHALL be able to transfer ownership to another member of the group. After a transfer the target member SHALL become the sole owner and the former owner SHALL become a moderator. Ownership transfer SHALL be the only operation that changes which member is the owner.

#### Scenario: Ownership transferred

- **WHEN** the owner transfers ownership to another member
- **THEN** that member becomes the sole owner and the former owner becomes a moderator

#### Scenario: Only the owner can transfer

- **WHEN** a moderator, member, or non-member attempts to transfer ownership
- **THEN** the attempt is rejected

#### Scenario: Former owner can leave after transfer

- **WHEN** the former owner is now a moderator and leaves the group
- **THEN** they cease to be a member and the group keeps its new owner

### Requirement: Group role capabilities

Group actions SHALL be governed by the acting member's role. The owner SHALL be able to perform every group action. A moderator SHALL be able to perform only additive actions — inviting members, creating discussions, commenting, and rating media — and SHALL NOT delete content, remove members, change roles, edit the group, dissolve it, or transfer ownership. A member SHALL be able to comment, rate media, view the group, and leave the group only. Leaving a group SHALL be available to moderators and members but not to the owner, who SHALL transfer ownership first.

#### Scenario: Owner has full capability

- **WHEN** the owner performs any group action
- **THEN** the action is allowed

#### Scenario: Moderator is additive only

- **WHEN** a moderator attempts to delete content, remove a member, change a role, edit the group, dissolve it, or transfer ownership
- **THEN** the attempt is rejected

#### Scenario: Member acts on content only

- **WHEN** a member attempts any action other than commenting, rating media, viewing the group, or leaving
- **THEN** the attempt is rejected

#### Scenario: Owner transfers before leaving

- **WHEN** the owner attempts to leave the group without first transferring ownership
- **THEN** the attempt is rejected
