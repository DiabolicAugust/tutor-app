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
    subject: string;
    paidLessonsLeft: number;
  };
};

export type Group = {
  id: string;
  name: string;
  subject: string;
  /** Free text — "B1", "Beginners", "Year 9". Null when the school does not use one. */
  level: string | null;
  /** Whose group it is; a tutor sees their own, an admin the school's. */
  tutorId: string;
  members: GroupMember[];
};

export type NewGroupInput = {
  name: string;
  subject: string;
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
 */
export function describeGroup(group: Group): string {
  return group.level ? `${group.subject} · ${group.level}` : group.subject;
}
