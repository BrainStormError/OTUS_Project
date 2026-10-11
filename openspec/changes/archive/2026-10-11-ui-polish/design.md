## Context

See `proposal.md` for motivation. Current state that shapes the approach:

- Filter chips: `FilterChips` calls `onRemove(key, value)` per chip; `SearchField.removeFilter` only clears when the value is `undefined`, otherwise it acts only for `key === 'genre'`, so the year chip is a no-op. Title passes `undefined` and works; genre works; year does not.
- Year filter: `YearFilter.step` uses `hasBounds ? max : currentYear` as the base and clamps to `[min, max]` of the available years, so it cannot leave the dataset range.
- Dialog: `Modal` is fixed at `sm:max-w-md` (28rem) and exposes a `className` override; the add dialog (`AddRecordModal`) and the rating dialog (`RecordModal`) both use that default.
- Tables: `MyFilmsView`/`MySeriesView` wrap the table in an `overflow-hidden` rounded container, so wide columns clip on narrow viewports.
- Shell: `sidebar-rail` and `mobile-tab-bar` use `bg-brand` (light `#ffffff`, dark `#07080a`) — the same value family as cards — and `nav-links` marks the active item with `bg-secondary`. Motion tokens exist in `globals.css` (`--dur*`, `--ease`, `animate-fade`, `animate-slide`, `transition-hover`) and a global `prefers-reduced-motion` block zeroes durations.
- Ordering: `ui-fixes` is complete but not archived and its delta also rewrites the `ui/screens` "Search with filters" requirement; this change's delta is written against that revision.

## Goals / Non-Goals

**Goals:**
- Correct filter removal and year-filter start/step behavior.
- Make the shell visually separated and the content adaptive on small screens.
- Add motion to panels, dropdowns, and dialogs without exceeding the motion budget.

**Non-Goals:**
- New screens, sections, APIs, or data changes.
- Redesigning the rating dialog's width or the account-menu interaction model.
- Changing the theme palettes themselves (that stays with `dual-theme-calendly-raycast`).

## Decisions

### D1: Generalize chip removal in `removeFilter`
Handle any filter key: when a value is provided and the key is not `genre`, clear that key; keep the genre list-removal branch. Alternative (make every single-value chip pass `undefined`) was rejected — it hides the intent and leaves the genre edge case unguarded.

### D2: Year filter starts unset and is not clamped to the data
`step` uses the current calendar year as the base when the filter is empty, and only bounds the result by the absolute search range (1800–2200, matching `catalogSearchQuery`), not by `min`/`max` of the available years.
- Alternative: keep the dataset clamp (rejected — with a dataset max below the current year the current year is unreachable, which is the reported defect).

### D3: Size the dialog by role, not globally
Add an explicit wide size to `Modal` (or pass the width via `className`) and use it only for the catalog add dialog (`sm:max-w-2xl`); keep the rating dialog at the default and keep `max-h-[90vh]` with internal scroll.
- Alternative: widen every dialog (rejected — the rating form is intentionally small).

### D4: Scroll wide content instead of clipping
Replace `overflow-hidden` with `overflow-x-auto` on the table wrappers (keeping the rounded border), and verify the shell and screens at 320 / 768 / 1280 px.
- Alternative: collapse table columns / stack rows on mobile (rejected — more surface change than needed; horizontal scroll preserves the table contract).

### D5: The shell uses the theme's brand accent, with a contrast active fill
Point the rail/tab-bar surface to the theme's brand accent through the shell tokens (light Signal Blue `#006bff`, dark Coral Pulse `#ff6363`), and introduce a shell-foreground plus a rail-active surface token (light: Paper white fill with Ink Navy text, dark: Ink `#07080a` fill with Pure White text) so the current item still reads as selected on the saturated background; apply the same surface to the bottom tab bar for consistency. Inactive items use the shell foreground at full contrast.
- Alternative: use the neutral second surface (light Pebble `#F0F3F8`, dark Obsidian `#111214`) (rejected — too close to the card surface, so in light theme the shell did not separate from the content).
- Alternative: keep `bg-secondary` for the active item (rejected — on a saturated shell the active state would be invisible).

### D6: Reveal/collapse motion within the existing budget
Use the existing duration/ease tokens for a rail width transition, a fade/slide reveal for dropdowns, and the existing dialog `animate-slide`; rely on the global reduced-motion block to disable it. The `ui/design-system` motion requirement is extended (this change's delta) to permit a panel expand/collapse.
- Alternative: no motion (rejected — the reported gap); a JS-animated height for the `<details>` account menu (deferred — open-state animation only, to avoid replacing the element).

## Risks / Trade-offs

- [`ui-fixes` not archived and both changes edit "Search with filters"] -> this delta is based on the `ui-fixes` revision; archive `ui-fixes` before archiving `ui-polish` so the merge order is correct.
- [Text/icons on the saturated brand shell lose contrast] -> inactive items use the shell foreground (measured 4.62:1 in light, 7.01:1 in dark) and the active fill keeps 12.62:1 / 20.04:1; re-check whenever the shell tokens change.
- [Rail width transition could look heavy] -> keep it within 250 ms and disable under reduced motion.
- [`<details>` account menu cannot animate its close] -> animate the open reveal only; behavior is unchanged.
- [Horizontal scroll can hide the rounded corners] -> keep the rounded, clipped border container around the scroll area.

## Migration Plan

Pure visual/behavioral change: no schema or data migration. Ship normally, then verify at 320 / 768 / 1280 px in both themes and confirm the year filter and chip removal behave. Rollback is the standard previous-image path.

## Open Questions

- None that change the approach; the account-menu close animation is an implementation detail left to apply.
