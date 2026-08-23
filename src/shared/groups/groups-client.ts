import { http } from '@/shared/api/http';

import type { Group, GroupPatch, NewGroupInput } from './group';

/**
 * The seam for groups.
 *
 * Every membership call returns the whole group rather than the member it
 * touched, so no screen has to merge two shapes to know what the group now looks
 * like — the server already decided, and a client-side merge would be a second
 * opinion that can disagree.
 */
export type GroupsClient = {
  list: () => Promise<Group[]>;
  create: (input: NewGroupInput) => Promise<Group>;
  update: (id: string, patch: GroupPatch) => Promise<Group>;
  remove: (id: string) => Promise<void>;
  addMember: (groupId: string, studentId: string) => Promise<Group>;
  removeMember: (groupId: string, studentId: string) => Promise<Group>;
};

export const httpGroupsClient: GroupsClient = {
  list: () => http.get<Group[]>('/groups'),
  create: (input) => http.post<Group>('/groups', input),
  update: (id, patch) => http.patch<Group>(`/groups/${id}`, patch),
  remove: async (id) => {
    await http.delete<void>(`/groups/${id}`);
  },
  addMember: (groupId, studentId) =>
    http.post<Group>(`/groups/${groupId}/members`, { studentId }),
  removeMember: (groupId, studentId) =>
    http.delete<Group>(`/groups/${groupId}/members/${studentId}`),
};
