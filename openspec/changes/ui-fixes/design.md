## Context

See proposal.md. The relevant current state: `SearchField` (shared by Home, My Films, My Series, and the add-record modal) renders the title/year fields as `label`-wrapped controls but the genre control as a native `<details>` whose summary carries the text "Жанр" instead of a label; the year control is a native `<select>`; tables in `MyFilmsView`/`MySeriesView` use `border-collapse` with `rounded-lg` and `overflow-hidden`; `button.tsx` mixes `h-11`/`h-12` and `px-3`/`px-4`; `FriendsView` stacks four sections. The project is dependency-shy (only Radix `slot`) and hand-rolls its own `Modal`.

## Goals / Non-Goals

**Goals:**
- One predictable genre multi-select that behaves like a real dropdown.
- Year as an incrementable numeric value.
- Aligned, consistently sized controls and buttons.
- Rounded, non-clipped tables.
- Friend requests in their own tab.

**Non-Goals:**
- Adding actor/director filters (a pre-existing gap in `ui/screens`; out of scope here).
- New runtime dependencies.
- Any API, schema, or persistence change.

## Decisions

- **Genre dropdown: controlled component, no new dependency.** Replace the `<details>` genre control with a small controlled dropdown (trigger button styled like the other fields + an absolutely positioned option list) that closes on value selection, outside click, and Escape, and marks selected options with a checked state. Alternative considered: keep `<details>` and bolt on an outside-click handler — rejected because `<details>` still cannot close on selection or Escape cleanly, and the trigger cannot report an open/selected state for styling. Alternative considered: add `@radix-ui/react-popover` — deferred to keep the dependency set unchanged; the existing `Modal` shows the project already accepts hand-rolled primitives.
- **Year filter: numeric input with − / + steppers.** Use a numeric field with explicit decrement/increment buttons (step of 1) plus a clear/empty state. The filter value stays a string; stepping from an empty value seeds from the most recent year available for the current view (falling back to the current year). Rationale: the requirement is "increasable/decreasable value", and exact-year matching already exists in `movieMatches`, so no matching change is needed.
- **Field alignment: label every control the same way.** Give the genre control the same top label as the title and year fields and keep one control height (44px, matching the 44px touch-target requirement) so all three share a rhythm; the grid keeps a single row on wide viewports and one column on narrow ones.
- **Table corners: wrapper clip, table without its own border/radius.** Wrap each table in a `rounded-lg overflow-hidden border` container and remove `border-collapse`-dependent rounding from the table itself (or use `border-separate border-spacing-0`). Rationale: with `border-collapse` the browser ignores the outer radius, which is the observed defect.
- **Button geometry: one height, symmetric padding per size.** Normalize `button.tsx` so all sizes share `h-11` (keeps the 44px target) and differ only in horizontal padding/width; keep `icon` square. Rationale: removes the height drift while preserving the accessibility floor.
- **Friends tabs: local-state tabs reusing the group pattern.** Add a tab control (search / requests / friends) inside `FriendsView`, mirroring the visual language of `GroupTabs`, with the pending incoming count shown on the requests tab. Rationale: consistent with the existing group tabs without introducing routing.

## Risks / Trade-offs

- [Existing tests target the `details`-based genre control] → Update/verify the relevant unit and e2e tests after the swap; keep `data-testid="filter-chips"` and filter block ids stable.
- [Numeric year input can be cleared or set out of range] → Treat empty as "no year filter"; clamp step control to sensible bounds derived from available options.
- [Removing `border-collapse` can shift cell borders] → Use `border-separate border-spacing-0` or move dividers to `divide-y` on rows so the visible grid does not change.
- [Tabbed Friends hides content that was previously all visible] → Keep the pending count visible on the requests tab so nothing is silently buried.
