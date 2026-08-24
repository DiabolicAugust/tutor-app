# End-to-end tests

Fourteen flows that drive the real app on a real device against the real backend.
Written for [Maestro](https://docs.maestro.dev), which reads the accessibility
tree and taps — the same thing a person does, with none of the app's own code in
the loop.

```
npm run e2e                      # install, warm the API, run everything
npm run e2e -- 07                # one flow, by number
npm run e2e -- --tags=calendar   # every flow carrying a tag
npm run e2e -- --no-install      # keep whatever build is on the device
npm run e2e -- --list            # what the suite contains
```

The emulator build is a separate artefact, because the emulator is x86\_64 and the
APK handed to people is not:

```
npm run build:e2e                # → builds/e2e-x86_64.apk
```

## The backend it runs against

**A local one, always.** These flows register schools, invite tutors, send
announcements and upload files. Pointed at the deployed backend they do all of
that for real — which happened once, and left test schools in the production
database. The runner now reads `.env.e2e`, refuses any host that is not this
machine, and stops if nothing answers.

The app reaches it over `adb reverse`, which the runner sets up: the device's own
`localhost:3000` is forwarded to this machine's. That works over USB to a real
phone as well, and avoids the emulator's user-mode network stack — which is the
part most likely to be quietly broken.

Cleartext HTTP to `localhost` is permitted by `plugins/with-local-cleartext.js`,
and only to this machine's addresses. Without it the requests fail before leaving
the device and the app reports "could not reach the server" — which is true, and
says nothing about why.

It is a config plugin rather than an edit to the manifest because `android/` is
generated and not committed: the edit worked and would have vanished at the next
prebuild.

Starting it, from the backend repository:

```
npm run db:test:up                                   # postgres on 55432, once
docker exec fox-test-db psql -U postgres   -c "CREATE DATABASE foxacademy_e2e;"               # once

DATABASE_URL="postgresql://postgres:fox@localhost:55432/foxacademy_e2e?schema=public"   npx prisma migrate deploy

PORT=3000 DATABASE_URL="postgresql://postgres:fox@localhost:55432/foxacademy_e2e?schema=public" JWT_SECRET="e2e-only-secret-at-least-thirty-two-chars-long" MAIL_TRANSPORT=log PUSH_TRANSPORT=log STORAGE_DRIVER=local UPLOADS_DIR=/tmp/foxacademy-e2e-uploads   npm start
```

A database of its own rather than `foxacademy_test`: the backend's own suite
truncates every table between cases, and sharing one would mean each project
deleting the other's fixtures halfway through a run.

## What this is for

Every flow here exists because something it asserts was once broken in a way no
unit test could have seen. The comment at the top of each one says which.

That is the standard for adding a flow: it should fail on the bug it was written
for. A flow that only asserts a screen renders passes forever and teaches nobody
anything.

## How it is put together

**One account, fourteen flows.** Flow 02 opens a school and everything after it
works inside it. The numbering *is* the dependency, which is why `config.yaml`
lists the files one by one instead of globbing them — a glob sorts the same way
today and stops doing so the first time somebody adds a fifteenth.

Only flows 01 and 02 call `clearState`. Everything after them relies on the
session persisting, which is itself worth testing.

A consequence worth knowing: several flows assert an *empty* state — no
invitations sent, no groups yet — which is only true of the school flow 02 just
opened. Running one of those on its own, against a school a previous run filled
in, fails for that reason and not for a real one. `npm run e2e -- 07` is for
iterating on a flow; a verdict comes from a full run.

**Names are stamped per run.** A school name and an email address can each be
registered once, so the runner generates them and passes them with `-e`. Do not
declare those in a flow's `env:` block: an empty default there shadows the value
passed on the command line, and the form is submitted blank with `${SCHOOL}`
printed in the log.

**The app is pinned to English.** Flows assert on visible text, and the device's
language is not the phone's. The switcher on the sign-in screen is the only place
this can be set before an account exists, and the choice is persisted, so
`subflows/use-english.yaml` runs once after the state is cleared.

**Handles, not copy.** Taps and assertions go through `testID` wherever there is
one, because copy is translated and rewritten for clarity — a test that keys on a
sentence fails for a cosmetic edit and stops being believed. Visible text is
asserted only where the text *is* the thing under test: a validation message, a
count, a status.

The exception is the bottom tab bar. It is a native Android view built by
`NativeTabs`, and a `testID` on a trigger does not reliably reach the item the
platform draws — so `subflows/open-tab.yaml` taps the label, which is the reason
the language is pinned.

**Two things a flow cannot assert.** Where a spotlight is drawn, and whether a
refresh spinner is still turning. The tour flows take a screenshot per step into
`artifacts/` instead; the refresh flow taps something a stuck spinner would have
swallowed.

## The device

The runner handles the parts that fail confusingly:

- **Waking the screen.** A sleeping emulator renders black with an empty view
  hierarchy, which looks exactly like an app that failed to launch.
- **Staging the upload.** Flow 13 drives the system document picker, so the file
  it picks is written and pushed to `/sdcard/Download` first.
- **Warming the API.** The host spins the service down when idle and waking it has
  been measured at over two minutes. Paid for once, before the first flow, rather
  than inside one — where it reads as the app being broken.
- **Turning off autofill.** Google Password Manager offers to save a password in a
  dialog of its own on top of the app, and that dialog outlives `clearState`, so
  one flow that submits a password takes every flow after it down with it — on
  screens they never reached. The runner sets `autofill_service` to `null` and
  says so; a fresh emulator image arrives with it on.

## Where the results go

`artifacts/report.xml` is JUnit, for CI.

Everything else Maestro writes goes under `~/.maestro/tests/<run>/<flow>/`: the
screenshots the tour flows take, under `takeScreenshot/`, and — on a failure — the
view hierarchy at the moment it happened, which is usually the answer.

## Two things worth knowing before writing a flow

**Assert the screen before tapping it.** `tapOn` gives up on a missing element far
sooner than `assertVisible` waits for one, so a tap that follows a navigation
straight away fails on the transition rather than on the app. That reads as a real
bug and cost an hour once.

**Text is matched as a regex.** A message with a `.` or a `?` in it still matches,
but a copy change that adds brackets will not.

**Never use `hideKeyboard`.** On Android, Maestro implements it as a back press,
so it navigates out of the screen the flow is testing — and the next step then
fails looking for something that was there a moment ago. It is the single most
expensive false lead in this suite's history. The emulator the suite runs on uses
a hardware keyboard and shows no soft keyboard at all, so nothing needs
dismissing; where a real device's keyboard would cover the target, scroll to it.
