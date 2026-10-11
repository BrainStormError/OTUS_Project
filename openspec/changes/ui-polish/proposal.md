## Why

Walking the app surfaced six interface problems that no existing change covers: the year filter chip cannot be removed by its ✕, the year filter starts from the dataset's newest year instead of the current year and cannot reach it, the add-record dialog is too narrow for its content, the layout is not verified across viewport sizes, the sidebar and bottom bar share the card surface so they do not separate visually, and panels and dropdowns appear and disappear with no transition.

## What Changes

- Fix the active-filter chip removal so every chip (not only genre) is actually removed when its ✕ is activated; the year chip is a no-op today.
- Change the year filter: it starts unset (empty means "all years"), is not clamped to the years in the data, and the first increment or decrement selects the current calendar year; later steps move by one.
- Widen the add-record dialog so its catalog results and filters fit, while every dialog still fits the viewport.
- Make content adaptive from narrow mobile to desktop: wide/tabular content scrolls horizontally instead of being clipped.
- Give the sidebar rail and the bottom tab bar the theme's brand accent surface (Signal Blue in light, Coral Pulse in dark), keeping the active navigation item distinguishable with a contrast fill.
- Animate panel, dropdown, and dialog reveal/collapse within the existing motion budget, extending the motion rule to permit a panel expand/collapse transition.

## Capabilities

### New Capabilities
<!-- None: these are corrections to existing screens and the shared design foundation. -->

### Modified Capabilities
- `ui/screens`: the "Search with filters" requirement changes — the year filter starts unset, selects the current year on first step, and is not clamped to the data.
- `ui/design-system`: the "Allowed motion only" requirement is extended to allow panel expand/collapse and dropdown open/close; new requirements are added for a brand-accent navigation-shell surface and for adaptive layout and dialog sizing.

## Impact

- Filter UI: `src/components/features/movie-tracker/SearchField.tsx`, `FilterChips.tsx`.
- Dialogs: `src/components/ui/modal.tsx`, `AddRecordModal.tsx`.
- Tables/layout: `MyFilmsView.tsx`, `MySeriesView.tsx`.
- Shell: `src/components/layout/sidebar-rail.tsx`, `mobile-tab-bar.tsx`, `nav-links.tsx`.
- Tokens/motion: `src/app/globals.css`.
- Ordering note: `ui-fixes` also modifies the `ui/screens` "Search with filters" requirement and is not yet archived; this change builds on that revision, so `ui-fixes` should be archived first.
- No API, database, or dependency changes.
