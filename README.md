# Fox Academy

A SaaS for private tutors and tutoring schools, built with Expo (SDK 57) and Expo Router.

Current scope: a schedule you can read at a glance, a news feed of everything needing
attention, and per-account appearance and language preferences. **There is no backend
yet** — see [Mocked, on purpose](#mocked-on-purpose) for exactly what is fake and where
the seams are.

## Getting started

```bash
npm install
npm start          # then press i / a / w, or scan the QR code
```

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run ios` / `npm run android` / `npm run web` | Start on one platform |
| `npx tsc --noEmit` | Typecheck — the main gate, since there is no test suite yet |
| `npx expo export --platform web` | Bundle + prerender every route; catches render failures |

Expo SDK 57 changed a lot: read the versioned docs at
<https://docs.expo.dev/versions/v57.0.0/> before writing code, not the latest ones.

## Conventions

**Anything potentially reusable lives in `src/shared/`.** Route files stay thin — they
compose providers and shared components and hold screen-local state, nothing more. If a
component, hook, type or helper could plausibly serve a second screen, it belongs in
`shared/`, not next to the screen that happened to need it first.

Two rules follow from that and are worth stating explicitly:

- **No raw values in components.** Colors, spacing, radii, durations and text styles come
  from the theme; user-visible strings come from the dictionary. A hex code or an English
  literal inside a component is a bug.
- **Prefer a registry over a switch.** Where behaviour varies by kind — notification
  types, palette variants, calendar view modes — the variants are declared in one typed
  table and the renderer stays generic.

## Layout

```
src/
  app/                        # expo-router routes only
    _layout.tsx               # providers + auth guards
    sign-in.tsx
    (app)/                    # everything behind authentication
      _layout.tsx             # stack: tabs + pushed detail screens
      settings.tsx
      (tabs)/                 # calendar - news - more
  shared/
    auth/                     # session, AuthClient seam
    calendar/                 # view modes, grid geometry, month grid, sheets
    i18n/                     # typed dictionaries, provider, Intl formatters
    lessons/                  # Lesson domain type + in-memory store
    lib/                      # date helpers, sync key/value storage
    navigation/               # tab bar (native + web variants)
    notifications/            # news feed: model, kind registry, derivation
    providers/                # AppProviders - every app-wide singleton
    theme/                    # tokens, provider, createStyles
    tutors/                   # calendar owners
    ui/                       # Text, Button, TextField, Card, ModalSheet, motion
```

## How the pieces work

### Theme

Two independent axes: **mode** (light / dark / follow the OS) and **palette variant** (the
accent family). Both persist and are read synchronously on first render, so a returning
user never sees a flash of the wrong theme.

Styles are declared as a function of the theme:

```tsx
const useStyles = createStyles((t) => ({
  card: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg },
  title: { ...t.typography.titleMd, color: t.colors.text },
}));
```

The factory runs at most once per distinct theme for the whole app — the cache is keyed by
`theme.id`, not by component instance — so switching theme costs one stylesheet build, not
one per mounted component. Inline `style={{ color: theme.colors.text }}` is the thing this
exists to avoid.

Adding a color means adding it to **both** palettes in `theme/tokens.ts`; `Palette` is
derived from the light one, so a missing dark value is a compile error. Accent variants
only override what differs.

### i18n

`locales/en.ts` is the source of truth **and the key type**. `t('lessons.ttile')` and
`t('lessons')` (a namespace, not a leaf) are compile errors. Other locales are partials:
any key they omit falls back to English per key, and any key they invent fails to compile.

Plurals go through `Intl.PluralRules`, so Ukrainian's one/few/many works without special
casing. Dates, times, money and relative times come from `useFormat()`, bound to the
active locale — a formatted date is a translation, so it lives with i18n and reformats on
a language switch.

With no explicit choice, the app follows the device language live.

### Auth

Screens never talk to an auth backend, only to the `AuthClient` interface. Route
protection uses `<Stack.Protected guard={...}>`, so **nothing calls `router.replace` after
signing in or out** — flipping the session makes the other route group unreachable and the
router moves the user, deep links included.

### Calendar

Defaults to today. Day and 3-day views share one hour grid; concurrent lessons are
clustered by real overlap and split into columns, and today's column carries a "now" line.
The month view shows density as identity-colored dots and hands a tapped date to an agenda
sheet.

Event colors mean **whose calendar** a lesson is on, not what subject it is — that is what
makes several overlaid schedules readable, and it makes the filter list double as the
grid's legend.

### News

A notification is data (`kind`, `createdAt`, a small `data` bag); how a kind *looks* is a
`notificationRegistry` entry (icon, tone, translation keys, optional inline actions). The
feed maps over notifications without knowing what kinds exist, so **adding a kind is a
registry entry plus a dictionary block** — no component changes.

Items come from two places: what a server would push, and what is *derived* from the
schedule (a lesson that ended unconfirmed, a lesson starting soon). Derived items cannot
go stale — confirm a lesson and its reminder is gone on the next render, no message to
retract. Actions name an intent (`markHeld`); the store decides what that means.

### Bottom navigation

Which tabs appear and in what order is a user preference, persisted and read by both tab
bars from one registry (`navigation/tab-definitions.ts`). Adding a tab is a route plus an
entry there.

`more` is marked `alwaysVisible`, because it is the way back to settings — hiding it would
lock the user out of the screen that could restore it. The constraint lives in the tab
definition, not in the settings UI, so every consumer respects it. A stored order is
reconciled against the tabs that exist now, so a build that adds or removes one does not
strand the preference.

### School management and invitations

The **More** tab shows a *School management* entry only when the session's role is `admin`.
The role arrives with the session at sign-in, so gating on it costs no extra request —
which is the point of keeping it in the session rather than fetching it per screen.

From there an admin invites a tutor by email. The backend mails a link of the form
`foxacademy://invite/<token>`; tapping it on a phone opens `app/invite/[token].tsx`
directly, where the invited person sets a name and password and lands signed in. The email
is displayed but not editable — it comes from the invitation, or the link would be a way to
create an account for any address.

