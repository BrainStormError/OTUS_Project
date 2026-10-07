## 1. Migrations

- [x] 1.1 Rewrite `src/core/db/migrations/` into the compact set (init without pgcrypto, users, media+genres, ratings, friendships, groups+members+tags, group_discussions, discussion_posts, activity_events) using `bigint` identity keys, `smallint` codes, `smallint[]` genre/tag ids, nullable `ratings.group_id`, partial unique indexes, and 1000-char CHECKs; verify with `npm run db:migrate` on a clean database and `tests/integration/migrations.test.ts`
- [x] 1.2 Keep every migration reversible and idempotent; verify `npm run db:rollback` then `npm run db:migrate` runs cleanly

## 2. Database core

- [x] 2.1 Register a single `int8` type parser (`pg.types.setTypeParser(20, Number)`) in `src/core/db/pool.ts` and verify with an integration test that repository reads return numeric ids
- [x] 2.2 Remove all `pgcrypto`/`gen_random_uuid`/`uuid` remnants from schema and casts; verify no source references remain

## 3. Ratings module

- [x] 3.1 Scaffold `src/modules/ratings` (types, schema, repository, service, index) owning the `ratings` table; verify `npm run deps:check` passes
- [x] 3.2 Implement personal-rating upsert (`group_id` NULL) resolving/creating the media record; verify integration test for insert and re-rate update (no duplicate)
- [x] 3.3 Implement group-rating upsert (`group_id` set) with per-group uniqueness; verify integration test for insert, update, and independence from the personal rating
- [x] 3.4 Implement personal and group rating listing with `rating` tenths mapping and computed group average; verify integration test that 8 and 9 yield 8.5 and that an update changes the average

## 4. Records module

- [x] 4.1 Rewire `src/modules/records` to the ratings module and media lookup, removing duplicated media columns; verify integration test for save and list
- [x] 4.2 Update `records/types.ts` to numeric ids and the ratings shape; verify `npm run typecheck`

## 5. Groups module

- [x] 5.1 Rewire group ratings in `src/modules/groups` through the ratings module; verify integration test for save/list and member-only rejection
- [x] 5.2 Switch groups to `smallint[]` tag ids, numeric member ids, and fix the `row.user_id.slice(0, 8)` fallback handle; verify group integration tests and unit `group-ratings`

## 6. Discussions module

- [x] 6.1 Replace `media_kind`/`media_ref` with `media_id` and numeric ids across `src/modules/discussions` (repository, service, types, schema); verify integration test for create/list/posts and the one-discussion-per-media constraint
- [x] 6.2 Emit `post_created`/`comment_created` events referencing `discussion_id` without payload; verify integration test asserts events are written in the same transaction

## 7. Activity module

- [x] 7.1 Update `activity/types.ts` and schema: remove `payload`/`target_type`/`target_id`, add `media_id`/`discussion_id`; verify unit `activity` and `feed` tests
- [x] 7.2 Rewrite `activity/repository.ts` insert and feed queries to derive title/rating/href/actor via joins on `media`, `ratings`, `discussions`, `groups`; verify integration `feed-api`, `group-feed`, and `activity`
- [x] 7.3 Change the keyset cursor to a numeric id in `activity/domain.ts` and the client copy in `movie-tracker/feed.ts`; verify a unit round-trip test for both copies

## 8. Auth and session

- [x] 8.1 Change `uid`/`user.id` to `number` in `src/types/next-auth.d.ts` and `src/modules/auth/auth.ts`; verify login/demo integration and e2e still authenticate

## 9. Friendships module

- [x] 9.1 Switch friendships to numeric ids and `smallint` status codes across `src/modules/friendships` (schema, repository, service, types); verify unit `friendships-schema`/`friendships-service` and integration `friendships`

## 10. API routes

- [x] 10.1 Parse `[id]`/`[media]` path segments to integers and return 400 on invalid input across affected route handlers; verify unit route tests for validation and permission errors
- [x] 10.2 Update request/response DTOs to numeric ids; verify unit `routes`, `friendship-routes`, `group-routes`

## 11. UI

- [x] 11.1 Update `src/components/features/movie-tracker/*` (adapters, feed, tracker views) to numeric ids and payload-free feed data; verify unit `feed`, `social-feed`, `screens`

## 12. Seed data

- [x] 12.1 Rewrite `scripts/seed-dev.ts`: genre/tag dictionaries, media catalog, users, friendships, groups with members/tag ids, personal and group ratings, discussions with posts, and activity events linked by id; verify `npm run db:seed` on a clean database with no orphan references
- [x] 12.2 Make events match stored ratings, cover a 1000-character comment and every enumerated code, and keep the run deterministic; verify re-running `db:seed` yields the same dataset

## 13. Verification

- [x] 13.1 Run `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`, `npm run build` and fix all findings
- [x] 13.2 Run `npm run test:e2e:critical` (and `group-discussions` spec) against the re-seeded database and fix failures
