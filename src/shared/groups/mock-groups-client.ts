import { fixtures } from '@/shared/fixtures';

import type { Group } from './group';
import type { GroupsClient } from './groups-client';

/**
 * Fixture-backed groups.
 *
 * Edits are kept in memory so the flow is genuinely exercisable in a test build —
 * make a group, put somebody in it, take them out. Nothing survives a reload,
 * which is the honest behaviour with no server to store it.
 */
let live: Group[] | null = null;
let localId = 0;

/** Copied on first use, so the fixture array itself is never mutated. */
function groups(): Group[] {
  return (live ??= fixtures.groups.map((group) => ({
    ...group,
    members: [...group.members],
  })));
}

function find(id: string): Group {
  const group = groups().find((candidate) => candidate.id === id);
  if (!group) throw new Error(`Unknown group: ${id}`);
  return group;
}

/**
 * The subject row a form named by id.
 *
 * Null for an id the fixtures do not hold, which is what the server would
 * effectively answer too — it refuses an unknown id outright.
 */
function subjectById(id: string) {
  return fixtures.subjects.find((subject) => subject.id === id) ?? null;
}

function replace(updated: Group): Group {
  live = groups().map((group) => (group.id === updated.id ? updated : group));
  return updated;
}

export const mockGroupsClient: GroupsClient = {
  async list() {
    return groups().map((group) => ({ ...group, members: [...group.members] }));
  },

  async create(input) {
    localId += 1;
    const group: Group = {
      id: `local-group-${localId}`,
      name: input.name.trim(),
      subject: subjectById(input.subjectId),
      level: input.level?.trim() || null,
      tutorId: 'me',
      members: [],
    };
    live = [...groups(), group];
    return group;
  },

  async update(id, patch) {
    const group = find(id);
    return replace({
      ...group,
      name: patch.name?.trim() ?? group.name,
      // A group is defined by what it studies, so an absent id means unchanged
      // rather than cleared — the same rule the API applies.
      subject: patch.subjectId ? subjectById(patch.subjectId) : group.subject,
      // Distinguishes "not mentioned" from "cleared", the same way the API does.
      level: patch.level === undefined ? group.level : patch.level.trim() || null,
    });
  },

  async remove(id) {
    live = groups().filter((group) => group.id !== id);
  },

  async addMember(groupId, studentId) {
    const group = find(groupId);
    if (group.members.some((member) => member.student.id === studentId)) {
      return group;
    }

    const student = fixtures.students.find(
      (candidate) => candidate.id === studentId,
    );
    if (!student) throw new Error(`Unknown student: ${studentId}`);

    return replace({
      ...group,
      members: [
        ...group.members,
        {
          student: {
            id: student.id,
            name: student.name,
            subject: student.subject,
            paidLessonsLeft: student.paidLessonsLeft,
          },
        },
      ].sort((a, b) => a.student.name.localeCompare(b.student.name)),
    });
  },

  async removeMember(groupId, studentId) {
    const group = find(groupId);
    return replace({
      ...group,
      members: group.members.filter(
        (member) => member.student.id !== studentId,
      ),
    });
  },
};
