# ui/time-preferences Specification

## Purpose
Lets the user control how moments in time are displayed across the interface — the timezone and the 12/24-hour clock — defaulting to the browser timezone, and applies one consistent timestamp format everywhere a moment in time is shown.

## Requirements

### Requirement: Timezone preference

The interface SHALL display moments in time in a user-selectable timezone. By default the timezone SHALL be the browser's timezone. The user SHALL be able to change it manually in the settings, and the choice SHALL persist locally on the device so it is applied again after a reload.

#### Scenario: Default from the browser

- **WHEN** the user has never changed the timezone and opens any screen showing a moment in time
- **THEN** the moment is displayed in the browser's timezone

#### Scenario: Manual change

- **WHEN** the user selects a different timezone in the settings
- **THEN** every moment in time shown afterwards is displayed in the selected timezone

#### Scenario: Persists across reload

- **WHEN** the user has selected a timezone and later reloads the application
- **THEN** the selected timezone is applied again without the user re-selecting it

#### Scenario: Unavailable timezone falls back

- **WHEN** a stored timezone value is no longer available in the environment
- **THEN** the interface falls back to the browser timezone rather than failing to render the timestamp

### Requirement: Hour cycle preference

Timestamps SHALL use a 24-hour clock by default, and the user SHALL be able to switch to a 12-hour clock in the settings. The choice SHALL persist locally on the device.

#### Scenario: 24-hour default

- **WHEN** the user has never changed the clock format
- **THEN** timestamps are shown in 24-hour form

#### Scenario: Switch to 12-hour

- **WHEN** the user selects the 12-hour form in the settings
- **THEN** timestamps are shown with a 1–12 hour and a day-period marker instead of the 24-hour hour

#### Scenario: Clock format persists

- **WHEN** the user changes the clock format and later reloads the application
- **THEN** the chosen clock format is applied again

### Requirement: Consistent timestamp format

Every displayed moment in time SHALL use one format: hours and minutes, then the date, as `14:07 11.10.26` in the 24-hour form and the equivalent 12-hour form when that is selected. The same format SHALL be used wherever a moment in time appears. Date-only values, such as a watch date, SHALL remain dates without a time and SHALL NOT be shifted by the timezone.

#### Scenario: Timestamp format

- **WHEN** a moment in time is displayed in the 24-hour form
- **THEN** it is rendered as `HH:mm DD.MM.YY`, for example `14:07 11.10.26`

#### Scenario: Timestamp format in 12-hour form

- **WHEN** a moment in time is displayed in the 12-hour form
- **THEN** it is rendered with the 12-hour hour and day-period marker in place of the 24-hour hour, keeping the same date part

#### Scenario: Same format everywhere

- **WHEN** moments in time are displayed on different screens, such as discussion comments and activity entries
- **THEN** they all use the same format

#### Scenario: Date-only value is not shifted

- **WHEN** a date-only value such as a watch date is displayed
- **THEN** it is shown as a date without a time and is not converted between timezones

### Requirement: Time display controls in settings

The settings SHALL provide controls to select the timezone and to choose the 24-hour or 12-hour clock.

#### Scenario: Controls available

- **WHEN** the user opens the settings
- **THEN** a timezone selector and a 12/24-hour choice are available and reflect the current selection

#### Scenario: Choice applies immediately

- **WHEN** the user changes the timezone or the clock format in the settings
- **THEN** timestamps reflect the new choice without requiring a full restart of the application
