import { fixtureColleagues } from './colleagues';
import { fixturesEnabled } from './enabled';
import { fixtureLessons } from './lessons';
import { fixtureNotes, fixtureOwnName } from './notes';
import { fixtureNotifications } from './notifications';
import { fixtureInvitations, fixtureMembers, fixtureSchoolName } from './school';
import { fixtureStudentFiles } from './student-files';
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
  schoolMembers: fixturesEnabled ? fixtureMembers : [],
  invitations: fixturesEnabled ? fixtureInvitations : [],
  notes: fixturesEnabled ? fixtureNotes : [],
  studentFiles: fixturesEnabled ? fixtureStudentFiles : [],
  schoolName: fixturesEnabled ? fixtureSchoolName : '',
  /** The signed-in tutor's display name, for anything a fixture attributes. */
  ownName: fixturesEnabled ? fixtureOwnName : '',
} as const;
