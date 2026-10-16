## Why

The tracker only knows one personal state per title: rated means watched. Users have no way to note a title they intend to watch without rating it first, and nothing marks a title as "planned" versus "seen". A private watch-later list closes that gap and feeds straight into watching: rating a planned title moves it out of the list and into the user's watched titles.

## What Changes

- New private, per-account "Буду смотреть" (watch-later) list of films and series. It is never shown to other users, and no activity-feed event is emitted for it.
- Watch-later membership is added from the title card on Home and from the film/series detail page, alongside "Отметить просмотренным".
- My Films and My Series each gain a "Буду смотреть" tab, listing the user's planned films or series (filterable like the watched list) with per-row **Оценить** and **Удалить** actions.
- Entries can be removed from the list manually without rating.
- A title cannot be both watched and planned: saving any personal rating removes that title from the watch-later list, and adding an already-watched title to the list is rejected.
- **BREAKING** (spec-level): the catalog rule changes from "a title enters the local catalog only when rated" to "when rated **or** added to the watch-later list", so planned titles have normalized media metadata.
- The buttons "Буду смотреть" and "Отметить просмотренным" SHALL stay within their container and wrap/shrink without overflowing on cards and detail pages.

## Capabilities

### New Capabilities
- `watchlist`: the private per-account watch-later list — its membership, manual removal, mutual exclusivity with watched, and the rule that rating a planned title moves it into the watched records.

### Modified Capabilities
- `data-model`: add the watch-later storage entity (numeric id, foreign keys to user and media, one entry per user and media), and record that media metadata may be created for a planned title.
- `catalog`: the "Catalog stores only rated titles" requirement is extended to include titles added to the watch-later list.
- `ui/screens`: the film card and title detail page gain a watch-later action next to the watched action; My Films and My Series gain a "Буду смотреть" tab with its columns and actions; the buttons shall not overflow their container.

## Impact

- Database: new migration for a `watchlist` table with a unique `(user_id, media_id)` constraint and foreign keys.
- New module `watchlist` (schema/service/repository/types) and API routes under `/api/watchlist`.
- `records` module: saving a personal rating additionally deletes the matching watch-later entry inside the same transaction.
- `catalog`: `media` rows may now be created for watch-later additions via the existing save-metadata enrichment.
- UI: `MovieCard`, `FilmDetail`, `MyFilmsView`, `MySeriesView` (tabs), a new watch-later list view, a watch-later client store, and the `/films` and `/series` pages passing the watch-later data.
- Profile, navigation primary sections, and group behavior are unchanged.
