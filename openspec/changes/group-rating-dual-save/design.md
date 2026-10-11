## Context

See `proposal.md` — Why. Current constraints that shape the approach:

- Group rating and personal rating are separate rows in `ratings`, distinguished by
  `group_id` (`NULL` = personal). The unique indexes `ratings_personal_key` and
  `ratings_group_key` already keep one row of each kind per media.
- `groups/service.ts` `saveGroupRating` already runs one transaction and calls the ratings
  module (`resolveSaveMetadata`, `saveGroupRatingRepository`); it records the activity event.
- The personal save path lives in `records/service.ts` `saveWatchedRecord`, which upserts the
  personal rating and removes the media from the watchlist.
- `watchlist` imports `ratings` (its schema re-exports `mediaKinds`), so the ratings module
  MUST NOT import `watchlist` without creating a cycle. Orchestration therefore belongs in the
  groups module, which may import both.
- The shared `RatingForm` component is used by both the personal add/edit modals and the group
  rating modals.
- `withRoute` returns `{ error, code }` and maps `CONFLICT` to HTTP 409.

## Goals / Non-Goals

**Goals:**

- Save the group rating and the personal rating atomically from one form submission.
- Never silently overwrite an existing personal rating; require explicit confirmation.
- Keep the two records independent (group deletion never touches the personal row).

**Non-Goals:**

- No change to the ratings schema or to the personal add/edit screens.
- No bulk "sync all my group ratings to my list" feature.
- No separate personal comment/date — both records share the form's values.

## Decisions

### Orchestrate the dual save in `groups/service.ts`, not in the ratings module

`saveGroupRating` performs the whole operation in its existing transaction: resolve the media,
optionally check for a conflicting personal rating, upsert the group rating, and (when
requested) upsert the personal rating and remove the media from the watchlist. **Alternative
considered:** doing it inside `ratings/service.saveGroupRating` — rejected because removing the
watchlist row would make `ratings` import `watchlist`, reversing an existing dependency.

### Detect the conflict with a read-only media lookup so nothing is written on conflict

Before writing, resolve the media id with a read-only lookup by `(kind, external_ref)`. If no
media row exists, no personal rating can exist, so the save proceeds. If a media row exists and
the member has a personal rating row, the operation returns `CONFLICT` without writing anything
(no group row, no personal row). This keeps the "refuse and change nothing" guarantee without
relying on transaction rollback. **Alternative considered:** write first and roll back on
conflict — rejected because `withTransaction` commits whatever the callback returns, so a
returned error after a write would persist it.

### Signal the overwrite conflict as the endpoint's `CONFLICT` (HTTP 409)

The client treats a 409 from the group-ratings save as the "personal rating will be overwritten"
prompt and, on confirmation, resubmits with `confirmOverwrite: true`. This endpoint's only other
reachable error is `FORBIDDEN`/`NOT_FOUND`, so 409 is unambiguous here; no new global error code
is introduced. **Alternative considered:** adding a dedicated `ErrCode` — rejected as a wider
core change for a single, unambiguous case.

### The checkbox is an optional prop on the shared `RatingForm`

`RatingForm` gains an optional controlled checkbox rendered only when the group context passes
it, so the personal modals are unaffected. The label follows the media kind. `GroupRatings`
owns the checkbox state and the confirmation dialog (the existing `Modal` confirm pattern).

## Risks / Trade-offs

- [`savePersonalRating` re-upserts the media metadata a second time in the same transaction] →
  the upsert is idempotent by `(kind, external_ref)`; the cost is one extra statement.
- [Treating 409 as the overwrite prompt couples the client to the endpoint's conflict meaning]
  → acceptable while the endpoint has a single conflict cause; revisit if more conflicts appear.
- [A member who rates a media both personally and in a group may be surprised the two values
  diverge on separate edits] → they are independent by design; the confirmation dialog only
  appears when the simultaneous save would overwrite.

## Migration Plan

No schema change and no data migration. This is an additive API field plus UI. Rollback is
removing the checkbox and the optional request fields; existing data is unaffected.
