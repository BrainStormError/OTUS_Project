# ui/accessibility Specification

## Purpose
Defines the cross-cutting accessibility requirements — contrast, visible focus, keyboard operation, labeling, and touch targets — that apply to every screen in both themes.

## Requirements

### Requirement: Text and control contrast
Both themes SHALL provide sufficient contrast: normal text at least 4.5:1 against its background, and large text and interactive control boundaries at least 3:1.

#### Scenario: Normal text contrast
- **WHEN** any normal text is rendered in either theme
- **THEN** its contrast against the background is at least 4.5:1

#### Scenario: Large text and control contrast
- **WHEN** large text or an interactive control boundary is rendered in either theme
- **THEN** its contrast is at least 3:1

### Requirement: Visible focus
Every interactive element SHALL have a visible focus indicator with at least 3:1 contrast that is distinguishable in both themes.

#### Scenario: Keyboard focus visible
- **WHEN** an interactive element receives keyboard focus
- **THEN** a visible focus indicator is shown

### Requirement: Keyboard operation
All interactive flows SHALL be operable using only the keyboard, with a logical focus order, and any modal or sheet SHALL trap focus and close on Escape.

#### Scenario: Operating without a pointer
- **WHEN** the user operates the interface with the keyboard alone
- **THEN** navigation, search, filters, rating entry, and form submission are all reachable in a logical order

#### Scenario: Modal focus handling
- **WHEN** a modal or sheet such as the rating form is open
- **THEN** focus is contained within it and pressing Escape closes it and returns focus to the trigger

### Requirement: Accessible names and labels
Every control SHALL have an accessible name, icon-only controls SHALL carry a text alternative, and form errors SHALL be programmatically associated with their field.

#### Scenario: Icon-only control
- **WHEN** a control shows only an icon, such as the theme switch
- **THEN** it exposes an accessible name describing its action

#### Scenario: Field error association
- **WHEN** a form field is invalid
- **THEN** its error message is programmatically associated with that field

### Requirement: Touch targets and live feedback
Interactive targets SHALL be at least 44 by 44 pixels, and asynchronous result and error changes SHALL be announced to assistive technology.

#### Scenario: Minimum touch target
- **WHEN** any interactive control is rendered on a touch viewport
- **THEN** its target is at least 44 by 44 pixels

#### Scenario: Announced state changes
- **WHEN** a search completes or an error appears
- **THEN** the change is announced through a live region
