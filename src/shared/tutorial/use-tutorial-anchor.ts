import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';

import type { TutorialAnchor } from './tutorial';
import { useTutorial } from './use-tutorial';

/**
 * When to measure, after a step changes.
 *
 * A step can change screen, and a screen that is still arriving reports the
 * position it is passing through — so one measurement on the way in is not
 * enough. Waiting for `onLayout` is not enough either: it does not fire for a
 * view that has not moved. So the anchor is measured a few times across the
 * transition and the last word wins. Identical rectangles are discarded by the
 * provider, so the extra passes cost nothing but a comparison.
 */
const SETTLE_MS = [0, 120, 350, 700] as const;

/**
 * Marks a view as something the tour can point at.
 *
 * Returns props to spread onto the view. Measuring happens only while a tour is
 * running, so a screen carrying anchors costs nothing on the many more occasions
 * when nobody is being shown around.
 *
 * Window coordinates, reported as they come and **not** corrected against the
 * overlay's own position. The overlay is drawn edge to edge from the window's
 * origin, so the two frames are the same one; subtracting a separately measured
 * overlay origin was an attempt to fix a status-bar-sized error that put a
 * status-bar-sized error back in the other direction. Verified against the app:
 * the overlay measures at 0,0 and every highlight lands on its control.
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

    ref.current?.measureInWindow((x, y, width, height) => {
      // A view mid-transition can report no size at all, and a zero-sized
      // highlight is worse than none: it draws a ring around a point.
      if (width === 0 && height === 0) return;
      measureAnchor(anchor, { x, y, width, height });
    });
  }, [anchor, isRunning, measureAnchor]);

  // Nothing is set synchronously here: `measureInWindow` answers in a callback.
  useEffect(() => {
    if (!isRunning) return;

    const timers = SETTLE_MS.map((delay) => setTimeout(measure, delay));
    return () => timers.forEach(clearTimeout);
  }, [measure, isRunning, step?.id]);

  // Covers scrolling and rotation, which move an anchor without changing steps.
  const onLayout = useCallback((_event: LayoutChangeEvent) => measure(), [measure]);

  return { ref, onLayout, collapsable: false } as const;
}
