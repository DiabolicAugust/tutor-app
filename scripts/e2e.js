#!/usr/bin/env node
// Runs the Maestro flows in `.maestro/` against whatever device is attached.
//
// A script rather than an npm one-liner because three things have to be true
// before the first tap and each of them fails in a way that is hard to read from
// Maestro's output alone: a device has to be attached, the build has to be
// installed, and the flows need a fresh account.
//
// Usage:
//   npm run e2e                 # install the e2e APK, then run every flow
//   npm run e2e -- 02-sign-in   # one flow by name, no reinstall
//   npm run e2e -- --no-install # keep what is on the device

const { execFileSync, spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const APK = path.join(__dirname, '..', 'builds', 'e2e-x86_64.apk');
const FLOWS = path.join(__dirname, '..', '.maestro');

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
          'C:\maestro\bin\maestro.bat',
        ]
      : ['maestro', path.join(os.homedir(), '.maestro', 'bin', 'maestro')];

  for (const candidate of candidates) {
    if (candidate.includes(path.sep) ? existsSync(candidate) : onPath(candidate)) {
      return candidate;
    }
  }

  fail(
    'Maestro was not found.\n' +
      '  Install it from https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli\n' +
      '  or point MAESTRO_BIN at the binary.',
  );
}

function onPath(command) {
  const probe = spawnSync(command, ['--version'], { stdio: 'ignore', shell: true });
  return probe.status === 0;
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

/** Wakes the screen, unlocks it, and keeps it awake for the run. */
function wake(adb) {
  const quiet = { stdio: 'ignore', shell: true };
  spawnSync(adb, ['shell', 'input', 'keyevent', 'KEYCODE_WAKEUP'], quiet);
  spawnSync(adb, ['shell', 'wm', 'dismiss-keyguard'], quiet);
  // An emulator reports as charging, so this holds the screen on until the run
  // ends rather than for a fixed timeout.
  spawnSync(adb, ['shell', 'svc', 'power', 'stayon', 'true'], quiet);
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', shell: true, ...options });
}

function main() {
  const args = process.argv.slice(2);
  const skipInstall = args.includes('--no-install');
  const named = args.filter((arg) => !arg.startsWith('--'));

  const adb = adbBin();
  const attached = execFileSync(adb, ['devices'], { encoding: 'utf8', shell: true })
    .split('\n')
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

  // An emulator left alone goes to sleep, and a sleeping screen renders black
  // with an empty view hierarchy — which looks exactly like an app that failed
  // to launch. That cost a real detour once; it is three commands to prevent.
  wake(adb);

  if (!skipInstall) {
    if (!existsSync(APK)) {
      fail(
        `No test build at ${APK}.\n` +
          '  The emulator is x86_64 and the distributed APK is arm64, so the test\n' +
          '  build is a separate artefact. Build it first — see the README.',
      );
    }
    console.log('Installing the test build...');
    // `-r` reinstalls over the existing app and keeps its data; `clearState` in
    // the first flow is what resets the account, not the install.
    run(adb, ['install', '-r', APK]);
  }

  // Unique per run: a school name and an admin email can each be registered
  // once, so a fixed value would pass exactly one time and then fail forever.
  //
  // No spaces in either. `shell: true` is required to run Maestro's `.bat` on
  // Windows, and a shell splits an unquoted `SCHOOL=Maestro School 123` into
  // arguments — Maestro then looked for a flow called "School". Hyphens avoid
  // the whole quoting question rather than trying to win it.
  const stamp = Date.now();
  const env = [
    '-e',
    `EMAIL=maestro-${stamp}@example.test`,
    '-e',
    `SCHOOL=Maestro-School-${stamp}`,
  ];

  const target = named.length > 0 ? named.map((name) => path.join(FLOWS, resolveFlow(name))) : [FLOWS];

  console.log(`Running: ${named.length > 0 ? named.join(', ') : 'every flow'}\n`);
  run(maestroBin(), ['test', ...env, ...target]);
}

/** Accepts `02-sign-in`, `02`, or the full filename. */
function resolveFlow(name) {
  if (name.endsWith('.yaml')) return name;
  const { readdirSync } = require('node:fs');
  const match = readdirSync(FLOWS).find(
    (file) => file.endsWith('.yaml') && file !== 'config.yaml' && file.startsWith(name),
  );
  if (!match) fail(`No flow matches "${name}". Available:\n  ${readdirSync(FLOWS).join('\n  ')}`);
  return match;
}

main();
