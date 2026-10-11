## 1. Ratings and groups services

- [x] 1.1 Add a read-only media lookup by `(kind, external_ref)` and a `hasPersonalRating(userId, mediaId)` check to the ratings module; verify with a unit test that a missing media and a private personal row are reported correctly
- [x] 1.2 Extend `groups/service.ts` `saveGroupRating` to accept `alsoPersonal` and `confirmOverwrite`, and inside its existing transaction: reject with `CONFLICT` when a personal rating exists and overwrite is not confirmed (writing nothing), otherwise upsert the group rating, upsert the personal rating, and remove the media from the watchlist; verify an integration test that a conflict writes neither row
- [x] 1.3 Verify the atomic path with an integration test: with `alsoPersonal` set and no existing personal rating, both rows are written with equal rating, comment, and watch date, and a watchlist row for the media is removed

## 2. API

- [x] 2.1 Extend `groupRatingInput` with optional `alsoPersonal` and `confirmOverwrite` booleans and pass them through `POST /api/groups/:id/ratings`; verify route tests for the plain save, the 409 conflict, and the confirmed retry

## 3. UI

- [x] 3.1 Add an optional controlled checkbox to `RatingForm` (label: "также добавить в мои фильмы" / "…сериалы"), rendered only when the caller passes it, leaving the personal modals unchanged; verify `npm run lint` and a component check
- [x] 3.2 Wire the checkbox in `GroupRatings` for both the add and the edit modals, send `alsoPersonal`, and on a 409 response open the overwrite-confirmation `Modal`; on confirm resubmit with `confirmOverwrite: true`, on dismiss clear the checkbox; verify the flows manually and with a component test

## 4. Verification

- [x] 4.1 Run `npm run typecheck`, `npm run lint`, and `npm test` and confirm all pass
- [x] 4.2 Verify end to end that deleting the media entry from the group leaves the member's personal rating intact (covers the independence requirement)
