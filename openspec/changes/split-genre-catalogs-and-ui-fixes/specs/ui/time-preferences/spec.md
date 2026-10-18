## MODIFIED Requirements

### Requirement: Time display controls in settings

The settings SHALL provide a control to choose the 24-hour or 12-hour clock. The settings SHALL NOT provide a timezone control.

#### Scenario: Controls available

- **WHEN** the user opens the settings
- **THEN** a 12/24-hour choice is available and reflects the current selection, and no timezone selector is present

#### Scenario: Choice applies immediately

- **WHEN** the user changes the clock format in the settings
- **THEN** timestamps reflect the new choice without requiring a full restart of the application

## REMOVED Requirements

### Requirement: Timezone preference

**Reason**: The manual timezone selection is removed; moments in time are always displayed in the browser's timezone, so there is no preference left to select or persist.

**Migration**: No user action needed. A timezone value stored by an earlier version is ignored; the browser's timezone is used.

## ADDED Requirements

### Requirement: Browser timezone

Moments in time SHALL be displayed in the browser's timezone. The interface SHALL NOT offer a way to select a different timezone and SHALL NOT store a timezone preference.

#### Scenario: Browser timezone used

- **WHEN** the user opens any screen showing a moment in time
- **THEN** the moment is displayed in the browser's timezone

#### Scenario: No timezone selection

- **WHEN** the user opens the settings
- **THEN** no timezone selector is present

#### Scenario: Previously stored timezone is ignored

- **WHEN** the browser holds a timezone value saved by an earlier version of the interface
- **THEN** the value is ignored and moments in time are displayed in the browser's timezone

#### Scenario: Unavailable timezone falls back

- **WHEN** the environment's timezone cannot be resolved
- **THEN** the interface falls back to UTC rather than failing to render the timestamp
