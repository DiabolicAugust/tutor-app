#!/usr/bin/env node
// Runs the Maestro suite in `.maestro/` against whatever device is attached.
//
// A script rather than an npm one-liner because five things have to be true
// before the first tap, and each of them fails in a way that is hard to read
// from Maestro's own output: a device has to be attached and awake, the build has
// to be installed, the flows need names nobody has registered before, the file
// they upload has to exist on the device, and the API has to be awake.
//
// Usage:
//   npm run e2e                      # install, warm, run everything
//   npm run e2e -- 07                # one flow, no reinstall
//   npm run e2e -- --tags=calendar   # every flow carrying a tag
//   npm run e2e -- --no-install      # keep what is on the device
//   npm run e2e -- --list            # what the suite contains

const { execFileSync, spawnSync } = require('node:child_process');
const { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.join(__dirname, '..');
/**
 * The env file the test build is compiled with, and therefore the one that says
 * which API the suite is about to drive.
 */
const E2E_ENV = '.env.e2e';
const APK = path.join(ROOT, 'builds', 'e2e-x86_64.apk');
const FLOWS = path.join(ROOT, '.maestro');
const ARTIFACTS = path.join(FLOWS, 'artifacts');

/** The file the upload flow picks. Pushed to the device, named in the flow. */
const UPLOAD_NAME = 'maestro-worksheet.txt';
/** Where Android's document picker looks once its drawer is on Downloads. */
const DEVICE_DOWNLOADS = '/sdcard/Download';

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', shell: true, cwd: ROOT, ...options });
}

function quiet(command, args) {
  return spawnSync(command, args, { encoding: 'utf8', shell: true });
}

/**
 * Maestro is installed by unzipping a release, so it is often not on PATH.
 * Looked up rather than assumed, with an override for anywhere unusual.
 */
function maestroBin() {
  if (process.env.MAESTRO_BIN) return process.env.MAESTRO_BIN;

  const candidates =
    process.platform === 'win32'
      ? [
          'maestro.bat',
          path.join(os.homedir(), 'maestro', 'bin', 'maestro.bat'),
          'C:\\maestro\\bin\\maestro.bat',
        ]
      : ['maestro', path.join(os.homedir(), '.maestro', 'bin', 'maestro')];

  for (const candidate of candidates) {
    const found = candidate.includes(path.sep)
      ? existsSync(candidate)
      : quiet(candidate, ['--version']).status === 0;
    if (found) return candidate;
  }

  return fail(
    'Maestro was not found.\n' +
      '  Install it from https://docs.maestro.dev/getting-started/installing-maestro\n' +
      '  or point MAESTRO_BIN at the binary.',
  );
}

/** The Android SDK's adb, which is not on PATH on a default install either. */
function adbBin() {
  if (process.env.ADB_BIN) return process.env.ADB_BIN;

  const sdk =
    process.env.ANDROID_HOME ??
    process.env.ANDROID_SDK_ROOT ??
    path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
  const local = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');

  return existsSync(local) ? local : 'adb';
}

/**
 * Wakes the screen, unlocks it, and keeps it awake for the run.
 *
 * An emulator left alone goes to sleep, and a sleeping screen renders black with
 * an empty view hierarchy — which looks exactly like an app that failed to
 * launch. That cost a real detour once; it is three commands to prevent.
 */
/**
 * Points the device's own `localhost:3000` at this machine's.
 *
 * The suite drives a backend running here, and the app is built against
 * `http://localhost:3000` — which on a device means the device. This is what
 * makes that true. Plain adb, so it works over USB to a real phone as well as to
 * an emulator, and it avoids the emulator's user-mode network stack, which is the
 * part most likely to be broken.
 */
function tunnel(adb, port) {
  const result = quiet(adb, ['reverse', `tcp:${port}`, `tcp:${port}`]);
  if (result.status !== 0) {
    fail(`Could not forward port ${port} to the device:
${result.stderr || result.stdout}`);
  }
  console.log(`Tunnel: device localhost:${port} is this machine`);
}

