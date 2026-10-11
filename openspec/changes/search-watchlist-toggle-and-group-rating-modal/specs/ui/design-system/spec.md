## MODIFIED Requirements

### Requirement: Dialog sizing
Dialogs SHALL stay within the viewport, and every catalog add dialog — the add dialog for My Films and My Series and the media picker an admin opens to add a group rating — SHALL be wide enough to present its search field, filters, and result list together without being cramped.

#### Scenario: Add dialog fits its content
- **WHEN** a catalog add dialog is open
- **THEN** its search field, filters, and result list are presented together without being cramped

#### Scenario: Group-ratings add dialog fits its content
- **WHEN** an admin opens the media picker to add a group rating, with its search field, filters, and result list shown
- **THEN** they are presented together without being cramped

#### Scenario: Dialog fits the viewport
- **WHEN** any dialog is opened on a narrow viewport
- **THEN** it stays within the viewport and its content remains scrollable
