# ui/avatar Specification

## Purpose
Gives every user a recognizable visual identity that is derived from their unique tag, generated entirely in the browser with nothing stored on the server or persisted in the browser.

## Requirements

### Requirement: Tag-derived deterministic avatar

The application SHALL render a per-user avatar derived deterministically from that user's tag (handle). The same tag SHALL always produce the same avatar, and different tags SHALL be designed to produce visually distinct avatars.

#### Scenario: Same tag yields the same avatar

- **WHEN** the same tag is rendered on different screens or in different sessions
- **THEN** the identical avatar is produced

#### Scenario: Different tags differ

- **WHEN** two different tags are rendered
- **THEN** their avatars differ in color and shape

#### Scenario: Missing tag falls back to a stable identifier

- **WHEN** a user has no tag to seed from
- **THEN** the avatar is derived from that user's stable identifier so it is still stable across renders

#### Scenario: Changing the tag changes the avatar

- **WHEN** a user changes their tag
- **THEN** the avatar shown for that user changes to the one derived from the new tag

### Requirement: Client-side generation with no persistence

The avatar SHALL be generated in the browser from the tag with no network request, and SHALL NOT be stored on the server nor persisted in the browser — no server-side record, no localStorage, no cookie, and no IndexedDB. A generated avatar SHALL be reused within the page session and SHALL cease to exist when the page is reloaded or the user signs out.

#### Scenario: No network request

- **WHEN** an avatar is rendered
- **THEN** it is produced locally without any request to the server or to an external service

#### Scenario: Nothing is persisted

- **WHEN** an avatar has been generated
- **THEN** no avatar data is written to the server, localStorage, cookies, or IndexedDB

#### Scenario: Reused within the page session

- **WHEN** the same tag appears again in the same page session
- **THEN** the already generated avatar is reused instead of regenerated

#### Scenario: Released on reload or sign-out

- **WHEN** the page is reloaded or the user signs out
- **THEN** the generated avatar data no longer exists in memory

### Requirement: Avatar presentation on identity surfaces

The avatar SHALL be shown wherever the application presents a user's identity: the top-bar account menu, the signed-in user's own profile, another user's profile, friend list items (including incoming and outgoing requests), and the admin member panel's member and pending-invitation entries. The avatar SHALL occupy a circular area and scale to the size required by its context, presenting the same visual for the same user at every size.

#### Scenario: Account menu shows the avatar

- **WHEN** the top bar is rendered
- **THEN** the signed-in identity control shows that user's avatar

#### Scenario: Profiles show the avatar

- **WHEN** a profile is opened
- **THEN** the addressed user's avatar is shown next to their name and tag

#### Scenario: Friend and request entries show the avatar

- **WHEN** friend entries, incoming requests, or outgoing requests are shown
- **THEN** each entry shows that user's avatar

#### Scenario: Admin member panel shows the avatar

- **WHEN** the member list or the pending-invitation list is shown
- **THEN** each entry shows that user's avatar

#### Scenario: Same visual at every size

- **WHEN** the same user's avatar is shown at different sizes in different contexts
- **THEN** it presents the same color and shape, scaled to fit

### Requirement: Avatar accessibility

The avatar SHALL be decorative when the same user's name or tag is adjacent within the same element, and SHALL be hidden from assistive technology in that case. When the avatar is shown without adjacent identifying text for the same user, it SHALL expose an accessible label naming that user.

#### Scenario: Decorative beside identity text

- **WHEN** an avatar is displayed next to the same user's name or tag
- **THEN** it is hidden from assistive technology

#### Scenario: Labeled when standalone

- **WHEN** an avatar is displayed without adjacent identifying text for the same user
- **THEN** it exposes an accessible label naming that user
