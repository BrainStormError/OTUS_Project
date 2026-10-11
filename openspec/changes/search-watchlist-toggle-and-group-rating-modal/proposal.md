## Why

Two user-visible defects make parts of the UI inert or cramped. On Home, after a
search, the "Буду смотреть" (watch-later) action on each result card does
nothing, so the card offers a control that silently fails; elsewhere the very
same action works. In groups, the dialog an admin opens to add a rating
("Добавить оценку" → media picker) renders at the narrow default width, so its
search field, filters, and result list are cramped together.

## What Changes

- Title-card actions work wherever the card is rendered: the "Буду смотреть"
  action on Home search results behaves exactly as it does in the popular area
  (currently the result cards are rendered without the watch-later state and
  handler, so the button is inert).
- The catalog add dialog opened from group ratings is presented at the wide
  size, matching the My Films / My Series add dialog, so its search field,
  filters, and result list are shown together without being cramped.

## Capabilities

### New Capabilities
<!-- None: both fixes adjust behavior of existing screens and the shared dialog. -->

### Modified Capabilities

- `ui/screens`: add a requirement that the title card's actions (watched and
  watch-later) are functional and consistent in every context the card is shown,
  including Home search results, not only the popular area.
- `ui/design-system`: extend the "Dialog sizing" requirement so every catalog
  add dialog — including the group-ratings media picker — is wide enough to
  present its search field, filters, and result list without being cramped.

## Impact

- **Code:** `src/components/features/movie-tracker/HomeView.tsx` (pass the
  watch-later state and toggle handler to the search-result cards) and
  `src/components/features/movie-tracker/GroupRatings.tsx` (use the wide dialog
  size for the "Выбор медиа" picker).
- **No API, database, dependency, or migration changes.**
- **Tests:** a component check that the watch-later action on a search-result
  card toggles the list, plus the design-system dialog-sizing behavior.
