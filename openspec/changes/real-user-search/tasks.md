## 1. Domain and policy

- [x] 1.1 Extend `core/auth/policy.ts` with `friend:request` and `friend:withdraw` actions and a truth-table unit test in `tests/unit/policy.test.ts`
- [x] 1.2 Add zod schemas to `modules/friendships/schema.ts`: search query (trim, length limit), create request (`addresseeId` uuid), withdraw (`friendshipId` uuid); verify with schema unit tests
- [x] 1.3 Add `searchUsers(actor, query)` repository function: one SQL with friend-priority UNION, `u.id <> actor.id`, `profile_hidden = false`, annotated relationship status (`friend | pending_in | pending_out | none`), hard LIMIT; verify via integration test against Testcontainers (friends first, fallback, self excluded, hidden excluded)

## 2. Request lifecycle

- [x] 2.1 Implement `createFriendRequest(actor, addresseeId)`: service checks (self, accepted friendship, existing pending) + pair-row reuse/`ON CONFLICT` per design; integration test covers create, duplicate pending, self request, re-request after decline
- [x] 2.2 Implement `withdrawFriendRequest(actor, friendshipId)`: delete pending row where requester is actor; integration test covers withdraw and that accepted/declined are not deletable
- [x] 2.3 Extend `listOutgoingRequests` exposure so the service returns outgoing requests for the actor; unit test for the service path

## 3. API routes

- [x] 3.1 Add `GET /api/friendships/search` route via `withRoute` (origin guard, zod query schema, rate limit); route unit test for 401/400 paths
- [x] 3.2 Add `POST /api/friendships` route for request creation; route unit test for 400/403/409 error mapping
- [x] 3.3 Add `DELETE /api/friendships/[id]` route for withdrawal; route unit test for 403/404 paths

## 4. UI

- [x] 4.1 Rework `FriendsView` search to call the search API with debounce; render results with `FriendListItem` actions per relationship status; keep component unit tests on the mock data path (`data.ts`) passing
- [x] 4.2 Add outgoing requests section to the friends screen with withdraw action; component test renders outgoing list and withdraw flow
- [x] 4.3 Wire optimistic/local state updates for sent and withdrawn requests; verify with component tests and manual smoke

## 5. E2E and gates

- [x] 5.1 Add Playwright e2e: user A searches user B → sends request → user B accepts → both see friendship; verify spec passes locally
- [x] 5.2 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration` and fix findings
