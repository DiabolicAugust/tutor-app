import type { Student } from '@/shared/students/student';
import { ownCalendarId } from '@/shared/tutors/tutor';

/**
 * Test roster. `paidLessonsLeft` is varied deliberately: the low values are what
 * make the "paid lessons running out" reminders meaningful in a test build.
 */
export const fixtureStudents: Student[] = [
  { id: 'student-anna', tutorId: ownCalendarId, name: 'Anna Koval', subject: 'Mathematics', paidLessonsLeft: 2 },
  { id: 'student-petro', tutorId: ownCalendarId, name: 'Petro Melnyk', subject: 'Algebra', paidLessonsLeft: 1 },
  { id: 'student-sofia', tutorId: ownCalendarId, name: 'Sofia Bondar', subject: 'Geometry', paidLessonsLeft: 8 },
  { id: 'student-maksym', tutorId: ownCalendarId, name: 'Maksym Zhuk', subject: 'Mathematics', paidLessonsLeft: 5 },
  { id: 'student-ivan', tutorId: ownCalendarId, name: 'Ivan Shevchenko', subject: 'Mathematics', paidLessonsLeft: 12 },
  { id: 'student-mariia', tutorId: ownCalendarId, name: 'Mariia Tkachenko', subject: 'Mathematics', paidLessonsLeft: 4 },
  { id: 'student-yaroslav', tutorId: ownCalendarId, name: 'Yaroslav Bilyk', subject: 'Mathematics', paidLessonsLeft: 6 },
  // Taught by colleagues: present so their lessons resolve to a name, but
  // excluded from the booking picker by `ownStudents`.
  { id: 'student-daria', tutorId: 'tutor-2', name: 'Daria Sydorenko', subject: 'English', paidLessonsLeft: 3 },
  { id: 'student-kateryna', tutorId: 'tutor-2', name: 'Kateryna Lymar', subject: 'English', paidLessonsLeft: 7 },
  { id: 'student-ihor', tutorId: 'tutor-3', name: 'Ihor Palii', subject: 'Physics', paidLessonsLeft: 9 },
  { id: 'student-oleh', tutorId: 'tutor-4', name: 'Oleh Kravets', subject: 'Chemistry', paidLessonsLeft: 2 },
];
