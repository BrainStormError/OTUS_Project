# ui/navigation Specification

## Purpose
Defines the section information architecture, the maximum navigation depth, and the responsive shell so that every key screen is reachable in at most three transitions on both desktop and mobile.

## Requirements

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

Key screens include film results, film card, the rating and comment form, a series card and the series rating form, a profile, another user's profile, statistics, friend requests, a group card, the group admin panel, and privacy settings.

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

### Requirement: Current location indication
The shell SHALL visually indicate the section the user is currently in.

#### Scenario: Active section marked
- **WHEN** the user is viewing a section
- **THEN** that section's navigation entry is marked as current in both desktop and mobile shells

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

### Requirement: Brand placement in the shell
The shell SHALL present the product brand as a single control that links to Home, centered in the top bar on both desktop and mobile, and SHALL NOT present the brand in the sidebar rail. The brand control SHALL have an accessible name.

#### Scenario: Brand centered in the top bar
- **WHEN** the application is viewed on a desktop or mobile viewport
- **THEN** the product brand is shown centered in the top bar

#### Scenario: Brand links to Home
- **WHEN** the user activates the brand control from any screen
- **THEN** the application navigates to Home

#### Scenario: Brand absent from the sidebar rail
- **WHEN** the sidebar rail is displayed, expanded or collapsed
- **THEN** the rail does not present the product brand

### Requirement: Rail collapse control placement
In the desktop shell, the sidebar collapse control SHALL be horizontally aligned with the column of section icons rather than offset to the opposite edge, and it SHALL remain centered over the icon column when the rail is collapsed.

#### Scenario: Expanded rail alignment
- **WHEN** the desktop rail is expanded
- **THEN** the collapse control is positioned in the same horizontal column as the section icons

#### Scenario: Collapsed rail alignment
- **WHEN** the desktop rail is collapsed
- **THEN** the expand control remains centered over the icon column

### Requirement: Distinct section icons
Each primary section SHALL use an icon that is visually distinguishable from the others, and in particular the Friends and Groups entries SHALL NOT use near-identical icons.

#### Scenario: Friends and Groups distinguishable
- **WHEN** the navigation shell is rendered on desktop or mobile
- **THEN** the Friends and Groups entries show different icon shapes that can be told apart at a glance

### Requirement: Sign-in destination
A successful sign-in SHALL land the user on Home, and no retired or non-product screen SHALL be used as the post-authentication destination.

#### Scenario: Demo sign-in lands on Home
- **WHEN** the user signs in with valid credentials
- **THEN** they are taken to Home

#### Scenario: OAuth sign-in lands on Home
- **WHEN** the user completes OAuth sign-in
- **THEN** they are taken to Home

### Requirement: Mobile tab-bar label alignment

In the mobile bottom tab bar, each section label SHALL be horizontally centered within its tab, including when the label wraps onto more than one line on a narrow viewport.

#### Scenario: Label wraps onto two lines

- **WHEN** a section label such as "Мои фильмы" or "Мои сериалы" wraps onto two lines on a narrow phone viewport
- **THEN** both lines of the label are horizontally centered within the tab

#### Scenario: Label fits on one line

- **WHEN** a section label fits on a single line
- **THEN** the label remains horizontally centered within its tab

### Requirement: Route navigation reuses loaded state

Moving between sections SHALL reuse the state already loaded for a previously visited route within a short freshness window, so that returning to a section or moving back and forward does not require a new full server render.

#### Scenario: Returning to a recently visited section

- **WHEN** the user leaves a section and returns to it within the freshness window
- **THEN** the section is shown from already-loaded state without a new full server render

#### Scenario: Back and forward between sections

- **WHEN** the user moves back or forward in history between recently visited sections
- **THEN** the target section is shown from already-loaded state

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

### Requirement: Shell links do not prefetch

Navigation shell links SHALL NOT prefetch their destinations — neither on pointer hover, keyboard focus, touch, nor during browser idle time — and activating a shell link SHALL be the only request a section navigation makes. Title-card links inside result grids SHALL NOT prefetch every card destination.

#### Scenario: Hover and focus issue no request

- **WHEN** the user hovers over or focuses a navigation shell link without activating it
- **THEN** no request for that link's destination is issued

#### Scenario: Idle time issues no request

- **WHEN** the browser is idle while the navigation shell is displayed
- **THEN** no shell link destination is requested in the background

#### Scenario: Activation issues a single request

- **WHEN** the user activates a navigation shell link
- **THEN** the destination is loaded by one navigation request and no prefetch request precedes it

#### Scenario: Catalog cards are not prefetched

- **WHEN** a grid of title cards is displayed
- **THEN** displaying the grid does not prefetch every card's destination
