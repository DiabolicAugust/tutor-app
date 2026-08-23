import { useCallback, useMemo, useState } from 'react';

export type Steps = {
  /** Zero-based. */
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  /** Advances, stopping at the last step rather than wrapping. */
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
};

/**
 * Position in a short, linear sequence.
 *
 * The clamping is the point. Every place that tracks a step index ends up
 * needing "do not go past the end" and "do not go below zero", and those two
 * conditions written inline at four call sites are four chances to get one
 * wrong — usually the one that only shows up on the last step.
 */
export function useSteps(total: number, initial = 0): Steps {
  const [index, setIndex] = useState(initial);

  const goTo = useCallback(
    (next: number) => setIndex(Math.min(Math.max(next, 0), Math.max(total - 1, 0))),
    [total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const back = useCallback(() => goTo(index - 1), [goTo, index]);

  return useMemo(
    () => ({
      index,
      total,
      isFirst: index === 0,
      isLast: index === total - 1,
      next,
      back,
      goTo,
    }),
    [index, total, next, back, goTo],
  );
}