That route sits inside the *unauthenticated* group, because an invitation exists for
someone who has no account. A consequence worth knowing: a signed-in user who taps an
invite link is redirected into the app and has to sign out first.

To try it with fixtures, sign in with an address starting `admin` — the mock client hands
back the admin role for those.

### Capabilities (addons)

Roles say what job someone does; **addons** say what they are allowed to do, and those are
different questions. A school may want one senior tutor who can invite colleagues without
making them an admin, which roles alone cannot express.

`shared/addons/addon.ts` is the registry — one entry per capability, with its copy keys, its
icon, and a `surface` saying where its behaviour lives (`app`, `api`, or `both`). That last
field is not decoration: a `both` addon the app gates but the server does not is a lock on a
door with no wall, so the mismatch is at least visible. Adding a capability is one enum
value, one registry entry, its copy, and — for `api`/`both` — the matching `@RequiresAddon`
on the backend.

**Addons live in the session**, delivered with the user's first payload alongside the role.
Gating UI therefore costs no request and nothing flickers into existence a moment after the
screen appears. `useAddons()` reads them; **an admin implicitly holds every addon**, since
they are the person who grants them — the backend states the same rule in
`AddonsService.resolveFor`, because both sides must agree and neither can ask the other.

Two gates operate on the School management screen, and the difference is deliberate:

- **The screen** opens for admins, and for anyone holding a capability — otherwise a grant
  would be unreachable.
- **Each action** is gated on its own capability, so the invite button appears for anyone
  with `INVITE_TUTORS` while only `BROADCAST_ANNOUNCEMENTS` reveals the announcement
  composer.
- **Handing out capabilities** is admin-only by role, never by addon. That is the one thing
  which must not be delegable, or the boundary means nothing.

### Account preferences vs device preferences

Two kinds of settings live in different places, and the rule is one question: **would
losing this on reinstall be wrong?**

- **Device** — theme, accent, language, tab order. Kept in `shared/lib/storage`, because
  they describe how this phone should look.