/**
 * Turns off the device's autofill service for the run.
 *
 * Google Password Manager offers to save a password the moment an app commits a
 * form containing one, and it does that in a dialog of its own on top of
 * everything. Maestro then reads that dialog's hierarchy instead of the app's, so
 * the assertion after the submit fails; worse, the dialog outlives `clearState`
 * and `launchApp`, so every flow after it fails too, on screens it never reached.
 *
 * Disabled rather than dismissed: a flow that taps it away has to guess where it
 * will appear, and it appears wherever a password field loses its form — which in
 * a two-step registration is a place no assertion is looking.
 */
function silenceAutofill(adb) {
  quiet(adb, ['shell', 'settings', 'put', 'secure', 'autofill_service', 'null']);
  const left = quiet(adb, ['shell', 'settings', 'get', 'secure', 'autofill_service'])
    .stdout.trim();

  // Reported either way. If some device refuses to have it turned off, that is
  // worth knowing here rather than deducing it from ten flows failing at once.
  console.log(
    left === 'null'
      ? 'Autofill: off'
      : `Autofill: still ${left} — expect the save-password dialog to break flows`,
  );
}

function wake(adb) {
  quiet(adb, ['shell', 'input', 'keyevent', 'KEYCODE_WAKEUP']);
  quiet(adb, ['shell', 'wm', 'dismiss-keyguard']);
  // An emulator reports as charging, so this holds the screen on for the run
  // rather than for a fixed timeout.
  quiet(adb, ['shell', 'svc', 'power', 'stayon', 'true']);
}

/**
 * Puts the file the upload flow picks where the picker can find it.
 *
 * Written locally first so its content is known: an upload flow that passed
 * because it picked somebody else's leftover file has not tested anything.
 */
function stageUpload(adb, stamp) {
  const local = path.join(ARTIFACTS, UPLOAD_NAME);
  writeFileSync(local, `Worksheet staged by the Maestro suite at ${stamp}.\n`, 'utf8');

  const pushed = quiet(adb, ['push', local, `${DEVICE_DOWNLOADS}/${UPLOAD_NAME}`]);
  if (pushed.status !== 0) {
    fail(`Could not put ${UPLOAD_NAME} on the device:\n${pushed.stderr || pushed.stdout}`);
  }
  // Downloads is indexed, and the picker lists what the index knows about.
  quiet(adb, [
    'shell',
    'am',
    'broadcast',
    '-a',
    'android.intent.action.MEDIA_SCANNER_SCAN_FILE',
    '-d',
    `file://${DEVICE_DOWNLOADS}/${UPLOAD_NAME}`,
  ]);
  console.log(`Staged ${UPLOAD_NAME} in ${DEVICE_DOWNLOADS}`);
}

/** An env file as an object. Not a dependency: it is one file and four lines. */
function readEnvFile(name) {
  const file = path.join(ROOT, name);
  if (!existsSync(file)) return {};

  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

/**
 * Checks the API the build was compiled against, and refuses anything but a
 * local one.
 *
 * The suite registers schools, invites tutors and uploads files. Pointed at a
 * deployed backend it does all of that for real — which it did, once, and left
 * test schools in the production database. So the address is checked rather than
 * trusted: a run against anything but the machine this is on is a mistake worth
 * stopping for, not warning about.
 */
async function checkApi() {
  const base = readEnvFile(E2E_ENV).EXPO_PUBLIC_API_URL;
  if (!base) {
    fail(
      `No EXPO_PUBLIC_API_URL in ${E2E_ENV}.\n` +
        '  The suite needs a local backend to drive. See .maestro/README.md.',
    );
  }

  // `10.0.2.2` is the host as seen from the emulator; from here it is localhost.
  const local = base.replace('10.0.2.2', 'localhost');
  const { hostname } = new URL(local);
  if (!['localhost', '127.0.0.1'].includes(hostname)) {
    fail(
      `${E2E_ENV} points at ${hostname}, which is not this machine.\n` +
        '  These flows create schools and upload files, so they must run against\n' +
        '  a local backend. See .maestro/README.md.',
    );
  }

  const url = `${local.replace(/\/+$/, '')}/health`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(String(response.status));
    console.log(`API: ${base}`);
  } catch {
    fail(
      `${url} did not answer.\n` +
        '  Start the backend before running the suite — see .maestro/README.md.',
    );
  }
}

