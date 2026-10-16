## ADDED Requirements

### Requirement: Watch date not in the future

The rating and comment form SHALL NOT accept a watch date later than the current day, where the current day SHALL be determined in the user's selected time zone. The date control SHALL offer the current day and earlier dates and SHALL NOT offer future dates, and a watch date later than the current day SHALL be rejected with a validation message without saving the record.

#### Scenario: Future dates are not offered

- **WHEN** the user opens the watch-date control
- **THEN** dates after the current day are not selectable, while the current day and earlier dates are

#### Scenario: Future date rejected on submit

- **WHEN** the user submits a watch date later than the current day in the user's time zone
- **THEN** the form shows a validation message and does not save the record

#### Scenario: Current day and earlier accepted

- **WHEN** the user provides a watch date equal to or earlier than the current day
- **THEN** the form accepts it and the record is saved with that date

#### Scenario: Current day follows the user's time zone

- **WHEN** the user's selected time zone makes their local date differ from the UTC date
- **THEN** the latest accepted watch date is the user's local current day, not the UTC day

### Requirement: Expanded record stays within the table row

In My Films and My Series, an expanded record's comment and its actions SHALL stay within the bounds of the table at any viewport width: a long comment SHALL wrap instead of widening the table or overflowing the row, and the actions SHALL move below the comment when there is not enough horizontal space.

#### Scenario: Long comment wraps

- **WHEN** a record with a long comment is expanded
- **THEN** the comment wraps inside the expanded row and does not extend past the table's right edge

#### Scenario: Actions stay inside the row on narrow viewports

- **WHEN** the viewport is narrow and a record is expanded
- **THEN** the edit and delete actions remain within the row, moving below the comment when needed

### Requirement: Table column hover highlight

In My Films and My Series, hovering a cell SHALL highlight the entire column that contains it, including that column's header, while the existing row hover highlight SHALL remain.

#### Scenario: Hovered column is highlighted

- **WHEN** the pointer rests over a cell in a column
- **THEN** that column's cells and its header are highlighted

#### Scenario: Row highlight is preserved

- **WHEN** the pointer rests over a record's row
- **THEN** the row is highlighted, as before

#### Scenario: Highlight clears on leaving the table

- **WHEN** the pointer leaves the table
- **THEN** the column highlight is removed
