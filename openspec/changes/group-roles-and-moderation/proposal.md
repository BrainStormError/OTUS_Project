## Why

Groups use a binary role model (`admin` / `member`) where every administrator can both
add and delete, and every member can rate and comment. Groups need a middle tier —
a moderator who contributes and curates without destructive power — and an unambiguous
single owner who can never be removed by accident. At the same time, there is currently
no way to remove content that was created by mistake: a discussion, a comment, or a
whole wrongly-chosen media entry cannot be deleted, so they stay in the group and clutter
it. This change introduces the three-role model and the deletion capabilities that give
those roles their meaning.

## What Changes

- Introduce three group roles: **owner**, **moderator**, **member**. A group has exactly
  one owner (enforced by the schema), any number of moderators, and any number of members.
- **BREAKING**: the persisted group-member role values change. `admin` is replaced by the
  single-valued `owner`; `moderator` is added. Existing administrators become owners of
  their groups; the group's founding administrator remains the sole owner.
- Define the capability model:
  - **Owner** may start and delete discussions, add and remove members, add and delete
    comments, add and delete group ratings, change roles, edit the group, dissolve it, and
    transfer ownership.
  - **Moderator** may do the additive half only: start discussions, invite members, comment,
    and rate. A moderator cannot delete any content, remove a member, change a role, edit
    the group, or dissolve it.
  - **Member** may only comment and rate.
- Add deletion of content that today cannot be removed:
  - Delete a discussion (with its comments).
  - Delete a comment.
  - Delete a whole media entry from the group's ratings (all members' ratings for that
    group and media) — used when the wrong film or series was chosen. Deleting an entry
    also removes the discussion attached to that media and the group activity events for
    that media.
- Add **ownership transfer**: the owner designates a member who becomes the new owner, and
  the former owner becomes a moderator. Only after transferring ownership can the former
  owner leave the group.
- Split the coarse `group:manage` / `group:invite` actions into finer capabilities:
  role change and member removal are owner-only; inviting is open to moderators, while
  withdrawing an invitation stays owner-only.
- Update the group UI so the owner sees the destructive controls, the moderator sees only
  the additive ones, and the member sees only comment and rate.

## Capabilities

### New Capabilities
<!-- None: the role model and ownership live in the existing groups/management capability. -->

### Modified Capabilities

- `groups/management`: replace the binary role with owner/moderator/member, enforce a
  single owner, and define role change and member removal as owner-only plus ownership
  transfer.
- `groups/invitations`: let moderators invite, keep withdrawing an invitation owner-only,
  and state that a non-accepted invitation still grants no access.
- `groups/discussions`: allow moderators to create discussions, add deletion of a
  discussion and its comments, and allow the owner to delete individual comments.
- `groups/ratings`: allow moderators to start ratings, add deletion of a whole media entry
  from the group and the cascade to its attached discussion and activity events.
- `groups/activity`: remove the group's activity events for a deleted media entry so the
  feed does not retain references to media that no longer exist in the group.
- `data-model`: extend the group member role code set and add the single-owner invariant.
- `ui/screens`: update the group admin panel for role assignment and ownership transfer,
  and show destructive controls only to the owner.

## Impact

- **Schema**: a migration widening the `group_members.role` check and adding a partial
  unique index that allows one owner per group.
- **Authorization**: `src/core/auth/policy.ts` — new group actions and a three-valued
  `GroupRole`; group service and discussion/rating services resolve and pass the role.
- **Groups module**: `service.ts` / `repository.ts` / `schema.ts` / `types.ts` — role
  change, member removal, ownership transfer, invitation split.
- **Discussions module**: new delete operations for discussions and posts.
- **Ratings module**: new delete-whole-entry operation and its cascade.
- **Activity module**: deleting activity events by group and media.
- **UI**: group admin member panel, discussions tab, ratings tab, activity tab.
- **Seed data**: must exercise all three roles.
