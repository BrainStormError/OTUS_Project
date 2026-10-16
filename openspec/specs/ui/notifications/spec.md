# ui/notifications Specification

## Purpose
Cross-screen toast notifications that give the user a clear, consistent signal of the outcome of an action (success or failure) without leaving the current screen.

## Requirements

### Requirement: Feedback for completed actions

Completing a mutating action SHALL surface its outcome as a toast notification, for both success and failure. Toasts SHALL be additive: form validation errors MUST remain associated with their field and MUST NOT be replaced by a toast.

#### Scenario: Successful action

- **WHEN** a mutating action completes successfully, such as saving a record, creating a discussion, posting a comment, sending or accepting a friend request, or changing a privacy setting
- **THEN** a success toast with a short message describing the outcome is shown

#### Scenario: Failed action

- **WHEN** a mutating action fails
- **THEN** an error toast with a short message describing the failure is shown

#### Scenario: Validation error stays inline

- **WHEN** a form field fails local validation before submission, such as an empty required title
- **THEN** the error is shown inline at the field and the toast mechanism is not the only place it appears

### Requirement: Toast content and tone

Each toast SHALL carry a short message and a tone distinguishing success from error. The tone SHALL NOT be conveyed by color alone.

#### Scenario: Success and error are distinguishable

- **WHEN** a success toast and an error toast are shown
- **THEN** each carries text that identifies it as a success or a failure, independent of its color

#### Scenario: Concise message

- **WHEN** any toast is shown
- **THEN** its message is a short statement of the outcome, not a raw error payload

### Requirement: Toast lifecycle

Toasts SHALL dismiss automatically after a short delay, SHALL be dismissible by the user, and SHALL pause their auto-dismiss while hovered or focused. Multiple concurrent toasts SHALL stack without overlapping.

#### Scenario: Auto-dismiss

- **WHEN** a toast is shown and the user does not interact with it
- **THEN** it disappears automatically after a short delay

#### Scenario: Manual dismiss

- **WHEN** the user activates the close control on a toast
- **THEN** that toast disappears immediately

#### Scenario: Paused while interacting

- **WHEN** the user hovers or focuses a toast
- **THEN** its auto-dismiss timer is paused until the pointer or focus leaves

#### Scenario: Multiple toasts stack

- **WHEN** several toasts are shown in quick succession
- **THEN** they are presented stacked in a single viewport region without overlapping each other

### Requirement: Toast accessibility

Toast notifications SHALL be announced to assistive technology through a live region and SHALL NOT move focus away from the control the user is operating.

#### Scenario: Announced to assistive technology

- **WHEN** a toast appears
- **THEN** its message is announced through a live region

#### Scenario: Focus is not stolen

- **WHEN** a toast appears while the user is operating a control
- **THEN** keyboard focus stays on that control and is not moved into the toast

### Requirement: Toast motion

Toast animations SHALL be limited to fade or slide within the 150–250 ms motion budget and SHALL honor the reduced-motion preference.

#### Scenario: Motion budget

- **WHEN** a toast enters or leaves
- **THEN** the transition is a fade or slide lasting between 150 ms and 250 ms

#### Scenario: Reduced motion

- **WHEN** the operating system signals a reduced-motion preference
- **THEN** toasts appear and disappear without an animation