- **Account** — lesson reminders and their lead time. Kept on the server in a `config`
  column on the user, because they follow the person to a new phone.

Account preferences ride in the session with the addons, so the settings screen renders its
real state on the first frame instead of showing defaults and correcting itself. Writes go
through `PATCH /users/me/config` and the server's response replaces local state — it is the
authority on what was stored, including anything it clamped. Changes apply optimistically
and revert on failure: a toggle that waits for a round trip feels broken, and one that stays
moved after a failed save lies.

The lead-time row is hidden while reminders are off. An interval for notifications that are
not sent is a control with no effect.

### Support

The More tab has a **Support** entry that opens a message form. It posts to `POST /support`,
which **writes the row before trying to email anyone** — email can fail and a provider can
be unconfigured, so the row is the commitment and the mail is a notification about it. The
app can therefore say "we have your message" and mean it.

Deliberately not a `mailto:` link. A message that only existed in someone's mail client is
one nobody can look up, count, or answer twice.

With no mail provider configured the notification goes to the log and `notifiedAt` stays
null, so undelivered requests remain findable.

### Launch

`AppSplash` covers the first frames with the app's own animated loader and fades out. It
holds for a short floor (~420 ms) because every provider hydrates synchronously — without
it the loader would flash for a single frame, which is worse than not having one.

### Motion

Every animation comes from `shared/ui/motion.ts`, so durations stay consistent and there
is one place to audit whether a movement earns its keep. The rule: animate only when
something changes state in a way the user needs to follow — an item leaving a list,
content replacing content, a control acknowledging a press. Nothing loops, nothing
decorates.

## Talking to the API

Every request goes through `src/shared/api`. One place owns the base URL, the auth header,
JSON encoding, the timeout, and turning failures into `ApiError` — feature clients describe
*what* they call, never *how*.

```
shared/api/
  api-config.ts   # EXPO_PUBLIC_API_URL, and whether to use mocks at all
  http.ts         # the single request function + get/post/patch/delete
  api-error.ts    # ApiError: status, isUnauthorized, isNetworkFailure
  auth-token.ts   # the current token, held outside React
  clients.ts      # THE registry: mock or HTTP, decided once
```

