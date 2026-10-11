## Why

Today any group member can add a brand-new media to a group through the ratings tab's catalog picker, so several members can independently start the same film or pull in arbitrary titles. The group's ratings list becomes uncurated noise instead of a deliberate list of films the group agreed to watch and rate.

## What Changes

- Starting a rating — the first rating of a media in a group — becomes administrator-only. The "add media" control in the ratings tab is shown to administrators only.
- A member rates only media that are already started in the group. Each row offers **Оценить** when the member has no rating for it and **Изменить** when they do; **К обсуждению** appears next to it when a discussion is attached.
- An administrator starts a media with their own rating; their rating is the first group rating for that media and counts toward the average.
- The server rejects a non-administrator who tries to create the first rating for a media in a group, so the rule holds even against a direct API call.
- The group rating remains the average of all members' ratings, computed from stored ratings at read time.
- No new state, table, or lifecycle is introduced: a media is "started" exactly when it already has at least one group rating.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `groups/ratings`: rating media in a group changes from "any member may rate any media" to "an administrator starts a media with their own rating, and members rate only media already started"; the ratings tab entry controls change accordingly.
- `ui/screens`: the group ratings tab gains an administrator-only start control and per-row rate/edit/discussion actions.

## Impact

- `src/modules/groups/service.ts` — guard in `saveGroupRating` that only an administrator may create a group's first rating for a media.
- `src/core/auth/policy.ts` — split the start action (administrator-only) from rating an already-started media (members and administrators).
- `src/components/features/movie-tracker/GroupRatings.tsx` — admin-only start control, per-row `Оценить`/`Изменить`, `К обсуждению` alongside.
- API shape of `POST /api/groups/[id]/ratings` is unchanged; only its authorization outcome changes.
- Tests: unit policy/route, integration (non-admin start rejected, member rating on a started media accepted), and row-state coverage.
- No database migration: existing group ratings already have a rating, so their media count as started.
