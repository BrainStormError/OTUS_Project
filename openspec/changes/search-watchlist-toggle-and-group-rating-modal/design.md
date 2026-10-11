## Context

See `proposal.md` — Why. The change touches two independent spots.

- `HomeView` renders title cards in two branches. The popular area passes the
  watch-later state (`planned`) and the toggle handler (`onTogglePlanned`); the
  search-results branch passes only the watched state and the
  watched-opens-form handler. `MovieCard` invokes
  `onTogglePlanned?.(!planned)`, so with no handler the button is inert.
- The group media picker lives in `GroupRatings` and is rendered through the
  shared `Modal`, which defaults to the narrow (`sm:max-w-md`) size. The My
  Films / My Series add dialog (`AddRecordModal`) already opts into
  `size="wide"`.

## Goals / Non-Goals

**Goals:**
- Search-result cards expose the same working watch-later action as popular cards.
- The group-ratings media picker presents its search field, filters, and result list without cramping.

**Non-Goals:**
- Changing watch-later semantics (mutual exclusivity with watched, persistence).
- Resizing dialogs other than the group media picker.
- Introducing new dialog size tokens or new card state.

## Decisions

### D1. Reuse the existing watch-later state and handler in the results branch

`HomeView` already derives `plannedIds` and defines `togglePlanned` for the
popular area. The results branch passes the same `planned` prop and
`onTogglePlanned` handler, so both branches render the identical, functional
card. Alternative: give `MovieCard` its own data access — rejected; the card is
presentational and stays handler-driven, and duplicating state would risk the
two branches diverging again.

### D2. Use the existing wide dialog size for the group media picker

The shared `Modal` already exposes `size="wide"`. The "Выбор медиа" dialog sets
that size, mirroring `AddRecordModal`. Alternatives: a new size token or a
custom `className` width — rejected; the existing wide size is what the other
catalog add dialog uses, and consistency matters more than a bespoke width. The
rating-form dialog that follows the picker keeps the default size; only the
picker changes.

## Risks / Trade-offs

- [The two card branches could drift apart again] → the spec now requires the
  card's actions to be functional in every context, and a component test covers
  the search-result branch specifically.
- [The wider dialog may feel large on desktop] → consistent with the existing
  add dialog and still bounded by `max-h-[90vh]` and the viewport width.

No migration or deploy ordering is involved.
