import { http } from '@/shared/api/http';

import type { Debtor } from './debtor';

/**
 * Reading the list.
 *
 * One call, and the server decides whose students it covers — a tutor's own, or
 * the school's for an admin. The app does not ask, because a screen that chose
 * its own scope would eventually disagree with what the server is willing to
 * answer.
 */
export type DebtorsClient = {
  /**
   * `atOrBelow` is how many lessons may be left and still appear. Zero — out of
   * lessons — is the default and what the screen asks for.
   */
  list: (query?: { atOrBelow?: number }) => Promise<Debtor[]>;
};

export const httpDebtorsClient: DebtorsClient = {
  list: (query) =>
    http.get<Debtor[]>('/reports/debtors', {
      atOrBelow: query?.atOrBelow === undefined ? undefined : String(query.atOrBelow),
    }),
};