function flowFiles() {
  return readdirSync(FLOWS)
    .filter((file) => file.endsWith('.yaml') && file !== 'config.yaml')
    .sort();
}

/** Accepts `07-book-a-lesson`, `07`, or the full filename. */
function resolveFlow(name) {
  if (name.endsWith('.yaml')) return name;

  const match = flowFiles().find((file) => file.startsWith(name));
  if (!match) {
    fail(`No flow matches "${name}". The suite is:\n  ${flowFiles().join('\n  ')}`);
  }
  return match;
}

/**
 * The values every flow shares, stamped so a run never collides with the last
 * one: a school name and an email address can each be registered once, so fixed
 * values would pass exactly one run and fail forever after.
 *
 * No spaces in any of them. `shell: true` is required to run Maestro's `.bat` on
 * Windows, and a shell splits an unquoted `SCHOOL=Maestro School 1` into
 * arguments — Maestro then looked for a flow called "School". Hyphens avoid the
 * whole quoting question rather than trying to win it.
 *
 * The two students are named so they sort in the order the flows assume.
 */
function suiteEnv(stamp) {
  return {
    EMAIL: `maestro-${stamp}@example.test`,
    PASSWORD: 'maestro-password-123',
    SCHOOL: `Maestro-School-${stamp}`,
    STUDENT: 'Maestro-Alpha',
    STUDENT_TWO: 'Maestro-Bravo',
    GROUP: 'Maestro-Group',
    INVITEE: `maestro-invitee-${stamp}@example.test`,
    UPLOAD: UPLOAD_NAME,
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log(`The suite, in order:\n  ${flowFiles().join('\n  ')}`);
    return;
  }

  const skipInstall = args.includes('--no-install');
  const tags = args.find((arg) => arg.startsWith('--tags='))?.slice('--tags='.length);
  const named = args.filter((arg) => !arg.startsWith('--'));

  mkdirSync(ARTIFACTS, { recursive: true });

  const adb = adbBin();
  const attached = quiet(adb, ['devices'])
    .stdout.split('\n')
    .slice(1)
    .filter((line) => line.trim().endsWith('device'));

  if (attached.length === 0) {
    fail(
      'No device or emulator is attached.\n' +
        '  Start one:  emulator -avd <name>\n' +
        '  Or connect a phone with USB debugging enabled.',
    );
  }
  console.log(`Device: ${attached[0].split('\t')[0]}`);
  wake(adb);
  silenceAutofill(adb);
  tunnel(adb, 3000);

  if (!skipInstall) {
    if (!existsSync(APK)) {
      fail(
        `No test build at ${APK}.\n` +
          '  The emulator is x86_64 and the distributed APK is arm64, so the test\n' +
          '  build is a separate artefact. Build it first — see .maestro/README.md.',
      );
    }
    console.log('Installing the test build...');
    // `-r` reinstalls over the existing app and keeps its data; `clearState` in
    // the first flows is what resets the account, not the install.
    run(adb, ['install', '-r', APK]);
  }

  const stamp = Date.now();
  stageUpload(adb, stamp);
  await checkApi();

  const env = Object.entries(suiteEnv(stamp)).flatMap(([key, value]) => ['-e', `${key}=${value}`]);
  const report = path.join(ARTIFACTS, 'report.xml');
  const target =
    named.length > 0 ? named.map((name) => path.join(FLOWS, resolveFlow(name))) : [FLOWS];

  console.log(
    `Running ${named.length > 0 ? named.join(', ') : 'every flow'}` +
      `${tags ? ` tagged ${tags}` : ''}\n`,
  );

  try {
    run(maestroBin(), [
      'test',
      ...env,
      ...(tags ? ['--include-tags', tags] : []),
      '--format',
      'junit',
      '--output',
      report,
      ...target,
    ]);
  } finally {
    // Printed either way: on a pass it says what ran, and on a failure it is the
    // first place to look.
    console.log(`\nReport:      ${report}`);
    console.log(`Screenshots: ${ARTIFACTS}`);
  }
}

void main();
