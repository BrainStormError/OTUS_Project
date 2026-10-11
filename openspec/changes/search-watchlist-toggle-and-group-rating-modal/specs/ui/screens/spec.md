## ADDED Requirements

### Requirement: Card actions work in every context

Every action a title card offers SHALL perform its function wherever the card is rendered — the popular area on Home, Home search results, and any other list — so the same card does not present an inert control in one context while the action works in another. In particular, on a card shown among Home search results, the watch-later ("Буду смотреть") action SHALL add the title to, or remove it from, the viewer's watch-later list exactly as it does on a card in the popular area, and the card SHALL reflect the title's current watched and watch-later state.

#### Scenario: Watch-later works on a search-result card

- **WHEN** the user activates the "Буду смотреть" action on a card shown among Home search results for a title that is neither watched nor on the watch-later list
- **THEN** the title is added to the watch-later list and the action shows its active state

#### Scenario: Watch-later toggles off on a search-result card

- **WHEN** the user activates the "Буду смотреть" action on a Home search-result card whose title is already on the watch-later list
- **THEN** the title is removed from the watch-later list and the action returns to its inactive state

#### Scenario: State is consistent between the popular area and search results

- **WHEN** a title that is on the watch-later list is shown both in the popular area and among search results
- **THEN** its card shows the active watch-later state in both places