**`clients.ts` is the switch.** Every provider takes its client from `apiClients` by
default, so pointing the whole app at a backend is setting one variable:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000/api npx expo start
```

An API always wins over fixtures — a build pointed at a server must not quietly ignore it.
With neither configured (a production build not yet pointed anywhere) the auth client fails
loudly rather than fabricating a session.

**The token lives outside React** (`auth-token.ts`). Every request needs it, the token
comes from the session, and the session is obtained *through* a request — a module-level
holder that `SessionProvider` writes to breaks that cycle. A 401 signs the user out through
a registered handler, so an expired token cannot leave the app on screens it can no longer
load.

**Wire formats are mapped at the boundary, not in the domain.** The API says `SCHEDULED`
and `ADMIN_ANNOUNCEMENT`; the app says `scheduled` and `adminAnnouncement`. Each HTTP client
translates its own responses, so no component ever sees two vocabularies. A notification
kind this build does not recognise is skipped rather than rendered blank — an older app has
to survive a newer server.

Providers still accept a `client` prop, which is what keeps them testable in isolation.

## Test data

All test data lives in `src/shared/fixtures/` behind a single flag:

```ts
export const fixturesEnabled = __DEV__ || process.env.EXPO_PUBLIC_FIXTURES === '1';
```

- **Development** — always on, so the app is explorable out of the box.
- **Test build** — set `EXPO_PUBLIC_FIXTURES=1`:

  ```bash
  EXPO_PUBLIC_FIXTURES=1 npx expo export --platform web        # bash
  ```

  ```powershell
  $env:EXPO_PUBLIC_FIXTURES=1; npx expo export --platform web  # PowerShell
  ```

  For EAS, put the variable in the build profile's `env` block.
- **Production** — off, so no invented students, lessons or announcements ship, and
  sign-in fails loudly (`unavailableAuthClient`) instead of faking a session.

`EXPO_PUBLIC_*` values are inlined at bundle time, so with the flag off the fixture
modules are dropped from the bundle rather than merely unused.

### Keeping fixtures current

**A test build must always demonstrate everything the app can do.** So:

- adding a feature means adding fixtures for it, in the same change;
- changing a feature means updating the fixtures that cover it.

`fixtureLessons` is built relative to *now* on every launch — a lesson that has already
ended but is unconfirmed, one starting within the hour, two at the same time, plus
cancelled and completed ones. That is deliberate: it guarantees every notification kind
and every calendar state is visible whenever the build is opened, rather than only on the
day the data happened to be written.

| Area | Fixture | Where the real thing plugs in |
| --- | --- | --- |
| Sign-in | Any email/password succeeds; the user is built from the email | Implement `AuthClient`, pass it as `<SessionProvider client={...}>` |
| Schedule | `fixtureLessons`, in memory, lost on reload | `LessonsProvider` exposes a list plus mutations — the shape a data layer will have |
| News | `fixtureNotifications` for server-pushed kinds | `NotificationsProvider`; derived kinds keep working as-is |
| Colleagues | `fixtureColleagues` | `shared/tutors` — the own calendar is always real |

A yellow notice on the sign-in screen says the backend is missing; it appears only when
fixtures are on. The backend itself is undecided (TypeORM / Prisma / Drizzle) — nothing
above depends on that choice.

## Android builds (Windows)

The Android C++ build **cannot run from this repository's normal location**. Ninja, as
shipped with the Android SDK, is not long-path aware: a prefab config file it depends on
lands at exactly 250 characters under
`C:\Users\...\Documents\Programming\ReactNative\foxacademy\`, ninja fails to stat it,
treats the edge as permanently dirty and re-runs CMake until it gives up with
`ninja: error: manifest 'build.ninja' still dirty after 100 tries`. The failing task is
always `:react-native-reanimated:buildCMakeRelWithDebInfo`.

Build from a short path instead:

```powershell
$src = 'C:\Users\User\Documents\Programming\ReactNative\foxacademy'
robocopy $src C:\fa /E /XD "$src\.git" "$src\dist" "$src\.expo" "$src\builds" ".cxx" `
  "$src\android\build" "$src\android\app\build" "$src\android\.gradle"

Set-Location C:\fa\android
$env:EXPO_PUBLIC_FIXTURES = '1'
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
```

The APK lands in `C:\fa\android\app\build\outputs\apk\release\app-release.apk`. The
`release` build type is signed with the debug keystore, which is what makes it installable
for testing with no keystore setup — it is **not** publishable as-is.

Notes from getting this working, so the dead ends are not re-walked:

- A junction (`mklink /J C:\fa <project>`) does **not** help: Gradle resolves it back to
  the canonical long path and the C++ build still uses that. A real copy or a move is
  required.
- Editing `CONFIGURE_DEPENDS` out of reanimated's or worklets' `CMakeLists.txt` is **not**
  needed — verified by building with it restored. Do not patch `node_modules`.
- Restricting to one ABI is a speed choice, not a fix; all four ABIs fail equally from a
  long path.
- `expo prebuild` needs `android.package` and `ios.bundleIdentifier` in `app.json`; both
  are set. `android/` and `ios/` stay gitignored, being build artifacts.

## Verifying changes

There is no test suite yet, so:

1. `npx tsc --noEmit` — the dictionaries, theme tokens and notification registry are typed
   such that most mistakes land here.
2. `npx expo export --platform web` — prerenders every route. **An empty page means SSR
   threw**: grep the output HTML for `<!--$!-->`, React's marker for a Suspense boundary
   that failed and fell back to client rendering. The build still exits 0 and prints no
   error.
3. Screens behind the auth guard prerender as the sign-in screen. To see them, temporarily
   pass `initialSession` to `SessionProvider` — then revert it.
4. `Modal` content is **not** prerendered (react-native-web renders it as a portal), so
   the sheets — filters, calendar settings, day agenda, new lesson — need a real browser or
   a device.
