## Why

The prototype's shell still carries the product brand in the sidebar, its statistics show a subjective average rating, and its Home activity feed is a static mock rebuilt from hardcoded data. The feed is meant to become a real-time surface that will move to production, so it needs real social data, a persisted event source, and live delivery instead of a derived snapshot.

## What Changes

- **Shell brand**: the "Смотровик" logo and title move out of the sidebar into the center of the top bar as a single clickable link to Home, visible on desktop and mobile.
- **Statistics**: the "Средняя оценка" statistic card is removed from the current user's profile, other users' profiles, and the group profile. Film and series ratings are unaffected. The dead `UserStats.average` value is removed from the model and its mock data.
- **Statistics label**: "Частый год" is renamed to "Любимый год".
- **Live activity feed (Phase 1)**: the Home "Лента активности" becomes a real-time feed. Watched records, friendships, and group memberships move to PostgreSQL as the real source; activity events are persisted and streamed to clients. The feed is scrollable, offers a 5 / 10 / 25 row selector that grows the container, and prepends new events as they occur.
- **Dev CSP fix**: the content-security-policy allows `eval()` in development only, so React's development tooling stops failing; the production policy is unchanged.
- **BREAKING**: accepting a friend request and joining a group now write to the database instead of local component state, because they are feed event sources.
- **Out of scope**: group posts, comment threads ("обсуждения"), and a notification center; TMDB integration; the friends-tab reorganization (withdrawn by the user).

## Capabilities

### New Capabilities

- `activity/feed`: the persisted activity event model, its visibility rules (friends, groups the viewer belongs to, and the viewer's own events), keyset pagination, the 5/10/25 display-size contract, and real-time delivery.

### Modified Capabilities

- `ui/navigation`: the product brand is presented in the top bar (centered, links to Home) instead of the sidebar rail.
- `ui/screens`: Statistics no longer presents an average rating; the Home activity feed is real-time, scrollable, and size-selectable.

## Impact

- **Database**: new migrations for `watched_records`, `friendships`, `groups`, `group_members`, and `activity_events` (plus a notify trigger). Existing `users` table gets related through these.
- **New module**: `src/modules/activity` following the existing `types`/`schema`/`policy`/`repository`/`service`/`index` pattern; new `watched-records`, `friendships`, and `groups` repository write paths.
- **API**: `GET /api/feed` (keyset page + reconnect catch-up) and `GET /api/feed/stream` (SSE). New mutation routes for rating a film, accepting/declining a friendship, and joining a group so those actions emit events.
- **UI**: `src/proxy.ts` (dev `unsafe-eval`), `src/components/layout/sidebar-rail.tsx`, `src/components/layout/top-bar.tsx`, `src/components/features/movie-tracker/SocialFeed.tsx`, `HomeView.tsx`, `StatisticsView.tsx`, `FriendRequestsView.tsx`, `types.ts`, `data.ts`.
- **Tests**: `tests/unit/proxy.test.ts` (dev CSP), `tests/unit/navigation.test.tsx` (brand location), `tests/unit/screens.test.tsx` (statistics set, feed), plus new unit/integration coverage for the feed module and stream.
- **Risk**: this is the first real social backend in the project; the mock data and `localStorage` record store are partly replaced and must be reconciled without breaking the existing film/series flows.
