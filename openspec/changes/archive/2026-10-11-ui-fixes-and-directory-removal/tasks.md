## 1. Database and migrations

- [x] 1.1 Add migration `1710000000007_users_stats_hidden.sql` adding `stats_hidden boolean NOT NULL DEFAULT false` to `users` with up/down; verify `npm run db:migrate` then `npm run db:rollback` applies and reverses it cleanly
- [x] 1.2 Add migration `1710000000008_drop_directory_entries.sql` dropping `directory_entries` (up) and recreating the table (down); verify up/down run cleanly
- [x] 1.3 Update `tests/integration/migrations.test.ts` to assert `users` has `stats_hidden` and `directory_entries` is absent at head; verify `npm run test:integration` passes

## 2. Server-side privacy

- [x] 2.1 Extend `src/modules/auth` types/repository to read `profile_hidden` and `stats_hidden` and add `updatePrivacy(userId, input)`; verify an integration test round-trips both flags
- [x] 2.2 Add a `privacyInput` zod schema and an `updatePrivacy(actor, input)` service, exported from the module index; verify a unit test parses a valid partial body and rejects an empty one
- [x] 2.3 Add a `PATCH /api/me/privacy` route through `withRoute` returning the updated flags; verify a route test covers 401 without a session and 200 with one
- [x] 2.4 Load the actor's privacy flags in `app/(app)/settings/page.tsx` and `app/(app)/settings/privacy/page.tsx` and pass them to `SettingsView`; make `SettingsView` controlled, posting on change with saving/saved/error states; verify a component test asserts persistence on toggle and rollback on failure
- [x] 2.5 Remove the fake "Сохранено" timer from `PrivacyToggle` and drive saving/saved from props; verify the privacy toggle tests pass

## 3. Activity feed scrolling

- [x] 3.1 Rework `SocialFeed` to render all loaded events inside a viewport sized to the selected `size` rows with `overflow-y-auto` (the 5/10/25 control sets viewport height, not an entry cap), keeping the "Новые записи" scroll-to-top action; verify the updated `tests/unit/social-feed.test.tsx` asserts viewport sizing/scroll rather than a listitem cap
- [x] 3.2 Confirm the live-arrival, scroll-position, and stream-fallback tests still pass; verify `npm run test` is green

## 4. Remove `/directory` and repoint login

- [x] 4.1 Change the demo callback URL, `router.push`, and OAuth `callbackUrl` in `LoginForm` from `/directory` to `/`; verify a test/e2e assertion lands on Home after sign-in
- [x] 4.2 Delete `src/app/(app)/directory/`, `src/app/api/directory/`, `src/modules/directory/`, and `src/components/features/directory/`; verify `npm run typecheck` and `npm run deps:check` report no dangling imports
- [x] 4.3 Remove the `directory:create` and `directory:edit` actions and switch cases from `src/core/auth/policy.ts`; verify the updated `tests/unit/policy.test.ts` passes
- [x] 4.4 Delete `tests/unit/directory-schema.test.ts`, `tests/unit/directory-route.test.ts`, `tests/integration/directory.test.ts`, and the `DirectoryList` block in `tests/unit/async-view.test.tsx`; verify `npm run test` and `npm run test:integration` pass
- [x] 4.5 Rewrite `tests/e2e/critical-path.spec.ts` as login → Home → rate a film → feed entry, and point `tests/e2e/auth.spec.ts` at a surviving protected route; verify `npm run test:e2e:critical` passes

## 5. Visual fixes and seed

- [x] 5.1 Align the sidebar collapse control with the section icon column in `sidebar-rail.tsx` (left alignment when expanded, unchanged centering when collapsed); verify the navigation tests still toggle the rail
- [x] 5.2 Replace the Friends/Groups icons in `nav-links.tsx` with distinct ones (`Heart` / `UsersRound`); verify both entries render and the navigation tests pass
- [x] 5.3 Raise the top-bar wordmark from `text-sm` to `text-lg` in `top-bar.tsx`; verify the navigation test asserts the brand link and its larger size class
- [x] 5.4 Rename the seeded "Администратор" to a real person ("Пётр") in `scripts/seed-dev.ts`, keeping handle `admin`, email `admin@demo.local`, and role `admin`; verify `npm run db:seed` succeeds and no group member is named "Администратор"

## 6. Verification

- [x] 6.1 Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration`, and `npm run deps:check`; resolve any failures
- [x] 6.2 Manually confirm the observable outcomes: sign-in lands on Home, privacy survives a tab switch and a reload, the feed scrolls through history, Friends/Groups icons differ, the wordmark is larger, and group members show a person's name
- [x] 6.3 Run `openspec validate "ui-fixes-and-directory-removal" --strict` and confirm the change is valid
