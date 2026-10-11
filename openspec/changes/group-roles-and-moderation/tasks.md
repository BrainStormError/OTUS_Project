## 1. Schema and migration

- [ ] 1.1 Add a migration that drops the old `group_members.role` check and adds `CHECK (role IN (0, 1, 2))`; verify by applying the migration and reading the constraint from the database
- [ ] 1.2 In the same migration, collapse groups with more than one admin to the founder as owner (others become moderator), then create the partial unique index `group_members_owner_key ON group_members (group_id) WHERE role = 1`; verify the index exists and a second owner insert for one group is rejected
- [ ] 1.3 Add the down migration (drop index, restore `CHECK (role IN (0, 1))`, demote moderators to members); verify it applies cleanly on a migrated database
- [ ] 1.4 Update the development seed to give each group exactly one owner plus at least one moderator and one member, and verify `npm test` seed assertions pass

## 2. Authorization policy

- [ ] 2.1 Change `GroupRole` to `'owner' | 'moderator' | 'member'` and update `can()` with the granular actions (`group:role:change`, `group:member:remove`, `group:invite`, `group:invite:revoke`, `group:owner:transfer`, `group:rate:delete`, `group:discuss:delete`, `group:post:delete`) and the widened additive actions; verify policy unit tests cover allow and deny for each role
- [ ] 2.2 Update `group:leave` to allow `moderator` and `member` and deny `owner`; verify with a policy unit test

## 3. Groups module

- [ ] 3.1 Replace `ROLE_CODE` / `roleFromCode` with the three-role mapping and widen `GroupMemberSummary.role`; verify `npm run typecheck`
- [ ] 3.2 Split `changeGroupRole` and `removeGroupMember` behind `group:role:change` / `group:member:remove`, reject targeting the owner, and drop the `countGroupAdmins` last-admin logic; verify integration tests for promote/demote/remove and owner-protection
- [ ] 3.3 Add `transferOwnership` in one transaction (demote current owner to moderator, then promote target to owner); verify an integration test asserts exactly one owner before and after
- [ ] 3.4 Split invitation permission: `inviteToGroup` / `listGroupInvitations` allow owner + moderator, `cancelInvitation` requires owner; verify integration tests for each outcome
- [ ] 3.5 Update `leaveGroup` to permit moderators and deny the owner; verify integration tests

## 4. Discussions module

- [ ] 4.1 Allow owner and moderator to create discussions (`group:discuss:create`); verify an integration test creates a topic as a moderator
- [ ] 4.2 Add `deleteDiscussion`: delete the discussion's activity events, then the discussion (posts cascade), behind `group:discuss:delete`; verify an integration test removes a discussion with comments and asserts no activity remains
- [ ] 4.3 Add `deletePost`: delete a single comment behind `group:post:delete`; verify an integration test deletes a comment as owner and is rejected for moderator and member

## 5. Ratings module

- [ ] 5.1 Allow owner and moderator to start a media (`group:rate:start`); verify an integration test starts a media as a moderator and is rejected for a member
- [ ] 5.2 Add `deleteGroupRatingEntry(groupId, mediaId)` in one transaction: delete `activity_events` for the group+media, delete the attached `group_discussions` row for the group+media (posts cascade), then delete `ratings` for the group+media; verify an integration test removes the entry, its discussion, its comments, and its activity, and that personal ratings are unchanged

## 6. Activity module

- [ ] 6.1 Add a repository helper to delete group activity by group and media, and by discussion; verify it is used by the discussion and media-entry deletion paths

## 7. API routes

- [ ] 7.1 Update group member routes to expose role change, member removal, and ownership transfer, mapping policy denials to permission errors; verify route integration tests
- [ ] 7.2 Add delete routes for a discussion and a comment under the discussions routes; verify route tests for owner success and non-owner rejection
- [ ] 7.3 Add a delete route for a group's media entry under `groups/[id]/ratings/[media]`; verify owner success and non-owner rejection
- [ ] 7.4 Update group invitation routes so moderators can invite and only the owner can withdraw; verify route tests

## 8. UI

- [ ] 8.1 Replace the `isAdmin` flag on the group tabs with the resolved role and drive control visibility per `ui/screens`; verify `npm run lint` and manual check that only the owner sees delete controls
- [ ] 8.2 Add role assignment, ownership transfer, and the member/role panel actions to the group admin panel; verify the panel offers role controls to the owner and none to others
- [ ] 8.3 Add the delete controls (discussion, comment, media entry) with the existing `Modal` confirmation pattern; verify a destructive action requires confirmation before it is sent

## 9. Integration and verification

- [ ] 9.1 Run `npm run typecheck`, `npm run lint`, and `npm test` and confirm all pass
- [ ] 9.2 Add an end-to-end check covering the role capability matrix: owner deletes, moderator is limited to additive actions, member only comments and rates; verify the e2e scenario passes
