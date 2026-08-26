import { useMemo } from 'react';

import { apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import type { Report, ReportPeriod } from './report';
import type { ReportsClient } from './reports-client';

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReportQuery = {
  period: ReportPeriod;
  /** One tutor, or undefined for whatever the caller is entitled to by default. */
  tutorId?: string;
};

export type ReportState = {
  report: Report | null;
  isLoading: boolean;
  hasError: boolean;
  reload: () => void;
};

/**
 * The report for a period.
 *
 * The window is computed once per query rather than on every render, which is
 * not a performance concern but a correctness one: `new Date()` in the render
 * body would change the key on every frame and refetch forever.
 *
 * `to` is the end of today rather than this instant, so lessons later today are
 * counted as "still to come" instead of falling outside the window entirely.
 */
export function useReport(
  { period, tutorId }: ReportQuery,
  client: ReportsClient = apiClients.reports,
): ReportState {
  const window = useMemo(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);

    return {
      from: new Date(to.getTime() - period * DAY_MS).toISOString(),
      to: to.toISOString(),
    };
    // Recomputed when the period changes, and deliberately not when the clock
    // moves: a screen that refetches because a second passed is a screen that
    // never settles.
  }, [period]);

  const { data, isLoading, hasError, reload } = useAsyncData(
    `${window.from}:${window.to}:${tutorId ?? 'default'}`,
    () => client.summary({ ...window, tutorId }),
  );

  return { report: data, isLoading, hasError, reload };
}
