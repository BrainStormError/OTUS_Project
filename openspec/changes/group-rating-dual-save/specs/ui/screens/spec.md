## ADDED Requirements

### Requirement: Group rating form also adds to the personal list

The group rating form SHALL present an optional checkbox labelled to add the media to the
member's personal list — "также добавить в мои фильмы" for a film and "также добавить в мои
сериалы" for a series. The checkbox SHALL be unchecked by default and SHALL be present both
when a rating is added and when an existing rating is edited. When the member has an existing
personal rating for that media and the checkbox is set, submitting SHALL present a confirmation
dialog stating that the personal rating will be overwritten; confirming proceeds with the save
and dismissing clears the checkbox without saving.

#### Scenario: Checkbox shown when adding a rating

- **WHEN** a member opens the group rating form to add a rating
- **THEN** the "add to my films/series" checkbox is shown, unchecked

#### Scenario: Checkbox shown when editing a rating

- **WHEN** a member opens the group rating form to edit their existing rating
- **THEN** the same checkbox is shown

#### Scenario: Overwrite confirmation shown

- **WHEN** the member has an existing personal rating for the media and submits with the checkbox set
- **THEN** a confirmation dialog states that the personal rating will be overwritten

#### Scenario: Dismissing clears the checkbox

- **WHEN** the member dismisses the overwrite confirmation
- **THEN** the checkbox is cleared and nothing is saved
