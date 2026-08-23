/**
 * Whether the app runs on test data.
 *
 * On in development, and in any build started with `EXPO_PUBLIC_FIXTURES=1` —
 * that is how a shareable test build is produced. Off everywhere else, so a
 * production build ships no invented students, lessons or announcements.
 *
 * `EXPO_PUBLIC_*` variables are inlined at bundle time, so this constant folds
 * to a literal and the fixture modules are dropped from a production bundle
 * rather than merely unused.
 */
export const fixturesEnabled = __DEV__ || process.env.EXPO_PUBLIC_FIXTURES === '1';
