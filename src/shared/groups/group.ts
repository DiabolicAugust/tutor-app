import type { Subject } from '@/shared/subjects/subject';

/**
 * A set of students taught together.
 *
 * The container a group lesson hangs off, rather than a list of students on the
 * lesson: membership changes, and the schedule has to follow it. Adding somebody
 * to a group on Tuesday puts them in Wednesday's lesson without anybody editing
 * the lesson.
 */

/** A student as a group's member list carries them. */
export type GroupMember = {
  student: {
    id: string;
    name: string;
    subject: Subject | null;
    paidLessonsLeft: number;
  };
};

export type Group = {
  id: string;
  name: string;
  /**
   * What the group studies.
   *
   * Nullable on the wire like everywhere else, though a group created through
   * this app always has one — the form requires it, and a group is defined by
   * its subject.
   */
  subject: Subject | null;
  /** Free text — "B1", "Beginners", "Year 9". Null when the school does not use one. */
  level: string | null;
  /** Whose group it is; a tutor sees their own, an admin the school's. */
  tutorId: string;
  members: GroupMember[];
};

export type NewGroupInput = {
  name: string;
  /** An id from the school's list, not a name typed in. */
  subjectId: string;
  level?: string;
};

export type GroupPatch = Partial<NewGroupInput>;

/** Alphabetical, the order a roster is read in. */
export function byGroupName(a: Group, b: Group): number {
  return a.name.localeCompare(b.name);
}

/** The students in a group, flattened — the shape every screen actually wants. */
export function membersOf(group: Group): GroupMember['student'][] {
  return group.members.map((member) => member.student);
}

/**
 * How a group is labelled in one line.
 *
 * The level is worth showing when there is one, because two groups called
 * "Tuesdays" are told apart by it and by nothing else.
 *
 * Returns an empty string for a group with neither, rather than the word "null":
 * callers put this straight into a description, and a group created through this
 * app always has a subject, so the empty case is only ever data from elsewhere.
 */
export function describeGroup(group: Group): string {
  const subject = group.subject?.name ?? '';
  if (!group.level) return subject;
  return subject ? `${subject} · ${group.level}` : group.level;
}
