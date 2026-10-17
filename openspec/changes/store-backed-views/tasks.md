## 1. Session data load

- [x] 1.1 Add a generic read store (resource key -> loaded state) and a session loader in the application shell that hydrates it once per cold start with identity, records, watch-later lists, friends, groups, and settings. **Verify:** unit tests cover success, failure, and retry; the loader runs once per session.
- [x] 1.2 Keep the existing list stores as the mutation source of truth and reconcile hydrated reads into them. **Verify:** existing store tests pass and a new test shows hydrated data appearing in the store snapshot.

## 2. Screens read from the store

- [x] 2.1 Replace `useApi` with store reads on the personal screens (Home personal parts, My Films, My Series, profile, settings). **Verify:** a screen mounted twice in a session issues one read, not two.
- [x] 2.2 Define loading and failure behavior: loading state on cold start only, error with retry per resource. **Verify:** unit tests cover both states.

## 3. Mutations stop re-rendering the document

- [x] 3.1 Review all eighteen `router.refresh()` call sites and remove each that exists only to re-render data the store already holds. **Verify:** the surviving calls are listed with a reason in this task.

  Removed (12): `record-store.ts` x2, `watchlist-store.ts` x2 (list stores hold the change and `invalidateReads` reloads the reads), `FriendsView.tsx` x2, `FriendRequestsView.tsx`, `FriendActionButton.tsx` (friends list is store-held and reloaded by `SOCIAL_READS`), `GroupInvitations.tsx` (groups list is store-held and reloaded by `SOCIAL_READS`), `EditIdentityModal.tsx` (identity reads are store-held and reloaded by `IDENTITY_READS`, the shell renders from them), `LeaveGroupButton.tsx`, `DissolveGroupButton.tsx` (navigation to the groups list renders from the reloaded store read).

  Surviving (1):
  - `LoginForm.tsx:31` - the call re-renders the document after the session cookie changes; no store holds session state.

  Follow-up from stand testing (2026-10-17): the group screen moved from the unstored `/api/groups/:id` read to the session store (`GroupScreen`/`GroupAdminScreen` now use `useRead`), so the four group `router.refresh()` calls were removed as well: `GroupRatings.tsx` x2, `GroupDiscussions.tsx` x2, and `GroupSettingsForm.tsx`. These mutations now invalidate the group read through `groupReads(groupId)` (`/api/groups` plus `/api/groups/:id`), which is what makes a created discussion, a saved rating, or a renamed group appear in place. The same pass added `/api/me/profile` to `RECORDS_READS`, so saving a record refreshes the profile activity feed and the stats embedded in the profile read.
- [x] 3.2 Confirm mutations refresh through the invalidation helper from `read-cache-invalidation` instead. **Verify:** a mutation test shows no document refresh and the affected read reloaded.

## 4. Remove remaining prefetching

- [x] 4.1 Add `prefetch={false}` to every `<Link>` outside the navigation shell: top-bar brand, account menu (both), shell back links (film, series, group, group admin), group card, friend row, watch-list row, feed item, profile and record views, statistics link, group-admin link. **Verify:** grep over `<Link` shows every non-shell link carries `prefetch={false}`.
- [x] 4.2 Add a test that hovering chrome links and rendering lists issues no prefetch call. **Verify:** the test fails against the previous code.

## 5. Verification

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`, and the end-to-end mutation flows. **Verify:** all pass.

  Results (2026-10-17, local): `lint` clean (2 pre-existing `no-img-element` warnings), `typecheck` clean, `deps:check` clean (253 modules), `npm test` 709/709, `npm run test:integration` 180/180. End-to-end mutation flows pass: `records-freshness`, `friend-request`, `group-creation`, `group-lifecycle` (join/leave/dissolve), `profile-edit`, plus smoke, auth, group-access, static-shell (25 passed, 1 skipped). The six remaining e2e cases (critical-path catalog rating flows and the `group-discussions` picker flow) search the TMDB catalog, which is unreachable from this machine - to be confirmed on the VPS where TMDB is reachable.

- [x] 5.2 On the stand: cold start loads once, then moving between Home, My Films, My Series, and profile issues no read requests; a mutation updates the screen without a document request; hovering friends and groups lists issues no `_rsc` requests. **Verify:** DevTools observations recorded in this task.

  Network observations (local production build behind `npm run start`, demo login; identical code to the stand - stand re-check, including the TMDB-dependent flows, runs on the VPS):
  - Cold start: the session loader issued one read per session resource (`/api/me/identity`, `/api/records`, `/api/watchlist?kind=film|series`, `/api/friendships`, `/api/groups`, `/api/me/privacy`) plus Home's lazy `/api/genres` and `/api/search?kind=film`; the pre-existing once-per-cold-start safety net from `read-cache-invalidation` then reloaded `PERSONAL_READS` once (unchanged behavior).
  - Moving Home -> My Films -> My Series -> Profile -> Home: only the four route `_rsc` payloads, zero `/api/` read requests.
  - Mutation (privacy toggle): `PATCH /api/me/privacy` followed by the invalidation helper reloading the four affected reads (`/api/me/identity`, `/api/me/privacy`, `/api/me/profile`, `/api/me/stats`); no document `_rsc` request after the mutation.
  - Hovering the friend rows on /friends and the group cards on /groups (2 + 2 links, pointerenter/focus): no `_rsc` requests; the only `_rsc` traffic was the two navigation payloads for /friends and /groups.
  - Group discussion create after the follow-up fix (built app, demo login): `POST /api/groups/1/discussions` followed by exactly one `GET /api/groups/1` reload; the new topic appears in the list in place, no document `_rsc`, and zero console errors on the page.
