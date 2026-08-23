import type { Student } from '@/shared/students/student';

/**
 * Test roster. `paidLessonsLeft` is varied deliberately: the low values are what
 * make the "paid lessons running out" reminders meaningful in a test build.
 */
export const fixtureStudents: Student[] = [
  { id: 'student-anna', name: 'Anna Koval', subject: 'Mathematics', paidLessonsLeft: 2 },
  { id: 'student-petro', name: 'Petro Melnyk', subject: 'Algebra', paidLessonsLeft: 1 },
  { id: 'student-sofia', name: 'Sofia Bondar', subject: 'Geometry', paidLessonsLeft: 8 },
  { id: 'student-maksym', name: 'Maksym Zhuk', subject: 'Mathematics', paidLessonsLeft: 5 },
  { id: 'student-ivan', name: 'Ivan Shevchenko', subject: 'Mathematics', paidLessonsLeft: 12 },
  { id: 'student-mariia', name: 'Mariia Tkachenko', subject: 'Mathematics', paidLessonsLeft: 4 },
  { id: 'student-yaroslav', name: 'Yaroslav Bilyk', subject: 'Mathematics', paidLessonsLeft: 6 },
  // Taught by colleagues; present so their lessons resolve to a name too.
  { id: 'student-daria', name: 'Daria Sydorenko', subject: 'English', paidLessonsLeft: 3 },
  { id: 'student-kateryna', name: 'Kateryna Lymar', subject: 'English', paidLessonsLeft: 7 },
  { id: 'student-ihor', name: 'Ihor Palii', subject: 'Physics', paidLessonsLeft: 9 },
  { id: 'student-oleh', name: 'Oleh Kravets', subject: 'Chemistry', paidLessonsLeft: 2 },
];
