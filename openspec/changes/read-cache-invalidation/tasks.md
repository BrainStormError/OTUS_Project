## 1. Cache policy

- [ ] 1.1 Serve single-author reads with `cache-control: private, max-age=31536000`: records, watch-later list, friends list, groups list, profile, and settings; set the feed to `private, max-age=60`; leave catalog reads at one hour. **Verify:** route tests assert the header per data class; `npm test` passes.
- [ ] 1.2 Confirm no read response is marked `public` or `s-maxage`, and mutation responses carry no cache policy. **Verify:** test or review of the response helper shows only `private` policies on GET reads.

## 2. Invalidation on mutation

- [ ] 2.1 Add one shared invalidation helper that re-fetches a given read with `cache: 'reload'` and feeds the client store. **Verify:** unit test covers success and network-failure paths.
- [ ] 2.2 Call the helper after every record and watch-later mutation (add, edit, delete, add-to-list, remove-from-list). **Verify:** unit tests assert the affected reads reload on each path.
- [ ] 2.3 Call the helper after profile and settings saves. **Verify:** unit test asserts the identity/privacy reads reload after a successful save.
- [ ] 2.4 Call the helper after friendship (accept, remove) and group (join, leave, remove member, dissolve) mutations. **Verify:** unit tests assert the lists reload on each path.
- [ ] 2.5 Record the mutation inventory in the change and verify no mutation path bypasses the helper. **Verify:** review of every POST/DELETE handler that touches these resources.

## 3. Invalidation signals

- [ ] 3.1 Add a migration extending the activity-event kind domain with `friend_removed`, `group_left`, `group_removed`, `group_dissolved` and adding a nullable `target_user_id` with a partial index. **Verify:** `npm run test:integration` migration tests pass; up/down round-trip works.
- [ ] 3.2 Extend the kind maps and exclude signal kinds (and targeted rows) from the feed listing while leaving `toFeedEvent` for feed kinds unchanged. **Verify:** unit tests show signals never appear in feed results.
- [ ] 3.3 Emit `friend_removed` for both users in the same transaction as an accepted-friendship removal. **Verify:** integration test sees one signal per recipient and none when the removal fails.
- [ ] 3.4 Emit `group_left` for the leaving user, `group_removed` for the removed member, and one `group_dissolved` per member, in the same transaction and with `group_id` NULL. **Verify:** integration test covers all three paths and confirms signals survive group deletion cleanup.
- [ ] 3.5 Deliver targeted signals to the recipient's stream connection regardless of feed visibility. **Verify:** integration test with two recipients receives only its own signal.

## 4. Client

- [ ] 4.1 Move the real-time stream connection to the application shell and remove Home's own connection. **Verify:** DevTools shows one open stream across navigation between sections; the connect rate limit is not hit.
- [ ] 4.2 On a received signal, invalidate the reads it affects (records and watch-later for rating and membership signals, friends and groups lists for relationship signals). **Verify:** unit test maps each signal kind to its reads.
- [ ] 4.3 Reload affected reads once when the browser returns online and once per cold start. **Verify:** unit test asserts a single reload per event and no reload loop.

## 5. Verification

- [ ] 5.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`. **Verify:** all commands complete without errors.
- [ ] 5.2 Run the `records-freshness` end-to-end test. **Verify:** it passes with the permanent cache, which is only possible through invalidation.
- [ ] 5.3 On the stand with two browsers: remove a friendship in one and confirm the other refreshes within seconds; add a record and confirm a tab switch and a hard reload show the change; confirm personal reads show `(cached)` across navigation. **Verify:** observations recorded in this task.
- [ ] 5.4 Confirm archive order: `nav-prefetch-dedup` is archived before this change, because this delta modifies the cache-policy requirement it adds. **Verify:** order recorded in this task.
