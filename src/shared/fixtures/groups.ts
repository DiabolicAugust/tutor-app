import type { Group } from '@/shared/groups/group';

import { fixtureStudents } from './students';

/**
 * Test groups.
 *
 * One full group and one empty one, because both render differently and both are
 * real: a group is created before anybody is put in it, and "no students yet" is
 * a state the screens have to handle rather than an error.
 */

/** Members by id, so a renamed fixture student cannot silently vanish here. */
function member(id: string) {
  const student = fixtureStudents.find((candidate) => candidate.id === id);
  if (!student) throw new Error(`Unknown fixture student: ${id}`);

  return {
    student: {
      id: student.id,
      name: student.name,
      subject: student.subject,
      paidLessonsLeft: student.paidLessonsLeft,
    },
  };
}

export const fixtureGroups: Group[] = [
  {
    id: 'group-b1',
    name: 'B1 Tuesdays',
    subject: 'Mathematics',
    level: 'B1',
    tutorId: 'me',
    members: [
      member('student-anna'),
      member('student-petro'),
      member('student-sofia'),
    ],
  },
  {
    id: 'group-exam',
    name: 'Exam prep',
    subject: 'Mathematics',
    level: 'Year 9',
    tutorId: 'me',
    members: [member('student-ivan'), member('student-maksym')],
  },
  // Deliberately empty: creating a group before filling it is the ordinary order
  // of events, and the roster has to read correctly in that state.
  {
    id: 'group-new',
    name: 'Conversation club',
    subject: 'Mathematics',
    level: null,
    tutorId: 'me',
    members: [],
  },
];
