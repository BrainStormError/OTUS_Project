## Context

See `proposal.md` for motivation. Relevant current state:

- Preferences for theme, identity display, and rail collapse live in `src/components/layout/preferences.ts` (localStorage + a broadcast event). Privacy has no equivalent: `SettingsView` holds it in `useState` seeded from props that no caller passes, and `PrivacyToggle` fakes a "Сохранено" label after 400 ms.
- `users.profile_hidden` already exists and is read server-side by the activity and friendships repositories; there is no `stats_hidden` column and no mutation path for either flag. `resolveActor` returns only `{ id, role, email }`.
- The activity feed already has a persisted/real-time contract captured in the in-flight `ui-shell-and-live-feed` change (`activity/feed` "Feed display size"): the container expands to fit the selected number of entries and scrolls when entries exceed it. `SocialFeed` instead slices to `size` and sizes the box to `size * 4.5rem`, so overflow (and therefore scrolling) never happens.
- `/directory` is the bootstrap "Справочник" vertical slice (`src/modules/directory`, `/api/directory`, the app route, two components) and the post-login destination in `LoginForm`. It has no navigation entry. `AsyncView` is the generic loading/empty/error primitive it uses; the primitive is also covered independently by the interface-states specs.
- Migrations are ordered SQL files applied by `node-pg-migrate`; `tests/integration/migrations.test.ts` asserts `directory_entries` exists at head.

## Goals / Non-Goals

**Goals:**
- Make privacy a server-owned account property that survives navigation and reload, and that actually drives feed/friendship visibility.
- Make the feed a fixed-height scroll viewport tied to the 5/10/25 selector, satisfying the existing `activity/feed` contract.
- Remove the `/directory` feature and send authenticated users to Home without leaving dangling references in code or tests.
- Resolve the three purely visual defects (rail-control alignment, brand size, Friends/Groups icons) with minimal surface.

**Non-Goals:**
- Reconciling `ProfileView` / the `me` screen with the real account row (they keep rendering mock `currentUser`; privacy flags affect server visibility only).
- Updating `GUIDE.md` / `docs/*` prose that still calls `directory` the reference module.
- Any change to feed data, visibility, pagination, or streaming behavior.

## Decisions

### Privacy is stored in `users` and mutated through one endpoint
Add a `stats_hidden boolean NOT NULL DEFAULT false` column to `users` (keep the existing `profile_hidden`), extend the auth repository with a read of both flags and an `updatePrivacy` write, and expose `PATCH /api/me/privacy` through `withRoute` with a zod body `{ profileHidden?: boolean; statsHidden?: boolean }` (at least one field). The two settings RSC pages (`/settings`, `/settings/privacy`) load the actor's flags and pass them to `SettingsView`, which becomes controlled: it posts on change and shows saving/error instead of the fake timer.

- *Why server over localStorage*: `profile_hidden` already gates server-side visibility, so a client-only copy would let the UI and the actual visibility disagree. The user chose server persistence.
- *Alternative rejected*: extend `preferences.ts` with privacy keys. Fast, but leaves the server view and the UI out of sync.

### The feed viewport is sized to the selector; entries are not clipped
Render every loaded event and set the container's height to exactly `size` rows (a fixed row height / `max-height` with enforced row height) with `overflow-y: auto`. The 5/10/25 control changes the viewport height, not a hard cap; the "Новые записи" affordance still scrolls to top. Update `social-feed.test.tsx` to assert scroll behavior and viewport sizing rather than a listitem cap of 5/25.

- *Why*: directly implements the existing `activity/feed` "Feed display size" + "scrollable when entries exceed the container" scenarios, which the current `slice` implementation violates. No new requirement is needed.
- *Alternative rejected*: keep the cap and shrink `maxHeight` below one row. Clips entries and contradicts the contract.

### Remove `/directory` by dropping the table in a new migration
Keep `1710000000001_directory_entries.sql` immutable and add `1710000000007_drop_directory_entries.sql` with `DROP TABLE ... ` up and a recreate down. Delete the route, API, module, components, and the `directory:create` / `directory:edit` actions and cases in `core/auth/policy.ts`. Update `migrations.test.ts` to assert the table is absent at head.

- *Why not delete the old migration file*: applied dev databases and `pgmigrations` history expect it; removing it breaks replay and rollback determinism.
- *Keep `AsyncView`*: it is a generic state primitive referenced by the interface-states specs and its own tests, not a directory artifact.

### Sign-in lands on Home
Change the three `/directory` targets in `LoginForm` (demo callback, `router.push`, OAuth `callbackUrl`) to `/`. Rewrite the e2e critical path as login → Home → rate a film → feed entry, and point `auth.spec`'s protected-URL redirect check at a surviving route.

### Visual fixes
- Rail control: switch the expanded header container from `justify-end px-4` to the left icon column (matching the `nav`/link padding), leaving the collapsed `justify-center` state unchanged.
- Icons: Friends → `Heart`, Groups → `UsersRound` (the current `Users`/`UsersRound` pair is the near-identical one). Alternative if the heart reads as "likes": Friends → `Contact`, Groups → `UsersRound`.
- Brand: raise the top-bar wordmark from `text-sm` to `text-lg`, keeping the clapperboard icon.
- Seed: rename the `admin@demo.local` user from "Администратор" to a real first name ("Пётр"), keeping handle `admin` and the `admin` role so demo login and membership data stay valid.

## Risks / Trade-offs

- [Removing `/directory` touches many files and tests] → Delete in one focused sweep and rely on `npm run typecheck`, `npm run lint`, `npm run test` to catch dangling imports; update `migrations.test.ts` in the same change.
- [The `bootstrap-project` change still carries `directory`-bearing `platform/*` delta specs and a `/directory` e2e path] → Do not archive that change after this one without reconciling it; noted in the proposal as a process risk.
- [Privacy now hits the network on every toggle] → Optimistic UI with an explicit saving/error state; failures revert the control and surface a retry, per the new scenario.
- [Server privacy flags do not change the own-profile view] → Documented as a non-goal; the flags still drive feed/friendship visibility, which is their purpose.
- [Rendering all loaded events instead of a hard cap] → The feed's default first page is small (20 server-side) and the DOM stays trivial; virtualization is unnecessary at this scale.

## Migration Plan

1. Land the two migrations (`stats_hidden`, drop `directory_entries`) and run `npm run db:migrate` up/rollback locally.
2. Remove the directory feature and repoint login; update unit/integration/e2e tests.
3. Re-seed (`npm run db:seed`) so the renamed administrator and the new column are reflected in demo data.
4. Rollback: the drop migration recreates an empty `directory_entries` table if needed; the privacy column is additive and safe to leave.

## Open Questions

None blocking. The exact Friends icon (Heart vs Contact) is a cosmetic choice that does not change the spec, the approach, or the task breakdown.
