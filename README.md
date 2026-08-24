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

### Students

A tab, not a page behind More. A tutor sees the students they teach and an admin the whole
school — the server does that scoping, so the screen has no branch for it. Adding and
removing need `MANAGE_STUDENTS`; reading does not, because every screen that shows a lesson
needs a student's name.

Every row opens, including students a colleague teaches. Their page is readable and only
the actions on it are gated: a row that does nothing when tapped is a worse answer than a
page that shows what you may not change.

`shared/students/components/student-form-sheet.tsx` is shared by the roster (for adding)
and a student's page (for editing). It resets by remounting — callers give it a `key` —
rather than by writing state in an effect, which would render once with the previous
student's name still in the fields.

A student's page holds four things: who they are, their lessons newest-first with whether
each took place, notes, and files.

**Notes** are one component for two subjects. `shared/notes` takes a `NoteSubject` — a
tagged union of `{kind: 'student'}` or `{kind: 'lesson'}` — so "neither" and "both" are not
states any caller can build, which is the client half of the rule the server enforces. A
lesson's notes open in a sheet from the history list: writing up a lesson happens while
looking at the list of them, and a pushed screen means finding your place again afterwards.

**Files** upload through the same `http` module as everything else — it grew a multipart
branch rather than a second way to make requests. The `Content-Type` header is deliberately
*not* set for multipart: `fetch` generates the boundary and writes the header itself, and
setting it by hand produces a body the server cannot parse, with no error until it tries.

There is **no "open file" action yet**. Showing a stored file needs a download to the cache
and a viewer to hand it to; a button that half worked would be worse than its absence.
Uploading, listing and removing are what this does.

`shared/lib/use-async-data.ts` backs all three lists. Loading is derived from a key rather
than stored, which kills two bugs at once: no state written synchronously inside an effect,
and no render where the previous student's notes are still on screen with `isLoading` already
false.

New tabs appear at the position this build intended, not appended. Appending would have put
Students *after* More for everybody upgrading — a place no fresh install ever shows it.

### Push notifications

An announcement written by an admin reaches a tutor two ways, and both matter.

**In the feed.** `NotificationsProvider` refetches when the app returns to the foreground,
not only at launch. Without that an announcement sent while somebody had the app open in the
background stayed invisible until they killed and reopened it — not a state anybody would
think to try.

**As a notification.** `shared/push` registers this device on sign-in and forgets it on
sign-out. Both halves matter: a token left registered after sign-out sends the next person to
use the phone the previous person's school announcements.

Registration happens on sign-in rather than at launch, and asks for permission only the
first time. A prompt that appears before the app has shown what it would notify about is the
one most reliably declined; by the time somebody has a session they have seen their calendar.

`requestPushToken` returns a *reason* rather than throwing, because every failure is
ordinary: somebody declined, the build has no EAS project configured, or this is a browser.
A caller that has to catch exceptions for the normal cases ends up treating them all the
same, and "you said no" deserves different handling from "this cannot work here". Settings
shows which of those applies — every reason is invisible from inside the app, and silence is
indistinguishable from nothing having been announced.

Announcements arrive on their own Android channel with the default sound. The custom chime
stays with lesson reminders, so it keeps meaning one thing — an announcement that sounded
like a lesson starting would be actively misleading. Channels are also independently
mutable, which is the behaviour somebody who wants one and not the other expects.

**Not working yet, and it needs you rather than code.** There is no EAS project id in
`app.json` and no `google-services.json`, so `getExpoPushTokenAsync` has nothing to identify
this app by and Android has no delivery credentials. Settings says so rather than pretending.
The path is: create an EAS project, add its id to `app.json`, create a Firebase project,
add `google-services.json` and upload the FCM V1 key to Expo. The code above then works
unchanged.

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

`MANAGE_STUDENTS` shows the difference between the two questions a permission system has
to answer. The **capability** decides whether someone may edit students at all; the
**server** decides whose — a tutor their own, an admin the whole school, enforced in
`StudentsService.findOne` so one function owns that rule. The roster still lists students
the caller cannot edit, because the calendar shows their lessons and hiding half the names
would be more confusing than a row that does not open.

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

### Registration and the interface tour

Sign-in leads to `/join`, which asks one question before showing any fields: are you
opening a school, or joining one that exists? Those are not variants of a form — the first
creates a tenant and its first admin, the second needs an invitation that already exists —
so the fork comes first, and nobody fills in the wrong one.

**Joining an existing school has no form on purpose.** A school decides who teaches under
its name, and a self-service form would let anybody attach themselves to somebody else's
roster. `/join/existing` therefore explains what to ask for and what will arrive, which is
what somebody who landed there actually needs. Registration itself happens on the
invitation link (`invite/[token]`).

