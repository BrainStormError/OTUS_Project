## 1. Store-backed identity

- [x] 1.1 Select and expose `handle` in the auth user query/type and extend the actor to carry `name` and `handle`, verified by `npm run typecheck` and a unit test asserting the actor exposes a handle
- [x] 1.2 Generate a non-null `handle` when a demo-created account is inserted, verified by an integration test that a newly signed-in account has a handle usable in `/u/<handle>` links
- [x] 1.3 Add a user lookup by handle and a profile read returning identity plus statistics and recent records, honoring `profile_hidden`/`stats_hidden` for non-owners, verified by integration tests for own profile, other user, hidden stats, and unknown handle
- [x] 1.4 Point the header account menu at the actor identity instead of the in-code `currentUser`, verified by a component test or manual check that the signed-in account's name and handle are shown

## 2. Personal records read and mutate

- [x] 2.1 Add a list operation and `GET /api/records` returning the account's personal records (`mediaKind`, `mediaRef`, title, year, genres, rating, comment, watchedAt), verified by a route test
- [x] 2.2 Add a delete operation and route for a personal record, verified by a route test that the record is removed for the owner and rejected for another account
- [x] 2.3 Switch My Films, My Series, and the film record view to initial server records plus optimistic save/delete, removing `record-store`/`series-store` local-storage samples, verified by updated `tests/unit/screens.test.tsx` and `npm run typecheck`

## 3. Seeded connected data

- [x] 3.1 Extend `scripts/seed-dev.ts` so every demo account has ratings across a spread of media alongside existing friendships, memberships, and discussions, verified by `npm run db:seed` followed by an integration check that every user has non-empty statistics
- [x] 3.2 Confirm seed determinism by running `npm run db:seed` twice and verifying the resulting row counts and ids are identical

## 4. Profile screens from the store

- [x] 4.1 Replace the in-code constants in `/me`, `/me/stats`, and `/u/[handle]` with the store-backed profile read, verified by updated screen tests covering own profile, another user, and not-found handle
- [x] 4.2 Remove the now-unused identity/friendship/record constants from `data.ts`/`series-data.ts` while keeping the catalog and pure helpers, verified by `npm run typecheck` and `npm run lint`

## 5. Modal focus fix

- [x] 5.1 Stabilize the focus effect so it runs on open changes only and keeps focus on the active control, and focus the first meaningful control rather than the close button, verified by a unit test that typing in a modal input does not move focus to the close button

## 6. Unified add-rating search

- [x] 6.1 Extend `SearchField` with filter visibility and the existing submit/live modes without changing current Home or list behavior, verified by existing `tests/unit/search.test.tsx`
- [x] 6.2 Use the submit-mode panel in the My Films, My Series, and group-rating add modals over the whole catalog, hiding actor/director in the series picker, verified by new tests asserting the panel appears on "Добавить" and applies filters only on "Найти"
- [x] 6.3 Verify in-list search in My Films, My Series, and group ratings remains live and unaffected by the modal changes, verified by the updated screen tests

## 7. Validation

- [x] 7.1 Run `npm run lint`, `npm run typecheck`, and `npm test`, resolving any failures introduced by the change
- [x] 7.2 Run `npm run test:integration` against the seeded database and `openspec validate seeded-profiles-and-unified-search --strict`
