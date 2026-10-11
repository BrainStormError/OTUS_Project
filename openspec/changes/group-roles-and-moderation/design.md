## Context

See `proposal.md` — Why. Current constraints that shape the approach:

- Group membership is a binary `role` stored as a `smallint` with `CHECK (role IN (0, 1))`
  (`group_members`, migration `1710000000005`). `admin = 1`, `member = 0`.
- A single policy surface decides access: `can(actor, action, resource)` in
  `src/core/auth/policy.ts`, with `GroupRole = 'admin' | 'member'`. Services resolve the
  role and pass it as `resource.groupRole`.
- Coarse actions exist today: `group:manage` covers both role change and member removal;
  `group:invite` covers invite, list, and withdraw; `group:discuss:create` /
  `group:discuss:attach` / `group:rate:start` are administrator-only.
- There is no delete path for discussions, posts, or group ratings. Personal rating
  deletion exists only for the owner of the personal row.
- `activity_events` references `discussion_id` and `media_id` with `ON DELETE SET NULL`,
  so deleting content does not remove its events; events must be deleted explicitly.
- `discussion_posts` cascades from `group_discussions` (`ON DELETE CASCADE`), and
  `group_discussions` cascades from `groups`.

## Goals / Non-Goals

**Goals:**

- Introduce `owner` / `moderator` / `member` with a DB-enforced single owner.
- Give deletion capabilities to the owner only, and keep the moderator additive.
- Remove content cleanly: a media entry deletion also removes its attached discussion,
  its comments, and the group activity events for that media.

**Non-Goals:**

- No per-group custom permissions or a permission-matrix table (fixed three roles only).
- No audit log or soft-delete/tombstone for removed content.
- The simultaneous personal-rating save is change #2 (`group-rating-dual-save`), not here.

## Decisions

### Role codes: keep `member = 0`, keep the owner at code 1, add `moderator = 2`

The existing `admin` code is `1`. Rather than renumber, the single owner reuses code `1`
and `moderator` takes the free code `2`. The TypeScript union becomes
`'owner' | 'moderator' | 'member'`; `ROLE_CODE` maps `{ member: 0, owner: 1, moderator: 2 }`
and `roleFromCode` is an exhaustive switch. **Alternative considered:** a four-value model
with a distinct `admin` — rejected, the user fixed ownership as single-valued.

### Single owner enforced by a partial unique index

`CREATE UNIQUE INDEX group_members_owner_key ON group_members (group_id) WHERE role = 1`.
This makes "at most one owner" a persistence invariant rather than a service check, so a
concurrent double-promotion cannot create two owners. **Alternative considered:** enforcing
it only in the service — rejected, races are possible and the DB constraint is cheap.

### Ownership transfer is one transaction, demote-then-promote

Transfer runs in a single transaction: first `UPDATE ... SET role = moderator` for the
current owner, then `UPDATE ... SET role = owner` for the target. Ordering matters because
the partial unique index is checked per statement — promoting before demoting would trip it.
**Alternative considered:** a `DEFERRABLE` unique constraint with the transaction deferring
checks — rejected as unnecessary complexity for two ordered updates.

### Split the coarse policy actions

The policy gains granular actions and drops the overloaded ones:

- `group:manage` → `group:role:change` and `group:member:remove` (owner only).
- `group:invite` is kept for creating an invitation (owner + moderator) and a new
  `group:invite:revoke` is added for withdrawal (owner only).
- New: `group:owner:transfer`, `group:rate:delete`, `group:discuss:delete`, `group:post:delete`.
- `group:rate:start`, `group:discuss:create`, `group:discuss:attach` change from
  admin-only to owner + moderator.
- `group:leave` changes from "member only" to "moderator + member" (owner must transfer).
- `group:update`, `group:delete`, `group:view`, `group:rate`, `group:discuss` keep their
  meaning with `owner` substituted for `admin`.

UI components keep making no authorization decisions; they receive the resolved role and
choose which controls to render, as today with `isAdmin` in `GroupRatings.tsx`.

### Deletion is an explicit, ordered cascade inside one transaction

Because `activity_events` uses `ON DELETE SET NULL`, deleting content would leave orphaned
feed entries unless removed explicitly. Deletions therefore happen in one transaction:

- Delete a media entry: `DELETE FROM activity_events WHERE group_id = $g AND media_id = $m`,
  `DELETE FROM group_discussions WHERE group_id = $g AND media_id = $m` (posts cascade),
  then `DELETE FROM ratings WHERE group_id = $g AND media_id = $m`. The catalog `media` row
  and personal ratings (`group_id IS NULL`) are never touched.
- Delete a discussion: `DELETE FROM activity_events WHERE discussion_id = $d`, then
  `DELETE FROM group_discussions WHERE id = $d` (posts cascade).
- Delete a comment: `DELETE FROM discussion_posts WHERE id = $p AND discussion_id = $d`.

### Migration must collapse pre-existing multi-admin groups

Existing groups may have several `admin` rows. Before the partial unique index is created,
the migration demotes all but one admin per group to moderator, keeping the earliest
`created_at` (tie-broken by `user_id`) as the owner. **Alternative considered:** keeping the
most recent admin — rejected, the founder is the natural owner.

## Risks / Trade-offs

- [Existing multi-admin groups lose co-admin power] → they become moderators; the founder
  keeps ownership. Acceptable because the role model now has an explicit middle tier.
- [Deleting a media entry destroys members' group ratings and any discussion comments with
  no undo] → this is the requested behavior for a wrongly-chosen media; the confirm dialog
  for destructive actions (existing `Modal` confirm pattern) is the safeguard.
- [The pending `group-rating-started-by-admin` delta also edits `groups/ratings`] → this
  change's delta is written against the post-start behavior (owner/moderator start a media).
  Archive `group-rating-started-by-admin` before this change, otherwise the two deltas must
  be reconciled.
- [Seed data currently seeds binary admins] → the seed must be updated to exercise all three
  roles and to keep exactly one owner per group.

## Migration Plan

1. New migration: drop the old `role` check, add `CHECK (role IN (0, 1, 2))`.
2. Collapse multi-admin groups: demote all but the founder admin to `moderator`.
3. Create `group_members_owner_key` (partial unique, `WHERE role = 1`).
4. Backfill is complete after steps 1–3; no application change is required for existing rows.
5. Rollback: drop the index, restore `CHECK (role IN (0, 1))`, and demote `moderator` rows to
   `member` (owners stay `1`), so the data fits the old binary model.
