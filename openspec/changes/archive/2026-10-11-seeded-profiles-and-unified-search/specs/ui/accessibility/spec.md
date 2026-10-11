## MODIFIED Requirements

### Requirement: Keyboard operation

All interactive flows SHALL be operable using only the keyboard, with a logical focus order. Any modal or sheet SHALL trap focus, keep focus on the control the user is operating for as long as they operate it, and close on Escape. Opening a modal SHALL move focus into it, and closing it SHALL return focus to the trigger.

#### Scenario: Operating without a pointer

- **WHEN** the user operates the interface with the keyboard alone
- **THEN** navigation, search, filters, rating entry, and form submission are all reachable in a logical order

#### Scenario: Modal focus handling

- **WHEN** a modal or sheet such as the rating form is open
- **THEN** focus is contained within it and pressing Escape closes it and returns focus to the trigger

#### Scenario: Focus stays while typing in a modal

- **WHEN** a modal is open and the user types into a field inside it
- **THEN** focus remains on that field and does not move to another control such as the close button as the field's value changes
