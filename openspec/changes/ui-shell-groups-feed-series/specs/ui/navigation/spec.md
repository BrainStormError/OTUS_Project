## MODIFIED Requirements

### Requirement: Primary sections
The application SHALL expose seven primary sections: Home/Search, My Films, My Series, Profile, Friends, Groups, and Settings. My Series SHALL appear directly below My Films in the navigation.

#### Scenario: Sections reachable from the shell
- **WHEN** the user is on any screen
- **THEN** all seven primary sections are reachable from the navigation shell

#### Scenario: My Series sits below My Films
- **WHEN** the user views the navigation
- **THEN** the My Series entry appears directly below the My Films entry

### Requirement: Navigation depth limit
Every key screen SHALL be reachable from Home in at most three navigation transitions.

Key screens include film results, film card, the rating and comment form, a series card, its season and episode levels, the series rating form, a profile, another user's profile, statistics, friend requests, a group card, the group admin panel, and privacy settings.

#### Scenario: Key screen within depth budget
- **WHEN** a user navigates from Home to any key screen
- **THEN** the number of transitions is three or fewer

#### Scenario: Settings are near
- **WHEN** the user is on any primary section
- **THEN** Settings is reachable in at most two transitions

### Requirement: Responsive navigation shell
The shell SHALL present the same sections on desktop and mobile and SHALL require equivalent effort to navigate on both. The top bar SHALL NOT provide a global search field or a theme switch; search is provided per section (see the "Tab-local search" requirement) and the theme is selected only in Settings (see "Settings screen").

#### Scenario: Desktop shell
- **WHEN** the application is viewed on a desktop viewport
- **THEN** a collapsible sidebar rail lists the primary sections and a top bar provides the account menu and the identity, without a global search field and without a theme switch

#### Scenario: Mobile shell
- **WHEN** the application is viewed on a mobile viewport
- **THEN** a six-tab bottom tab bar exposes the primary sections and a top bar provides the account menu, with Settings reachable from the account menu or Profile, and without a global search field and without a theme switch

### Requirement: Tab-local search
Search SHALL be provided on the Home, My Films, My Series, Friends, and Groups sections, each operating on that section's own content, and SHALL NOT be provided as a global field in the top bar. On Home, My Films, and My Series, search SHALL be performed through the section's always-visible filter panel rather than a separate free-text search field; on Home it SHALL apply only when the user activates the "Найти" action, while on My Films and My Series it SHALL apply live as filter values change. Home search SHALL cover both films and series.

#### Scenario: Search present on the searchable sections
- **WHEN** the user opens Home, My Films, My Series, Friends, or Groups
- **THEN** a search control is present on that section

#### Scenario: Filter-panel search on Home and My Films
- **WHEN** the user opens Home or My Films
- **THEN** search is available through an always-expanded filter panel and no separate free-text search field is present

#### Scenario: Home applies search on submit
- **WHEN** the user changes filter values on Home
- **THEN** results update only after the user activates "Найти"

#### Scenario: My Films applies search live
- **WHEN** the user changes filter values in My Films
- **THEN** the list filters immediately without a submit action

#### Scenario: Home search covers both media
- **WHEN** the user submits a search on Home matching a film or a series
- **THEN** the matching film or series is shown in the results

#### Scenario: No global search field
- **WHEN** the user is on any screen
- **THEN** the top bar does not present a global search field

## ADDED Requirements

### Requirement: Collapsible navigation rail
The desktop navigation rail SHALL be collapsible between an expanded state that shows icons and labels and a collapsed icon-only state, the collapse control SHALL be available in the rail, and the chosen state SHALL persist across reloads.

#### Scenario: Collapsing and expanding
- **WHEN** the user activates the collapse control
- **THEN** the rail switches between the expanded and collapsed states

#### Scenario: Collapsed state persists
- **WHEN** the user collapses or expands the rail and later reloads the application
- **THEN** the previously chosen state is applied on load

#### Scenario: Collapsed rail stays operable
- **WHEN** the rail is collapsed
- **THEN** every primary section remains reachable and each icon exposes an accessible name

### Requirement: Account menu and sign-out
The top bar SHALL present the signed-in identity as a control, and activating it SHALL open a menu offering Profile, Settings, and sign-out. Sign-out SHALL end the session and return the user to the sign-in screen.

#### Scenario: Opening the account menu
- **WHEN** the user activates the identity control in the top bar
- **THEN** a menu with Profile, Settings, and sign-out is shown

#### Scenario: Signing out
- **WHEN** the user activates sign-out
- **THEN** the session ends and the user is returned to the sign-in screen

### Requirement: Identity display preference
The top bar identity SHALL display the user's name, the user's tag, or both, according to a preference selected in Settings. When both are shown, the tag SHALL appear below the name in a smaller type size. The email SHALL NOT be displayed in the top bar.

#### Scenario: Name only
- **WHEN** the identity display preference is "name"
- **THEN** the top bar shows the user's name

#### Scenario: Tag only
- **WHEN** the identity display preference is "tag"
- **THEN** the top bar shows the user's tag

#### Scenario: Both name and tag
- **WHEN** the identity display preference is "both"
- **THEN** the top bar shows the name with the tag below it in a smaller type size

#### Scenario: Email is never shown
- **WHEN** any identity display preference is active
- **THEN** the user's email is not shown in the top bar

### Requirement: Product identity
The product SHALL be named "Смотровик" wherever the application name is shown, including the navigation brand and the browser tab title, and the application SHALL provide a favicon/app icon.

#### Scenario: Brand name shown
- **WHEN** the navigation is displayed
- **THEN** the product name is shown as "Смотровик"

#### Scenario: Browser tab identifies the product
- **WHEN** the application is opened in a browser
- **THEN** the browser tab title shows "Смотровик" and a favicon/app icon is present
