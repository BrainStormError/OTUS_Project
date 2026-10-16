## 1. Generator

- [x] 1.1 Add a pure seed-to-parameters function (integer rolling hash plus seeded PRNG, no `Math.random`) that returns the blob's hues, spot positions/sizes and base tone, and verify with a unit test that the same seed yields identical parameters across repeated calls
- [x] 1.2 Verify with a unit test that two representative different seeds yield different hue/shape parameters, and that an id-based fallback seed is stable

## 2. Avatar component

- [x] 2.1 Create `src/components/ui/avatar.tsx` as a `'use client'` primitive taking `seed`, `size`, and optional `label`, rendering the clipped-circle gradient blob with an instance-unique id (`useId`); verify no import from `modules` and that `npm run deps:check` passes
- [x] 2.2 Add module-level memoization of the derived parameters keyed by seed and render two avatars with the same seed in one page; verify with a React test that they share parameters but have distinct SVG ids and that the generator runs once per seed
- [x] 2.3 Implement the accessibility behavior: `aria-hidden` when a label is not given, `role="img"` with the accessible label when it is; verify both cases in a component test
- [x] 2.4 Verify determinism and hygiene in a unit test: no writes to `localStorage`, `document.cookie`, or IndexedDB, and no network calls during render

## 3. Wire the identity surfaces

- [x] 3.1 Show the avatar in the top-bar identity control (`top-bar.tsx` / `account-menu.tsx`) using the signed-in tag; verify the rendered top bar contains the avatar for the account
- [x] 3.2 Replace the `UserRound` placeholder with the avatar in own profile (`EditableIdentity`) and in another user's profile (`ProfileView`), seeded by the shown tag; verify the placeholder icon is gone and each header shows an avatar
- [x] 3.3 Show the avatar in `FriendListItem` (covers friend list, incoming requests, and outgoing requests) seeded by `user.handle`; verify each list entry shows an avatar
- [x] 3.4 Show the avatar in `AdminMemberPanel` member and pending-invitation entries, seeded by the entry's handle; verify each entry shows an avatar

## 4. Cleanup and final verification

- [x] 4.1 Remove the unused `avatarUrl` field from `src/components/features/movie-tracker/types.ts`; verify `npm run typecheck` and `npm run lint` pass
- [x] 4.2 Verify the full suite passes with `npm test`
- [x] 4.3 Manually verify end to end that a user's avatar is identical across the top bar, their profile, a friend entry, and the admin member panel, and that it updates after changing the tag
