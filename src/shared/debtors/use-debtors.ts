import { apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import type { Debtor } from './debtor';
import type { DebtorsClient } from './debtors-client';

export type DebtorsState = {
  debtors: Debtor[] | null;
  isLoading: boolean;
  hasError: boolean;
  reload: () => void;
};

/**
 * The list, reloaded when the threshold changes.
 *
 * `null` while loading and on failure, which the screen distinguishes with
 * `hasError` — an empty list here is good news and has to read as good news,
 * never as a request that quietly failed.
 */
export function useDebtors(
  atOrBelow: number,
  client: DebtorsClient = apiClients.debtors,
): DebtorsState {
  const { data, isLoading, hasError, reload } = useAsyncData(
    `debtors:${atOrBelow}`,
    () => client.list({ atOrBelow }),
  );

  return { debtors: data, isLoading, hasError, reload };
}
