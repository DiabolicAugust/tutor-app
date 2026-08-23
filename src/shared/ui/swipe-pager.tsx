import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

export type SwipePagerProps = {
  children: ReactNode;
  /** Swipe right-to-left: the next page. */
  onNext: () => void;
  /** Swipe left-to-right: the previous page. */
  onPrevious: () => void;
  enabled?: boolean;
};

/**
 * How far a horizontal drag must travel before it counts as a page turn.
 *
 * Generous on purpose. The content underneath scrolls vertically, and a thumb
 * moving down a list wanders sideways by twenty or thirty points without meaning
 * anything by it.
 */
const DISTANCE_THRESHOLD = 60;

/**
 * Also accepted: a short, fast flick. Without it a quick swipe that covers less
 * than the threshold does nothing, which reads as the gesture being ignored
 * rather than as not having swiped far enough.
 */
const VELOCITY_THRESHOLD = 500;

/**
 * Turns pages with a horizontal swipe.
 *
 * `failOffsetY` is what makes this usable over a scrolling list: the gesture
 * gives up as soon as the finger has moved further vertically than horizontally,
 * so scrolling never turns into an accidental page turn.
 *
 * The direction is decided from the *end* of the gesture rather than tracked
 * live, because the pages here are not laid out side by side — the calendar
 * re-renders around a new date. A live-tracking implementation would need three
 * days mounted at once to have something to slide.
 */
export function SwipePager({ children, onNext, onPrevious, enabled = true }: SwipePagerProps) {
  const swipe = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-20, 20])
    .failOffsetY([-25, 25])
    .onEnd((event) => {
      'worklet';
      const farEnough = Math.abs(event.translationX) > DISTANCE_THRESHOLD;
      const fastEnough = Math.abs(event.velocityX) > VELOCITY_THRESHOLD;
      if (!farEnough && !fastEnough) return;

      // Dragging left reveals what comes after, the way a paper calendar turns.
      runOnJS(event.translationX < 0 ? onNext : onPrevious)();
    });

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
