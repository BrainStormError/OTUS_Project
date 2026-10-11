## Why

Everywhere a user's identity appears today — the top-bar account menu, profiles, friend and invitation lists, and the admin member panel — the person is shown as plain text or a generic placeholder icon, so people are hard to tell apart at a glance. A per-user visual identity derived from the unique tag gives instant recognition without storing or serving any image.

## What Changes

- Introduce a shared `Avatar` primitive that renders a gradient-blob from a deterministic seed — the user's tag (handle).
- Generate entirely on the client from a pure function: inline SVG, no network request, and no persistence (nothing on the server, no localStorage, no cookie, no IndexedDB). The result is memoized in the tab's memory and disappears on reload, i.e. after sign-out.
- Replace the placeholder icon and add the avatar to the identity surfaces: top-bar account menu, own profile, another user's profile, friend list items (also shared by friend-request items), and the admin member panel.
- Treat the avatar as decorative where a name is adjacent (`aria-hidden`), and give it an accessible label when it stands alone.
- Remove the unused `PublicUser.avatarUrl` field, which nothing reads or writes.

## Capabilities

### New Capabilities
- `ui/avatar`: the deterministic, tag-seeded gradient-blob avatar primitive — how it is derived, where it is shown, and its accessibility behavior.

### Modified Capabilities
- `ui/screens`: the shared component inventory now includes the avatar wherever identity is shown.

## Impact

- New component: `src/components/ui/avatar.tsx` (pure generator plus a client wrapper).
- Wired into: `src/components/layout/top-bar.tsx` / `account-menu.tsx`, `EditableIdentity`, `ProfileView`, `FriendListItem` (and through it `FriendRequestItem`), `AdminMemberPanel`.
- Removes the dead `avatarUrl` field from `src/components/features/movie-tracker/types.ts`.
- No database, API, or dependency changes. New unit tests cover determinism, memoization, and accessibility.
