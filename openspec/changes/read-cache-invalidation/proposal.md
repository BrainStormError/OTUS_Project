# Proposal: read-cache-invalidation

## Why

The reads that feed the personal sections - watched records, the watch-later list, the friends and groups lists, and the profile and settings - change only when the signed-in user (or, for the two lists, another user acting on their relationship) changes them. The current 30-second browser cache window forces the single-CPU host to re-render and re-serialize identical data on almost every revisit, and pushes every navigation back onto the starved server. Single-author data can stay cached until an actual mutation invalidates it.

## What Changes

- **Single-author reads become permanently cacheable in the browser.** Watched records, the watch-later list, the friends list, the groups list, profile, and settings are served as `private` and cacheable until invalidated. Catalog reads keep their one-hour window. The activity feed keeps a short window because other users change it.
- **Every successful mutation invalidates the reads it affects.** Adding, editing, or deleting a record, changing the watch-later list, saving profile or settings, accepting or removing a friendship, and joining, leaving, being removed from, or dissolving a group each reload the affected reads in place, so a cached response can never hide a completed mutation.
- **Remote changes reach every device through the existing real-time channel.** New invalidation signals are recorded when a friendship ends, a user leaves a group, a user is removed from a group, or a group is dissolved, and are delivered over the existing stream so other open devices refresh the affected reads within seconds. These signals are not shown in the activity feed.
- **The real-time stream covers every section.** It moves to the application shell so it stays connected across navigation, as the feed contract already requires.
- **Safety nets.** Affected reads reload once when the browser comes back online and once per cold start, covering a device that slept through a signal and a hard reload.
- **Not changing:** what the activity feed shows, the catalog cache window, the record endpoint shape (no per-kind split), and the client data store's loading strategy (a later change).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `platform/http-contract`: the "Read responses declare a browser cache policy" requirement moves from fixed windows (30 s / 1 h) to a per-class policy where single-author data is cached until a mutation invalidates it.
- `ui/navigation`: "Personal lists reflect mutations without a manual reload" gains the guarantee that a cached read never hides a completed mutation.
- `activity/feed`: adds invalidation signals for relationship and membership changes - recorded in the same transaction as the change, delivered over the stream to the affected users, and never shown in the feed.

## Impact

- **Code:** read routes for records, watch-list, friendships, groups, profile, and settings; mutation helpers in records, watch-list, settings, and the friendship and group services; new invalidation signals in those two services; the activity stream listener lifted to the application shell.
- **DB:** one migration extending the activity-event kind domain and adding an explicit per-recipient target for invalidation signals; no data rewrite.
- **Tests:** route cache headers, invalidation on every mutation path, signal emission and delivery, and the existing `records-freshness` end-to-end guard.
- **Coordination:** the cache-policy delta modifies the requirement added by `nav-prefetch-dedup`, which must be archived first; the stream relocation follows the existing feed requirement that the stream survive navigation.
