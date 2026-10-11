## 1. Authorization

- [x] 1.1 In `src/core/auth/policy.ts` add the action `group:rate:start` and make it administrator-only, keeping `group:rate` for rating an already-started media (member and administrator); verify with a unit test asserting `group:rate:start` is denied for a member and allowed for an admin
- [x] 1.2 Update the group-rating route unit test (`tests/unit/group-routes.test.ts`) so a non-administrator first rating maps to `403` and confirm the suite passes

## 2. Server-side guard

- [x] 2.1 In `src/modules/ratings/repository.ts` add a transaction-client-aware check for whether any group rating already exists for a `(group_id, media_id)` pair, distinct from the pool-based `hasGroupRating`; verify it runs against the transaction client in the group-ratings integration test
- [x] 2.2 In `src/modules/groups/service.ts` guard `saveGroupRating`: after resolving metadata and upserting the media row, reject with `FORBIDDEN` when no group rating exists for the media and the actor's group role is not `admin`; verify with integration tests that a member's first rating is rejected and a member's rating on a started media succeeds

## 3. Ratings tab UI

- [x] 3.1 In `src/components/features/movie-tracker/GroupTabPanels.tsx` pass the current user's id from `RatingsPanel` (which already holds `actor`) into `GroupRatings`; verify the prop is threaded by the component test
- [x] 3.2 In `src/components/features/movie-tracker/GroupRatings.tsx` render the start control (existing catalog picker / `Добавить оценку`) only when `isAdmin`; verify a member sees no start control and an admin does
- [x] 3.3 In `GroupRatings.tsx` add a per-row rating action that reuses `RatingForm` prefilled with the member's own rating, comment, and watch date: show `Изменить` when the summary contains an entry for the current user and `Оценить` otherwise, and show `К обсуждению` beside it when the row has a discussion; keep the administrator-only `Обсудить` attach control for rows without a discussion; verify all four row states with a component test
- [x] 3.4 Verify saving from a row posts to `POST /api/groups/[id]/ratings` and that a successful save refreshes the tab content

## 4. Verification

- [x] 4.1 Run `npm run test` and the group-ratings integration suite (`npm run test:integration`) and confirm they pass
- [x] 4.2 Run `npm run typecheck`, `npm run lint`, and `npm run deps:check` and confirm they pass
