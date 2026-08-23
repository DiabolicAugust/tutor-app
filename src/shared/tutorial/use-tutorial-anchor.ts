import { useCallback, useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';

import type { TutorialAnchor } from './tutorial';
import { useTutorial } from './use-tutorial';

/**
 * Marks a view as something the tour can point at.
 *
 * Returns props to spread onto the view. Measuring happens on layout and only
 * while a tour is running, so a screen carrying anchors costs nothing on the
 * many more occasions when nobody is being shown around.
 *
 * @example
 * const anchor = useTutorialAnchor('calendar.add');
 * return <View {...anchor}>…</View>;
 */
export function useTutorialAnchor(anchor: TutorialAnchor) {
  const { step, measureAnchor } = useTutorial();
  const ref = useRef<View>(null);
  const isRunning = step !== null;

  const onLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      if (!isRunning) return;

      // Window coordinates, not parent-relative: the overlay is a sibling of the
      // whole screen, so anything relative to a scroll container would be wrong
      // by however far that container had scrolled.
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width === 0 && height === 0) return;
        measureAnchor(anchor, { x, y, width, height });
      });
    },
    [anchor, isRunning, measureAnchor],
  );

  return { ref, onLayout, collapsable: false } as const;
}
