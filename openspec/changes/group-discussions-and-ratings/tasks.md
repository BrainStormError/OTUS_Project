## 1. Schema and migrations

- [x] 1.1 Create migration `group_discussions` (id, group_id, author_id, title, media_kind NULL, media_ref NULL, created_at) with partial unique index `ON (group_id, media_kind, media_ref) WHERE media_ref IS NOT NULL` and both up/down; verify via `tests/integration/migrations.test.ts`
- [x] 1.2 Create migration `discussion_posts` (id, discussion_id, author_id, body, created_at) with index `(discussion_id, created_at)`; verify migration test
- [x] 1.3 Create migration `group_ratings` (id, group_id, user_id, media_kind, media_ref, title, year, genres, rating numeric(3,1) CHECK 0..10, comment, watched_at, created_at) with UNIQUE (group_id, user_id, media_kind, media_ref) and index (group_id, created_at DESC); verify migration test

## 2. Discussions module

- [x] 2.1 Scaffold `modules/discussions` (types, schema, policy, repository, service, index) per module template; `deps:check` passes
- [x] 2.2 Implement `createDiscussion(actor, groupId, input)`: admin-only policy, group membership check, optional media link; unit tests for policy truth table and service rejections (non-admin, non-member)
- [x] 2.3 Implement `listDiscussions(groupId)` (newest first with author and comment count) and `getDiscussion(id)`; integration test covers ordering, counts, and the partial-unique rejection of a second media-attached discussion
- [x] 2.4 Implement `addComment(actor, discussionId, body)`: member-only, chronological order; integration test covers member comment, non-member rejection, ordering
- [x] 2.5 Record activity events: `post_created` on discussion creation and `comment_created` on comments, with `group_id` and payload hrefs; integration test asserts events are written inside the same transaction

## 3. Group ratings

- [x] 3.1 Add zod schema for group rating input (media_kind, media_ref, title, year, genres, rating 0–10 step 0.1, comment, watched_at); schema unit test for bounds
- [x] 3.2 Implement `saveGroupRating(actor, groupId, input)` in `modules/groups`: member-only, upsert by (group, user, media), `film_rated`/`series_rated` activity event with `group_id`; integration test covers insert, re-rating update, non-member rejection, event written
- [x] 3.3 Implement `listGroupRatings(groupId)` with computed average `AVG(rating)::numeric(3,1)` per media and individual ratings per member; integration test covers average (8 and 9 → 8.5) and update following a re-rating
- [x] 3.4 Implement `attachDiscussion(actor, groupId, media)` in `modules/discussions`: admin-only, media must have ≥1 group rating, one discussion per media enforced by the partial index; integration test covers success, second-attach rejection, unrated-media rejection, non-admin rejection

## 4. Group activity feed

- [x] 4.1 Implement `listGroupFeed(actor, groupId, {limit, cursor})` in `modules/activity`: membership check in service, `group_id` filter over existing visibility SQL, keyset cursor; integration test covers member-only access, event kinds, ordering, and pagination
- [x] 4.2 Join attached discussion into rating feed entries at read time (by group_id + target media) so the discussion link appears even when attached after the event; integration test covers late-attached discussion

## 5. API routes

- [x] 5.1 Add `POST /api/groups/[id]/discussions` (admin-only) and `GET` list via RSC read; route unit tests for 401/403 paths
- [x] 5.2 Add `POST /api/discussions/[id]/posts` (member-only); route unit test for 403
- [x] 5.3 Add `POST /api/groups/[id]/ratings` and attach route `POST /api/groups/[id]/ratings/[media]/discussion`; route unit tests for validation and permission errors

## 6. UI: group page tabs

- [x] 6.1 Restructure `/groups/[id]` into URL-based tabs Обсуждения | Оценки | Активность | Участники | Статистика per `ui/screens` delta; keep existing admin panel entry; component/RSC smoke test renders the tab set
- [x] 6.2 Build Discussions tab: topic list (title, author, comment count, newest first), discussion view with comments and member comment form, admin-only create form, empty state; component tests for list, form visibility by role, empty state
- [x] 6.3 Build Ratings tab: reuse `RatingForm` and media picker in a modal (same UX as My Films), table of rated media with group average, expandable row with individual ratings, empty state; component tests for rating submission and average display
- [x] 6.4 Build Activity tab: event list (actor, action, time) with empty state; rating entries with an attached discussion render the «К обсуждению» button leading to the discussion; component test for button presence/absence
- [x] 6.5 Ensure accessibility of tabs (roles, keyboard navigation, focus) per `ui/accessibility` spec; run `tests/unit/accessibility.test.tsx` patterns on the new components

## 7. Seed and E2E

- [x] 7.1 Extend seed data with demo discussions, comments, and group ratings (test values through the DB, per project rules); verify seed script runs on a clean database
- [x] 7.2 Add Playwright e2e: member rates a film in a group → admin attaches discussion → discussion visible in Обсуждения and Оценки tabs → activity tab shows rating with «К обсуждению» button; verify spec passes locally
- [x] 7.3 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`, `npm run build` and fix findings
