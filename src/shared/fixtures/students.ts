import type { Student } from '@/shared/students/student';
import { fixtureOwnCalendarId } from '@/shared/tutors/tutor';

import { fixtureSubject } from './subjects';

/**
 * Test roster. `paidLessonsLeft` is varied deliberately: the low values are what
 * make the "paid lessons running out" reminders meaningful in a test build.
 */
export const fixtureStudents: Student[] = [
  { id: 'student-anna', tutorId: fixtureOwnCalendarId, name: 'Anna Koval', subject: fixtureSubject('Mathematics'), paidLessonsLeft: 2 },
  { id: 'student-petro', tutorId: fixtureOwnCalendarId, name: 'Petro Melnyk', subject: fixtureSubject('Algebra'), paidLessonsLeft: 1 },
  { id: 'student-sofia', tutorId: fixtureOwnCalendarId, name: 'Sofia Bondar', subject: fixtureSubject('Geometry'), paidLessonsLeft: 8 },
  { id: 'student-maksym', tutorId: fixtureOwnCalendarId, name: 'Maksym Zhuk', subject: fixtureSubject('Mathematics'), paidLessonsLeft: 5 },
  { id: 'student-ivan', tutorId: fixtureOwnCalendarId, name: 'Ivan Shevchenko', subject: fixtureSubject('Mathematics'), paidLessonsLeft: 12 },
  { id: 'student-mariia', tutorId: fixtureOwnCalendarId, name: 'Mariia Tkachenko', subject: fixtureSubject('Mathematics'), paidLessonsLeft: 4 },
  { id: 'student-yaroslav', tutorId: fixtureOwnCalendarId, name: 'Yaroslav Bilyk', subject: fixtureSubject('Mathematics'), paidLessonsLeft: 6 },
  // Taught by colleagues: present so their lessons resolve to a name, but
  // excluded from the booking picker by `ownStudents`.
  //
  // Oleh studies Chemistry, which the school has retired. That is deliberate: it
  // is the one case where a record names a subject no form will offer, and the
  // screens have to show it rather than a blank.
  { id: 'student-daria', tutorId: 'tutor-2', name: 'Daria Sydorenko', subject: fixtureSubject('English'), paidLessonsLeft: 3 },
  { id: 'student-kateryna', tutorId: 'tutor-2', name: 'Kateryna Lymar', subject: fixtureSubject('English'), paidLessonsLeft: 7 },
  { id: 'student-ihor', tutorId: 'tutor-3', name: 'Ihor Palii', subject: fixtureSubject('Physics'), paidLessonsLeft: 9 },
  { id: 'student-oleh', tutorId: 'tutor-4', name: 'Oleh Kravets', subject: fixtureSubject('Chemistry'), paidLessonsLeft: 2 },
];
