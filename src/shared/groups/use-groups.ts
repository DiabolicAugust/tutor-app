import { useCallback, useMemo, useState } from 'react';

import { apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import { byGroupName, type Group, type GroupPatch, type NewGroupInput } from './group';
import type { GroupsClient } from './groups-client';

export type GroupsState = {
  groups: Group[];
  isLoading: boolean;
  hasError: boolean;
  create: (input: NewGroupInput) => Promise<Group | null>;
  update: (id: string, patch: GroupPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addMember: (groupId: string, studentId: string) => Promise<void>;
  removeMember: (groupId: string, studentId: string) => Promise<void>;
};

/**
 * The caller's groups.
 *
 * Local state rather than a provider: groups are managed on one screen, and the
 * calendar gets a group's name and members *with the lesson* rather than by
 * looking it up — so there is no app-wide reader that would need a store.
 *
 * Every write takes the whole group back from the server and swaps it in, which
 * is what keeps membership honest: the server owns the ordering and the dedup,
 * and re-deriving either here would be a second opinion.
 */
export function useGroups(client: GroupsClient = apiClients.groups): GroupsState {
  const [hasError, setHasError] = useState(false);

  const { data, isLoading, setData } = useAsyncData('groups', async () =>
    (await client.list()).sort(byGroupName),
  );

  const groups = useMemo(() => data ?? [], [data]);

  const swap = useCallback(
    (updated: Group) =>
      setData((current) =>
        (current ?? []).map((group) => (group.id === updated.id ? updated : group)),
      ),
    [setData],
  );

  const create = useCallback(
    async (input: NewGroupInput) => {
      setHasError(false);
      try {
        const created = await client.create(input);
        setData((current) => [...(current ?? []), created].sort(byGroupName));
        return created;
      } catch {
        setHasError(true);
        return null;
      }
    },
    [client, setData],
  );

  const update = useCallback(
    async (id: string, patch: GroupPatch) => {
      setHasError(false);
      try {
        swap(await client.update(id, patch));
      } catch {
        setHasError(true);
      }
    },
    [client, swap],
  );

  const remove = useCallback(
    async (id: string) => {
      setHasError(false);
      // Removed locally first: it is already gone as far as the person who asked
      // is concerned, and putting it back on failure is clearer than a list that
      // does not react to a tap.
      const previous = groups;
      setData(previous.filter((group) => group.id !== id));

      try {
        await client.remove(id);
      } catch {
        setData(previous);
        setHasError(true);
      }
    },
    [client, groups, setData],
  );

  const addMember = useCallback(
    async (groupId: string, studentId: string) => {
      setHasError(false);
      try {
        swap(await client.addMember(groupId, studentId));
      } catch {
        setHasError(true);
      }
    },
    [client, swap],
  );

  const removeMember = useCallback(
    async (groupId: string, studentId: string) => {
      setHasError(false);
      try {
        swap(await client.removeMember(groupId, studentId));
      } catch {
        setHasError(true);
      }
    },
    [client, swap],
  );

  return {
    groups,
    isLoading,
    hasError,
    create,
    update,
    remove,
    addMember,
    removeMember,
  };
}
