## Context

See `proposal.md` for motivation. Current state that shapes the approach:

- The shell is fixed: `SidebarRail` (`w-60`, desktop only), `TopBar` (theme switch + account menu), `MobileTabBar` (5 tabs), with the section list hardcoded in `src/components/layout/sections.ts`.
- The "product" layer is a presentation prototype: `src/components/features/movie-tracker/data.ts` holds mock films, users, requests, and groups; `record-store.ts` persists watched records in `localStorage` under `movie-tracker-records` / `movie-tracker-removed`.
- The theme is a `localStorage` value (`theme`) applied via a `data-theme` attribute and an inline script in `src/app/layout.tsx`.
- Auth exposes `signOut` (`src/modules/auth/auth.ts`) but the UI has no sign-out control; the app layout passes only `actor.email` to the top bar.
- The real backend (`modules/auth`, `modules/directory`) is untouched by this change; `users` has no tag column (the unique-tag item is deferred).
- Specs `ui/navigation`, `ui/design-system`, `ui/screens` are the contract; two in-flight changes (`search-via-filters`, `refine-search-and-my-films`) already modify the first and third and must be archived first.

## Goals / Non-Goals

**Goals:**
- Consolidate all settings into Settings; reduce Profile to statistics + activity.
- Make the shell collapsible, brand it "Смотровик", and expose identity + sign-out in the top bar.
- Add a social activity feed on Home and improve group cards.
- Add a full My Series library with a per-episode / whole-series rating model.

**Non-Goals:**
- No backend, DB migration, TMDB integration, or per-user persistence; preferences and records stay in `localStorage`.
- No navigation placement choice (top vs side) — dropped.
- No unique user tag — deferred.
- No change to film card, film rating form, friends, statistics, or group admin behavior beyond the deltas listed.

## Decisions

**D1. Series is a separate data model, not a generalized media type.** Add `Series`, `SeasonMeta`, `EpisodeMeta`, and `SeriesRecord` to `types.ts`, plus a `series-data.ts` catalog and a `series-store.ts` keyed `movie-tracker-series` / `movie-tracker-series-removed`. Keeping films and series types apart avoids destabilizing the film search, My Films table, and Home film flows. Alternative considered: a discriminated `MediaItem` union — rejected as a larger refactor with no behavior benefit here.

```
SeriesRecord = {
  id, series: Series,             // Series carries title/year/genres/seasons meta
  mode: 'per-episode' | 'whole',
  seriesRating?, seriesComment?,  // whole mode
  episodes?: Record<`${season}:${episode}`, { rating, comment? }>,  // per-episode mode
  watchedAt
}
```

**D2. Averages are derived, never stored.** `seasonAverage(record, season)` = mean of rated episodes in that season; `seriesAverage(record)` = `seriesRating` in whole mode, the single season's average when there is one season, otherwise the mean of the per-season averages **of seasons with at least one rated episode**. Deriving on render keeps every summary consistent and makes edits and mode switches trivially correct. Alternative: cache averages on the record — rejected (risk of stale values).

**D3. Mode switch clears ratings.** Switching mode replaces the record's rating payload: whole→per-episode drops `seriesRating`/`seriesComment`, per-episode→whole drops `episodes`. The confirmation dialog gates the destructive reset, matching the spec.

**D4. Display preferences are `localStorage` keys, read the same way as theme.** `theme` (existing), `identity-display` (`name` | `tag` | `both`), `rail-collapsed` (`1`/`0`). A small shared helper reads/writes them and a client component applies them after mount (mirroring `ThemeSelect`'s pattern, including the SSR-safe default). This keeps the change presentation-only; moving preferences to the DB is the same deferred backend question as the unique tag.

**D5. Social feed is a derived view, not a new store.** Build it from `friends`/`otherUsers[].recent` for friend events and from synthesized per-group events; filter out `profileHidden` sources; include series records; sort by `watchedAt` descending. Rendering is a bounded-height vertical scroll container. Alternative: a persisted events table — out of scope for a `localStorage` prototype.

**D6. Groups gain a free-form `tags: string[]`.** `GroupCard` becomes a single link wrapping name, description, and tag badges, and stops rendering the stats `<dl>`; the group detail screen keeps its statistics. `searchGroups` matches `name`, `description`, and `tags`.

**D7. Navigation becomes seven sections / six tabs, with a collapsible rail.** Add a `series` section to `sections.ts` (below `films`, `inTabBar: true`); `NavLinks` gains an icon-only rendering for the collapsed rail where each item keeps an `aria-label`/`title`. Collapse state comes from the persisted preference; the toggle lives in the rail header beside the brand. Mobile keeps the bottom tab bar at six entries.

**D8. Top bar = identity + account menu only.** Remove `ThemeSwitcher` from `TopBar` (keep `ThemeSelect` in Settings). `AccountMenu` receives `name` and `tag` (handle) instead of `email`, renders them per the identity preference, and adds a "Выйти" item calling `signOut` (`next-auth/react`). The app layout passes name/tag from the current profile; for real users these would come from the user record.

**D9. Branding is static.** Set `metadata.title` and the brand text to "Смотровик", and add `src/app/icon.svg` (clapperboard mark) so Next.js emits the favicon/app icon. No runtime logic.

## Risks / Trade-offs

- [Spec base is behind in-flight changes] → Archive `search-via-filters` then `refine-search-and-my-films` before applying this change; validate deltas against the archived base.
- [Icon-only rail loses labels] → Every collapsed item keeps a visible-on-hover `title` and an `aria-label`; verify keyboard focus and 44px targets.
- [Series model duplicates film concepts] → Accept limited duplication for isolation; share only generic UI primitives (`Card`, `Badge`, `Modal`, `Input`, `Skeleton`).
- [Derived averages over partially rated seasons] → Fix the rule in D2 (only seasons with a rated episode contribute) and cover it with a unit test.
- [`localStorage` preferences are per-browser, not per-user] → Accepted for the prototype; flagged as the deferred backend question, not silently decided.
- [Synthetic group feed is not real data] → Mark it as mock in `data.ts`; the spec only requires the behavior, not a real event source.

## Migration Plan

Presentation-only; no database migration. Ship with the app; rollback by reverting the change. Apply ordering: archive `search-via-filters` → archive `refine-search-and-my-films` → this change.

## Open Questions

- Exact mock series catalog (titles, season/episode counts) — fill during implementation; does not affect specs or tasks.
- Feed scroll height and maximum number of entries shown before scrolling — a layout constant, safe to tune later.
- Collapsed-rail label mechanism (`title` vs `aria-label` + visual tooltip) — implementation detail within the accessibility requirement.
