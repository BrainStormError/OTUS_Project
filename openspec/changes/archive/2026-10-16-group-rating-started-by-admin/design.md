## Context

See `proposal.md` — Why. The relevant current state:

- A group rating row is a row in `ratings` with a non-null `group_id`; the unique index `(group_id, user_id, media_id)` already makes a member's rating upsert.
- A group's rated-media list is derived from `ratings` at read time (`listGroupRatings`, `src/modules/ratings/repository.ts`), grouping by `media_id` and averaging member ratings.
- Authorization lives in `can()` (`src/core/auth/policy.ts`), where `group:rate` currently allows both `admin` and `member`; the save entry point is `saveGroupRating` (`src/modules/groups/service.ts`).
- The ratings tab UI (`src/components/features/movie-tracker/GroupRatings.tsx`) shows one `Добавить оценку` control to every member, which opens a catalog search picker; there is no per-row rating action.
- Media metadata is resolved from TMDB on save (`resolveSaveMetadata`), which is unchanged by this design.

## Goals / Non-Goals

**Goals:**

- Only an administrator can start a media in a group (create its first group rating); members rate only already-started media.
- Enforce the rule at the API boundary, not just in the UI.
- Expose a per-row rating action so a member can rate/update their own rating for a started media, with the discussion link beside it.

**Non-Goals:**

- No new table, status, or lifecycle entity — "started" stays derived from existing ratings.
- No change to the personal rating flow, the group average, discussion attachment rules, or the save endpoint's request shape.
- No closing/deadline, approval, or notification behavior.

## Decisions

### 1. "Started" is derived, not stored

A media is started in a group when `EXISTS (SELECT 1 FROM ratings WHERE group_id = $1 AND media_id = $2)`. No new column or table. Alternative considered: a `group_rated_media` nomination table — rejected because it is exactly the separate state the requirement forbids and it needs a backfill.

### 2. Split the permission

Add `group:rate:start` (administrator only) alongside `group:rate`. `group:rate` keeps meaning "may rate an already-started media" and stays available to members and administrators. The route stays `POST /api/groups/[id]/ratings`; the service decides which permission applies from whether the media is already started. Alternative: keep one permission and branch only inside the service — rejected because the split keeps `can()` as the single readable source of who may do what, consistent with `group:discuss:create`/`group:discuss:attach`.

### 3. Server-side guard inside the transaction

In `saveGroupRating`, after resolving metadata and upserting the media row, check whether any group rating already exists for that `(group, media)`. If none exists and the actor's group role is not `admin`, return `FORBIDDEN` and roll back. The existence check MUST run on the same transaction client as the insert, so a pooled `query` is not used here; add a client-aware variant in the ratings repository rather than reusing the pool-based `hasGroupRating`. Rationale: without this, a member could start a media by calling the API directly.

### 4. Row state is computed from the actor's own rating

`GroupRatingSummary.ratings` already carries each member's `userId`. The server passes the current user's id into `GroupRatings` (via `RatingsPanel`, which already holds `actor`), and the row shows `Изменить` when an entry with that `userId` exists and `Оценить` otherwise. The row action reuses the existing `RatingForm`, prefilled with the member's own rating, comment, and watch date. Alternative: add a dedicated `myRating` field to the summary — rejected as redundant since the member list is already present.

### 5. Discussion control is unchanged and stays beside the row action

`К обсуждению` is shown when the summary has a `discussionId`; the administrator-only `Обсудить` attach control is kept for started media with no discussion. Both sit in the row alongside `Оценить`/`Изменить`.

### 6. Start control

The existing catalog picker becomes the administrator's start control and is rendered only when `isAdmin`. Its request is unchanged (it already posts a first rating that starts the media). Label changes are cosmetic.

## Risks / Trade-offs

- [Member bypasses the UI with a direct POST] → the server guard in decision 3 rejects the first-rating write for a non-administrator.
- [Race: a member's request is checked before an administrator's start commits] → both writes are guarded by the same check inside a transaction and the unique index still prevents duplicate rows; the rare loser receives `FORBIDDEN`. Acceptable at this scale; tightening would require locking the `(group, media)` pair.
- [TMDB is required to save, so a started media still needs TMDB to rate] → pre-existing behavior shared with personal ratings; out of scope here.
- [The admin's own starting rating appears in the individual list] → intended: the average is over all members, including the administrator.

## Migration Plan

No database migration. Existing group ratings already have ratings, so their media count as started and members may keep rating them. Rollback is a UI/policy revert only.

## Open Questions

- The exact label of the administrator's start control (`Добавить фильм` vs `Начать оценивание`) — cosmetic, no effect on specs or approach.
