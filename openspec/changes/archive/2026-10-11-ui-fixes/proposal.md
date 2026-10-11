## Why

Walking the running app surfaced concrete interface defects: the search fields do not share one label/height rhythm, table corners render square because `border-collapse` ignores the outer radius, button sizes and paddings drift between screens, the year filter is a pick-from-list control, the genre dropdown never closes, and friend requests are buried in a flat page. These break the "shared component inventory" promise and make the UI feel unfinished.

## What Changes

- Align the search filter panel so the title, genre, and year controls share one label and height rhythm, and stack to a single column on narrow viewports.
- Turn the year filter into an incrementable numeric value (a spinbutton with − / + controls) instead of a pick-from-list control.
- Fix genre multi-select: a controllable dropdown that opens/closes predictably (outside click, Escape, after a selection), shows a clear selected state, and is not clipped inside the add-record modal.
- Give data tables rounded, non-clipped corners so header angles are no longer sharp.
- Unify button and control geometry so heights, paddings, and gaps are consistent across default/small/icon usages.
- Move friend requests into their own tab inside Friends (search / requests / friends), reusing the existing tab pattern.

## Capabilities

### New Capabilities
<!-- none: these are corrections to existing screens and the shared design foundation -->

### Modified Capabilities
- `ui/screens`: the search-panel requirement changes (year as an incrementable numeric value, predictable genre dropdown) and the friends-section requirement changes (requests presented in a dedicated tab).
- `ui/design-system`: adds a requirement for consistent shared control and surface geometry (field alignment, uniform control/button sizing, rounded non-clipped tables), which the current design-system specs do not cover.

## Impact

- Shared UI: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/card.tsx`.
- Screens/features: `src/components/features/movie-tracker/SearchField.tsx`, `FilterChips.tsx`, `MyFilmsView.tsx`, `MySeriesView.tsx`, `FriendsView.tsx`, plus a reusable tab control (pattern from `GroupTabs.tsx`).
- No API, database, or dependency changes.
