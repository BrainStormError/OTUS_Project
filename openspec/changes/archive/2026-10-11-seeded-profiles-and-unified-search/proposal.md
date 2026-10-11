## Why

The interface reads identity and records from in-code demo constants (`movie-tracker/data.ts`, `series-data.ts`, browser local storage) while friendships, discussions, ratings, and the activity feed already come from the relational store. As a result a signed-in account sees a wrong profile (always "Алексей @me"), comments attributed to the real account, and a friends list that looks like the current user, while "My Films/Series" never agree with the account's own persisted ratings. Separately, the discussion-create modal steals focus to its close button on every keystroke, and the add-rating flows use a bare text input instead of the structured search used on Home. The schema and a deterministic seed already exist, so the gap is that the UI still trusts constants.

## What Changes

- Make identity, relationships, group membership, discussions, and personal records account-backed: the header, `/me`, `/me/stats`, and `/u/[handle]` render the signed-in user (or the addressed user) from the store instead of in-code constants.
- Derive profile statistics from the account's persisted ratings, and resolve other users by handle.
- Extend the development seed so every demo user has connected data (ratings across media, friendships, group memberships, discussions) for pre-populated, testable profiles. The film/series catalog stays in code as reference data; only relationships move to the store.
- Load and mutate "My Films" and "My Series" from the account's persisted records (new list endpoint), removing the local-storage samples.
- Unify add-rating search: the modals opened by "Добавить" (My Films, My Series, group ratings) use the same filter panel as Home (title, genre, actor, director, year) with a "Найти" submit, while the in-list search stays live.
- Fix the modal focus trap so focus stays on the control being used and does not jump to the close button on each state update.
- **BREAKING**: previously visible demo content (hard-coded sample records, static "Алексей @me" identity, per-browser records) is removed in favor of account data.

## Capabilities

### New Capabilities

- `social-data`: Account-backed, interconnected user data (profiles, friendships, group memberships, ratings, discussions) as the single source for identity and social relationships, plus a deterministic development seed that populates linked data for testing.

### Modified Capabilities

- `ui/screens`: The profile screen shows the signed-in account's identity and persisted statistics/records (and other users' real data by handle); My Films/My Series read and write the account's persisted records; the add-rating modal mirrors the Home search panel while the in-list search stays live.
- `ui/accessibility`: While a modal is open and the user types, focus remains on the field being used and does not move to the close control; opening a modal focuses the first relevant control.

## Impact

- Removing in-code identity/relationship/record sources: `src/components/features/movie-tracker/data.ts`, `series-data.ts`, `record-store.ts`, `series-store.ts`.
- Reading account/profile data: `src/app/(app)/layout.tsx`, `me/page.tsx`, `me/stats/page.tsx`, `u/[handle]/page.tsx`, `src/modules/auth/repository.ts` (+ `handle` for demo-created users), profile/statistics adapters.
- Records API: new list endpoint on `src/app/api/records` and record/series services.
- Seed: `scripts/seed-dev.ts`.
- Modal focus: `src/components/ui/modal.tsx`.
- Add-rating search: `MyFilmsView.tsx`, `MySeriesView.tsx`, `GroupRatings.tsx`, `SearchField.tsx`.
- No new dependencies; the existing schema already models users, friendships, groups, ratings, discussions, and media.
