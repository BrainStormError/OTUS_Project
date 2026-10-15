## ADDED Requirements

### Requirement: Personal lists reflect mutations without a manual reload

After a successful mutation of the signed-in user's watched records or watch-later list — saving, editing, or deleting a record, and adding or removing a watch-later title — the affected sections SHALL reflect the change without a manual page reload. The section where the mutation was made SHALL reflect it immediately, and every other affected section SHALL reflect it on its next visit. A mutation that fails SHALL NOT remain visible as if it had succeeded.

#### Scenario: Record saved on Home appears in My Films
- **WHEN** the user saves a watched record for a title on Home and then opens My Films, including when the watched list was previously empty
- **THEN** My Films shows the saved record without a manual page reload

#### Scenario: Saved record appears regardless of navigation order
- **WHEN** the user saves a watched record on Home and opens My Films either before or after the save request completes
- **THEN** My Films eventually shows the saved record without a manual page reload, and never keeps an outdated empty list

#### Scenario: Deleted record disappears on the next visit
- **WHEN** the user deletes a watched record and then opens the section that listed it
- **THEN** the deleted record is absent without a manual page reload

#### Scenario: Watch-later change is reflected
- **WHEN** the user adds or removes a watch-later title in one section and then opens the watch-later list in My Films or My Series
- **THEN** the list reflects the addition or removal without a manual page reload

#### Scenario: Failed mutation leaves no visible record
- **WHEN** saving or deleting a watched record or a watch-later title fails
- **THEN** the failed change is not left visible as if it had succeeded, and the user is informed of the failure

#### Scenario: Cross-section value is consistent
- **WHEN** a watched record or watch-later title is saved in one section and viewed in another
- **THEN** both sections present the same rating, comment, watch date, and watch-later state
