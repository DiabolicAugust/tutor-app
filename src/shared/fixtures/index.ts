import { fixtureColleagues } from './colleagues';
import { fixturesEnabled } from './enabled';
import { fixtureLessons } from './lessons';
import { fixtureNotifications } from './notifications';
import { fixtureStudents } from './students';

export { fixturesEnabled };

/**
 * All test data, behind one gate.
 *
 * Stores read from here rather than importing fixture modules directly, so
 * "is this build on test data?" is answered in exactly one place, and a
 * production build gets empty collections instead of invented people.
 *
 * **When adding or changing a feature, update the fixtures with it** — a test
 * build is expected to demonstrate everything the app can do.
 */
export const fixtures = {
  lessons: fixturesEnabled ? fixtureLessons : [],
  notifications: fixturesEnabled ? fixtureNotifications : [],
  colleagues: fixturesEnabled ? fixtureColleagues : [],
  students: fixturesEnabled ? fixtureStudents : [],
} as const;
