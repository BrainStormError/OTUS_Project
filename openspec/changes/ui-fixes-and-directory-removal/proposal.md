## Why

A manual walkthrough of the movie tracker surfaced seven concrete defects: a misaligned rail-collapse control, a placeholder user literally named "Администратор" appearing among group members, privacy toggles that silently reset when the user changes tabs, an undersized brand wordmark, an activity feed that never scrolls, a stale post-login redirect to the bootstrap "Справочник" (`/directory`) screen, and near-identical Friends/Groups icons. The `/directory` reference feature from the bootstrap phase is no longer part of the product and only survives as the post-login destination. Fixing these together removes the last bootstrap remnant and makes the settings and feed behavior match what the specs already promise.

## What Changes

- **Rail collapse control (#1)**: the sidebar collapse button moves to the left so it aligns with the column of section icons, instead of hugging the right edge.
- **Demo administrator (#4)**: the seeded user currently named "Администратор" is renamed to a real person's name; the `admin` role stays a role on people, not a standalone placeholder account.
- **Privacy persistence (#3)**: the "Скрыть профиль" / "Скрыть статистику" toggles persist to the signed-in account on the server and are restored on every entry to Settings, including after navigating away and back. This adds a `stats_hidden` column (the existing `profile_hidden` is reused) and a mutation endpoint; today the toggles only live in component state and show a fake "Сохранено" label.
- **Brand wordmark (#4)**: the "Смотровик" wordmark in the top bar is rendered at a larger, prominent type size.
- **Activity feed scrolling (#5)**: the feed becomes a fixed-height viewport sized to the selected row count that scrolls through loaded history, instead of clipping entries to the cap. This aligns the implementation with the existing `activity/feed` "Feed display size" contract; no new requirement is introduced.
- **Login destination + directory removal (#6)**: successful sign-in (demo and OAuth) lands on Home (`/`) instead of `/directory`. **BREAKING**: the `/directory` screen, its API route, its domain module, its components, its table, and its policy actions are removed.
- **Section icons (#7)**: Friends and Groups get visually distinct icons so they are not confused at a glance.
- **Out of scope**: reconciling `ProfileView` / the `me` screen with the real account record (they still render mock `currentUser`, so the new privacy flags affect server-side visibility but not the own-profile view); the stale `directory` references in `GUIDE.md` / `docs/`; group posts and notifications.

## Capabilities

### New Capabilities

None. Every behavior change here modifies an existing capability or fixes an implementation to match an existing in-flight contract.

### Modified Capabilities

- `ui/navigation`: the shell's collapse control is aligned with the section icon column; Friends and Groups use visually distinct icons; successful authentication lands on Home rather than a retired screen.
- `ui/screens`: the Settings privacy controls persist to the account and are restored across navigation and reloads.
- `ui/design-system`: the brand wordmark is rendered at a larger, prominent type size relative to body/control text.

## Impact

- **Removed feature (breaking)**: `src/app/(app)/directory/` (page/loading/error), `src/app/api/directory/` (route + factory), `src/modules/directory/` (all files), `src/components/features/directory/` (both components), and the `directory:create` / `directory:edit` actions in `src/core/auth/policy.ts`. A drop migration removes `directory_entries`; `AsyncView` stays (generic primitive used by `ui/interface-states`).
- **Database**: new migration adding `stats_hidden boolean NOT NULL DEFAULT false` to `users`; new migration dropping `directory_entries`.
- **Modules / API**: privacy read+update in `src/modules/auth` (repository/service) and a `PATCH /api/me/privacy` route with a zod schema; `getActor`/session path extended to surface the current account's privacy flags.
- **UI**: `src/components/layout/sidebar-rail.tsx`, `nav-links.tsx`, `top-bar.tsx`; `src/components/features/movie-tracker/SettingsView.tsx`, `PrivacyToggle.tsx`; `src/components/features/movie-tracker/SocialFeed.tsx`; `src/components/features/auth/LoginForm.tsx`; `src/app/(app)/settings/page.tsx` and `settings/privacy/page.tsx`.
- **Seed**: `scripts/seed-dev.ts` renames the placeholder administrator and reassigns memberships/friendships as needed.
- **Tests**: delete `directory-schema`, `directory-route`, `integration/directory`; update `migrations.test.ts`, `async-view.test.tsx`, `policy.test.ts`, `social-feed.test.tsx`, `navigation.test.tsx`, and rewrite `tests/e2e/critical-path.spec.ts` (login → Home → rate a film → feed entry) and `tests/e2e/auth.spec.ts` (protected URL other than `/directory`).
- **Docs**: `GUIDE.md`, `README.md`, and `docs/01`–`docs/05`, `docs/08` still describe `directory` as the reference module and become stale — flagged but out of scope for this change.
- **Process risk**: the in-flight `bootstrap-project` change carries `directory`-bearing `platform/*` delta specs and an e2e critical path built on `/directory`; archiving it after this change would reintroduce a reference to a deleted capability, so it should be reconciled before archiving.
