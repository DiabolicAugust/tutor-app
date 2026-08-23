import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';

import type { TutorialAnchor } from './tutorial';
import { useTutorial } from './use-tutorial';

/**
 * Marks a view as something the tour can point at.
 *
 * Returns props to spread onto the view. Measuring happens only while a tour is
 * running, so a screen carrying anchors costs nothing on the many more occasions
 * when nobody is being shown around.
 *
 * Measured on **two** occasions, and both are needed. On layout, which covers
 * scrolling, rotation and a screen appearing; and when the current step changes,
 * because starting a tour is not a layout change — the view is already sitting
 * where it was, so waiting for `onLayout` alone meant the first step had nothing
 * to highlight until something happened to move.
 *
 * @example
 * const anchor = useTutorialAnchor('calendar.add');
 * return <View {...anchor}>…</View>;
 */
export function useTutorialAnchor(anchor: TutorialAnchor) {
  const { step, measureAnchor } = useTutorial();
  const ref = useRef<View>(null);
  const isRunning = step !== null;

  const measure = useCallback(() => {
    if (!isRunning) return;

    // Window coordinates, not parent-relative: the overlay is a sibling of the
    // whole screen, so anything relative to a scroll container would be wrong by
    // however far that container had scrolled. The overlay subtracts its own
    // origin to get back to its coordinates.
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) return;
      measureAnchor(anchor, { x, y, width, height });
    });
  }, [anchor, isRunning, measureAnchor]);

  // `measure` writes state only from `measureInWindow`'s callback, which runs
  // after this effect has returned — so nothing is set synchronously here.
  useEffect(measure, [measure, step?.id]);

  const onLayout = useCallback((_event: LayoutChangeEvent) => measure(), [measure]);

  return { ref, onLayout, collapsable: false } as const;
}