**Opening a school** is `/join/school`, two steps: the school, then the person running it.
Two rather than one because the fields belong to two different things, and a single screen
asking five unrelated questions at signup is the shape people abandon. Each step validates
on the way out, so nothing wrong is discovered on the last screen. The time zone comes from
the device, read through a `try/catch` — Hermes ships a reduced `Intl`, and a school
created with a crash instead of a time zone is a worse outcome than one created in UTC.

Success requests the tour, then adopts the session, in that order: adopting unmounts the
screen, so anything that has to happen has to happen first.

`shared/tutorial` is the tour. Steps live in a registry (`tour.ts`), each naming the route
it teaches and optionally an anchor to highlight, so adding one is an entry plus two
translation keys and the overlay never grows a switch. Three things are worth knowing:

- **The tour drives navigation rather than following it.** Moving to a step moves the app
  to the screen that step is about, which is the difference between a walkthrough and a
  slideshow.
- **The anchor is optional.** Some steps are about a whole screen, and the tab bar is a
  native view this code cannot measure — a step insisting on a spotlight would have to fake
  one, and a ring around the wrong place is worse than no ring.
- **The spotlight is four rectangles around a hole**, not a mask: masking needs SVG or
  `mix-blend-mode`, one a dependency and the other inconsistent between web and native.

The request is persisted rather than held in state, because it is made on one side of the
sign-in guard and honoured on the other, and everything in between unmounts. Settings has a
"Show me around" entry so the tour is reachable more than once — otherwise it happens to
one person on the day they open a school, leaving it unverifiable and invisible to every
tutor who joined by invitation.

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

## Where data comes from

The API, and nothing else. `EXPO_PUBLIC_API_URL` is inlined at bundle time, so
which server a build talks to is decided when the build is made.

There used to be a second answer. Every client had a `mock*` half backed by
`src/shared/fixtures/`, and a flag chose between them — which was the right shape
while the app was written ahead of its backend, and stopped being right the moment
there was one. Two implementations of every client meant a second thing to keep in
step with the server, silently wrong as soon as it fell behind, and a build that
quietly ran on invented students is one nobody can trust a bug report from.

It also hid real bugs, which is the part worth remembering:

- The mock auth client issued a user whose id matched the fixtures, so "my
  students" and "my calendar" worked in a test build and matched nothing at all
  against a server.
- `tutorColorIndex` looked a calendar's owner up in the fixture colleagues. Against
  a server nothing was ever found, every colleague came back as index zero, and a
  school's calendars were all drawn in the same colour — which is the one thing
  overlaying them is for. It derives a stable index from the id now.

With no `EXPO_PUBLIC_API_URL` configured, signing in fails loudly through
`unavailableAuthClient` rather than fetching a relative path: "this build was not
pointed at a server" and "the server is broken" should not look the same. Nothing
else needs that guard, because nothing behind sign-in is reachable without a
session.

Providers still accept a `client` prop, which is what keeps them testable in
isolation — and what the end-to-end suite in `.maestro/` exercises for real,
against a local backend.


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

`.github/workflows/ci.yml` runs typecheck, lint and a full web export on every push to
`main` and every pull request, and fails the build if any screen did not render. There is
no unit-test suite here; the backend is where the tests live.

Locally, in the same order:

1. `npx tsc --noEmit` — the dictionaries, theme tokens and notification registry are typed
   such that most mistakes land here.
2. `npx expo export --platform web` — prerenders every route. **An empty page means SSR
   threw**: grep the output HTML for `<!--$!-->`, React's marker for a Suspense boundary
   that failed and fell back to client rendering. The build still exits 0 and prints no
   error.
3. Screens behind the auth guard prerender as the sign-in screen. To see them, temporarily
   pass `initialSession` to `SessionProvider` — then revert it.
4. Screens whose content is fetched — the roster, a student's page — prerender empty, because
   effects do not run during static rendering. The prerender proves they do not throw; what
   they show needs a device or a browser.
5. **Route types are generated by `npx expo start`, not by `expo export`** — and other Expo
   CLI commands rewrite `.expo/types/router.d.ts` from a stale manifest, which silently
   un-types a route you just added. After adding a route, run the dev server once, then
   typecheck *before* anything else Expo touches. CI has no generated types at all, so it
   typechecks without route checking; lint and the export still run.
4. `Modal` content is **not** prerendered (react-native-web renders it as a portal), so
   the sheets — filters, calendar settings, day agenda, new lesson — need a real browser or
   a device.
