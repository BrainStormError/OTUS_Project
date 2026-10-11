## Why

A member who rates a film in a group usually also wants it in their personal My Films or
My Series list, but today the group rating and the personal rating are saved through two
independent forms. To record both the member must rate the media twice, entering the same
values by hand. This change lets them save both at once, while keeping the two records
independent: removing a media from a group's ratings never touches a member's personal list.

## What Changes

- Add an optional checkbox to the group rating form — "также добавить в мои фильмы/сериалы"
  (wording follows the media kind) — present both when starting a rating and when editing one.
- When the checkbox is set, the group rating and the member's personal rating SHALL be saved
  together in a single operation, using the same rating, comment, and watch date.
- When the checkbox is set but the member already has a personal rating for that media, the
  save SHALL be refused with a conflict and nothing SHALL be written. The form SHALL then ask
  for confirmation that the existing personal rating will be overwritten; on confirmation the
  save is retried and both records are written, on dismissal the checkbox is cleared and
  nothing is saved.
- Saving a personal rating this way SHALL behave like the My Films/My Series save, including
  removing the media from the member's watchlist if it was there.
- Deleting a media entry from the group SHALL NOT affect members' personal ratings.

## Capabilities

### New Capabilities
<!-- None: this extends existing rating behavior. -->

### Modified Capabilities

- `groups/ratings`: a member's group rating save may also create or update the member's
  personal rating for the same media, atomically, and refuses to overwrite an existing
  personal rating without explicit confirmation.
- `ui/screens`: the group rating form gains the "also add to my films/series" checkbox and
  the overwrite-confirmation dialog.

## Impact

- **Groups module**: `saveGroupRating` runs the optional personal-rating upsert and watchlist
  removal inside its existing transaction and accepts an overwrite confirmation flag.
- **Ratings module**: reuses the personal-rating upsert and a "personal rating exists" lookup.
- **API**: `POST /api/groups/:id/ratings` accepts `alsoPersonal` and `confirmOverwrite`, and
  returns a conflict when a personal rating exists and overwriting was not confirmed.
- **UI**: `RatingForm` gains an optional controlled checkbox; `GroupRatings` wires it and the
  confirmation dialog.
- **No schema change**: `ratings` already distinguishes personal (`group_id IS NULL`) and
  group rows, and the unique indexes already enforce one row each.
