## Context

See proposal.md - Why. Current state that shapes the design:

- Read routes are `force-dynamic` and already carry a browser cache policy from `nav-prefetch-dedup`: 30 s for personal reads, 1 h for catalog reads.
- Screens fetch their reads on mount (`useApi('/api/records')` and similar); `list-store` already holds optimistic mutation state and reconciles fetched data into it.
- Activity is persisted in `activity_events` (`kind smallint CHECK (kind IN (0..5))`), delivered by an `AFTER INSERT` trigger through `pg_notify('activity_events', id)` to the SSE endpoint, pruned lazily after one day, and deleted explicitly when a group is deleted. Feed visibility is computed from the viewer's current friendships and group memberships.
- The feed contract already requires the real-time stream to survive navigation between sections.
- Every read that reaches the starved single-CPU host costs seconds, so the goal is to stop reaching it.

## Goals / Non-Goals

**Goals:**

- Single-author reads are served from the browser cache across navigation and are refreshed only by a mutation.
- Every device of every affected user converges within seconds of a relationship or membership change.
- No mechanism depends on a timer to eventually repair stale data.

**Non-Goals:**

- Changing what the activity feed shows or how it is paginated.
- Splitting `/api/records` by media kind or moving screens to read from `list-store` (a later change).
- Caching group details, discussions, or any other multi-author data.

## Decisions

### 1. Permanent browser caching for single-author reads

Watched records, watch-later list, friends list, groups list, profile, and settings are served with `private, max-age=31536000`. The catalog keeps its one-hour window; the feed gets sixty seconds.

**Alternatives:** a finite window (5-10 min) was considered and rejected - it guarantees periodic re-renders of unchanged data on a host where each costs seconds, which is exactly the cost this change removes. The safety a short window provides is replaced by the invalidation and recovery mechanisms below.

### 2. Invalidation is explicit and immediate

Browsers do not invalidate a cached GET when a POST or DELETE succeeds. Every mutation path therefore, after success, re-fetches each affected read with `cache: 'reload'`, which replaces the cached entry and feeds the client store. A single shared helper performs this so a new mutation path cannot silently skip it.

**Alternative:** appending a version query parameter to reads - rejected: it changes cache keys, leaves the old entry behind, and makes every URL unique.

### 3. Invalidation signals ride the existing activity bus

New `activity_events` kinds: `friend_removed`, `group_left`, `group_removed`, `group_dissolved`. They use the same table, the same `NOTIFY` trigger, and the same SSE stream - no new transport is introduced. A signal is recorded in the same transaction as the change, and pruned by the existing one-day retention.

Visibility needs care: feed visibility is derived from the viewer's *current* friendships and group memberships, and these signals exist precisely because that membership just ended. Relying on the existing visibility rules would deliver nothing. Signals therefore carry an explicit recipient (nullable `target_user_id`), and the stream delivers a signal to the recipient's connection regardless of feed visibility. One signal is written per affected user, including the acting user's other sessions.

Dissolution writes one signal per member. Signals are inserted with `group_id` NULL so the existing group-deletion cleanup (`DELETE ... WHERE group_id = $1`) cannot delete them and the `ON DELETE SET NULL` foreign key has nothing to null.

**Alternatives:** authoring the signal as the affected user (misuses `actor_id` and pollutes feed semantics); a separate per-user notification table (new infrastructure for a signal that is pruned within a day) - both rejected.

### 4. Signals are invisible to the feed

The feed listing and `toFeedEvent` mapping continue to cover the six feed kinds only; signal kinds are excluded at the query level. No feed screen behavior changes.

### 5. The stream lives in the application shell

The SSE connection moves from Home to the application shell, satisfying the existing feed requirement that the stream survive navigation, and giving every section the ability to react to signals. One connection per user; Home stops opening its own, keeping the existing per-user stream guard and connect rate limit satisfied.

### 6. Recovery does not rely on timers

Two safety nets cover a device that missed a signal: a reload of affected reads on the browser `online` event, and a single reload per cold start. Together they cover a sleeping device, a dropped stream, and a hard reload that would otherwise serve a cached copy.

## Risks / Trade-offs

- [A mutation path is missed by the invalidation helper] -> single helper, the mutation inventory in the impact list, and the existing `records-freshness` end-to-end test as the guard.
- [A signal is never delivered (offline device, dropped stream, connect limits)] -> `online` and cold-start reloads bound the staleness to the next session, not indefinitely.
- [Group deletion removes signals] -> signals are written with `group_id` NULL, and the migration documents the ordering constraint.
- [Migration touches a live table] -> adds one nullable column and widens a check constraint; no data rewrite, down migration removes signal rows first.
- [Two stream connections on Home] -> the shell owns the stream and Home's own connection is removed in the same change.
- [End-to-end freshness test may pass for the wrong reason] -> the test must exercise a mutation followed by an immediate visit, which only invalidation can satisfy under a permanent cache.
- [Archive ordering: this delta modifies a requirement added by `nav-prefetch-dedup`] -> archive `nav-prefetch-dedup` first, otherwise the modified requirement is absent from the main spec.

## Migration Plan

1. Migration: extend the `kind` check to include the four signal kinds and add `target_user_id bigint NULL REFERENCES users(id) ON DELETE CASCADE` with a partial index on non-null targets. No existing rows change.
2. Deploy the application: cache headers, invalidation helper, signal emission, shell-level stream, recovery hooks.
3. Rollback: previous image restores the old cache windows; the down migration first deletes signal rows, then narrows the check and drops the column. Signalling is additive, so applying it before the client ships is harmless.

## Open Questions

(none)
