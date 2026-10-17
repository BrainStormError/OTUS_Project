## 1. Cache policy

- [x] 1.1 Serve single-author reads with `cache-control: private, max-age=31536000`: records, watch-later list, friends list, groups list, profile, and settings; set the feed to `private, max-age=60`; leave catalog reads at one hour. **Verify:** route tests assert the header per data class; `npm test` passes.
- [x] 1.2 Confirm no read response is marked `public` or `s-maxage`, and mutation responses carry no cache policy. **Verify:** test or review of the response helper shows only `private` policies on GET reads.

## 2. Invalidation on mutation

- [x] 2.1 Add one shared invalidation helper that re-fetches a given read with `cache: 'reload'` and feeds the client store. **Verify:** unit test covers success and network-failure paths.
- [x] 2.2 Call the helper after every record and watch-later mutation (add, edit, delete, add-to-list, remove-from-list). **Verify:** unit tests assert the affected reads reload on each path.
- [x] 2.3 Call the helper after profile and settings saves. **Verify:** unit test asserts the identity/privacy reads reload after a successful save.
- [x] 2.4 Call the helper after friendship (accept, remove) and group (join, leave, remove member, dissolve) mutations. **Verify:** unit tests assert the lists reload on each path.
- [x] 2.5 Record the mutation inventory in the change and verify no mutation path bypasses the helper. **Verify:** review of every POST/DELETE handler that touches these resources.

Mutation inventory (every client mutation path touching the cached reads; all route through `invalidateReads` in `src/components/features/movie-tracker/read-invalidation.ts`):

| Mutation | Client entry | Reads reloaded |
| --- | --- | --- |
| `POST /api/records` (add/edit record) | `report-rating.ts` `saveRemoteRating` (via `record-store`, `reportRating`) | records, watch-later, stats |
| `DELETE /api/records` | `report-rating.ts` `deleteRemoteRecord` (via `record-store`) | records, watch-later, stats |
| `POST /api/watchlist` | `report-watchlist.ts` `saveRemoteWatchlist` (via `watchlist-store`) | watch-later |
| `DELETE /api/watchlist` | `report-watchlist.ts` `deleteRemoteWatchlist` (via `watchlist-store`) | watch-later |
| `PATCH /api/me/identity` | `EditIdentityModal` | identity, privacy, profile, stats |
| `PATCH /api/me/privacy` | `SettingsView` | identity, privacy, profile, stats |
| `POST /api/groups/[id]/ratings` with `alsoPersonal` (dual-save record) | `GroupRatings` | records, watch-later, stats |
| `POST /api/friendships`, `/accept`, `/decline`, `/remove`, `DELETE /api/friendships/[id]` | `social-actions.ts` `requestJson` | friends, groups |
| `POST /api/groups`, `/groups/join`, `PATCH /api/groups/[id]`, `DELETE /api/groups/[id]` | `CreateGroupModal`, `joinGroupRemote`, `GroupSettingsForm`, `DissolveGroupButton` | friends, groups |
| `DELETE /api/groups/[id]/membership`, `PATCH|DELETE /api/groups/[id]/members/[userId]` | `LeaveGroupButton`, `AdminMemberPanel` `postJson` | friends, groups |
| `POST /api/groups/[id]/invitations`, `POST|DELETE /api/groups/invitations/[id]` | `AdminMemberPanel` `postJson`, `GroupInvitations` | friends, groups |

Handlers that touch none of the cached reads and therefore need no reload: discussion posts (`POST /api/groups/[id]/discussions`, `POST /api/discussions/[id]/posts`, `POST /api/groups/[id]/ratings/[media]/discussion`) and `POST /api/auth/register`; group detail and discussion reads stay uncached (multi-author, non-goal).

## 3. Invalidation signals

- [x] 3.1 Add a migration extending the activity-event kind domain with `friend_removed`, `group_left`, `group_removed`, `group_dissolved` and adding a nullable `target_user_id` with a partial index. **Verify:** `npm run test:integration` migration tests pass; up/down round-trip works.
- [x] 3.2 Extend the kind maps and exclude signal kinds (and targeted rows) from the feed listing while leaving `toFeedEvent` for feed kinds unchanged. **Verify:** unit tests show signals never appear in feed results.
- [x] 3.3 Emit `friend_removed` for both users in the same transaction as an accepted-friendship removal. **Verify:** integration test sees one signal per recipient and none when the removal fails.
- [x] 3.4 Emit `group_left` for the leaving user, `group_removed` for the removed member, and one `group_dissolved` per member, in the same transaction and with `group_id` NULL. **Verify:** integration test covers all three paths and confirms signals survive group deletion cleanup.
- [x] 3.5 Deliver targeted signals to the recipient's stream connection regardless of feed visibility. **Verify:** integration test with two recipients receives only its own signal.

## 4. Client

- [x] 4.1 Move the real-time stream connection to the application shell and remove Home's own connection. **Verify:** DevTools shows one open stream across navigation between sections; the connect rate limit is not hit.
- [x] 4.2 On a received signal, invalidate the reads it affects (records and watch-later for rating and membership signals, friends and groups lists for relationship signals). **Verify:** unit test maps each signal kind to its reads.
- [x] 4.3 Reload affected reads once when the browser returns online and once per cold start. **Verify:** unit test asserts a single reload per event and no reload loop.

## 5. Verification

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`. **Verify:** all commands complete without errors.
- [x] 5.2 Run the `records-freshness` end-to-end test. **Verify:** it passes with the permanent cache, which is only possible through invalidation.
- [x] 5.3 On the stand with two browsers: remove a friendship in one and confirm the other refreshes within seconds; add a record and confirm a tab switch and a hard reload show the change; confirm personal reads show `(cached)` across navigation. **Verify:** observations recorded in this task.

Stand observations (two browser contexts, `admin@demo.local` + `maria@demo.local`, app built and served from `npm run start` with the migrated dev database):

- Friendship removal: after `POST /api/friendships/remove` in browser A, browser B's `GET /api/friendships` read turned over **276 ms** after the removal (measured through the browser cache, so only the signal-driven reload can explain it), and B's friends list was empty on the next tab switch — no manual reload.
- Record add: a record saved through the Home UI (catalog served from the seeded offline catalog cache, since TMDB is unreachable from this host) appeared in My Films after a tab switch and after a reload; the post-reload `/api/records` resource entry shows `transferSize: 0`, i.e. the change was served from the cache entry the mutation had replaced.
- `(cached)` across navigation: repeated client-side navigations between My Films, Friends, and Home produced **zero** network reads of `/api/records` (`transferSize: 0` entries); the only network reads observed were the mutation invalidation and the once-per-cold-start safety net on the first navigation after a reload.
- [x] 5.4 Confirm archive order: `nav-prefetch-dedup` is archived before this change, because this delta modifies the cache-policy requirement it adds. **Verify:** order recorded in this task.

Archive order confirmed: `2026-10-17-nav-prefetch-dedup` already sits in `openspec/changes/archive/` (its cache-policy requirement is in the main `platform/http-contract` spec), while `read-cache-invalidation` is still active. This change must therefore be archived after `nav-prefetch-dedup`, so the modified requirement replaces the one the archived change added.
