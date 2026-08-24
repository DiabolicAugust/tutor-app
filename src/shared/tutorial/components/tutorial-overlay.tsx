import { useCallback, useState } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { useT } from '@/shared/i18n';
import { createStyles, durations } from '@/shared/theme';
import { Button, StepDots, Text } from '@/shared/ui';

import { useTutorial } from '../use-tutorial';
import { Spotlight } from './spotlight';

/** Kept clear of the notch and the home indicator without measuring insets. */
const EDGE_MARGIN = 24;
const CARD_GAP = 16;
/** Enough for a title, two lines of body, dots and a row of buttons. */
const ESTIMATED_CARD_HEIGHT = 200;

/**
 * The tour, drawn over the app.
 *
 * Mounted as a sibling of the navigator rather than inside a screen, so it can
 * point at anything and survives the navigation each step performs. Nothing
 * here knows what any step says — the copy comes from the registry.
 */
export function TutorialOverlay() {
  const { t } = useT();
  const styles = useStyles();
  const { height: screenHeight } = useWindowDimensions();
  const { step, position, total, isLast, next, back, finish, anchorRect } = useTutorial();

  /**
   * This overlay's own height, for placing the card.
   *
   * From `onLayout` rather than a measurement: the only thing needed is how tall
   * the overlay is, and its layout event says so without asking where it is —
   * which is the question that produced two rounds of highlights landing a status
   * bar away from what they pointed at.
   */
  const [height, setHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setHeight(event.nativeEvent.layout.height);
  }, []);

  if (!step) return null;

  return (
    <View
      testID="tour-overlay"
      style={styles.container}
      pointerEvents="box-none"
      onLayout={onLayout}
    >
      {/* Fades in rather than appearing: the screen going dark instantly reads
          as something breaking. */}
      <Animated.View
        style={styles.container}
        entering={FadeIn.duration(durations.normal)}
        exiting={FadeOut.duration(durations.fast)}
        pointerEvents="none"
      >
        <Spotlight rect={anchorRect} />
      </Animated.View>

      {/* Moves between positions instead of jumping, so it stays the same card
          walking around the app rather than five different ones. */}
      <Animated.View
        style={[
          styles.card,
          // The overlay's own height once it is known; the window's until then.
          cardPosition(anchorRect, step.placement, height || screenHeight),
        ]}
        layout={LinearTransition.duration(durations.normal)}
        entering={FadeIn.duration(durations.normal)}
      >
        <View style={styles.header}>
          <Text testID="tour-title" variant="titleSm">
            {t(step.titleKey)}
          </Text>
          <Text color="textSecondary">{t(step.bodyKey)}</Text>
        </View>

        <View style={styles.footer}>
          <StepDots total={total} current={position - 1} />

          <View style={styles.actions}>
            {position > 1 ? (
              <Button
                testID="tour-back"
                label={t('tutorial.back')}
                variant="ghost"
                onPress={back}
              />
            ) : (
              // Skipping is offered only on the first step. After that the tour
              // is nearly over, and "next" is the shorter way out.
              <Button
                testID="tour-skip"
                label={t('tutorial.skip')}
                variant="ghost"
                onPress={finish}
              />
            )}

            <Button
              testID={isLast ? 'tour-done' : 'tour-next'}
              label={isLast ? t('tutorial.done') : t('tutorial.next')}
              onPress={isLast ? finish : next}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Puts the card on the opposite side of the anchor from where it would cover it,
 * flipping when the preferred side has no room.
 *
 * Falls back to the middle of the screen for a step with nothing to point at —
 * a card floating near an edge for no visible reason reads as a mistake.
 */
function cardPosition(
  rect: { y: number; height: number } | null,
  placement: 'above' | 'below' | undefined,
  screenHeight: number,
) {
  if (!rect) return { top: screenHeight / 2 - ESTIMATED_CARD_HEIGHT / 2 };

  const below = rect.y + rect.height + CARD_GAP;
  const above = rect.y - CARD_GAP - ESTIMATED_CARD_HEIGHT;
  const fitsBelow = below + ESTIMATED_CARD_HEIGHT + EDGE_MARGIN < screenHeight;
  const fitsAbove = above > EDGE_MARGIN;

  const preferBelow = placement !== 'above';
  const top = preferBelow ? (fitsBelow ? below : above) : fitsAbove ? above : below;

  // Clamped, because an anchor near an edge can push the card off screen and a
  // card nobody can read is worse than one slightly closer than intended.
  return { top: Math.min(Math.max(top, EDGE_MARGIN), screenHeight - EDGE_MARGIN - ESTIMATED_CARD_HEIGHT) };
}

const useStyles = createStyles((t) => ({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    position: 'absolute',
    left: EDGE_MARGIN,
    right: EDGE_MARGIN,
    gap: t.spacing.lg,
    padding: t.spacing.lg,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    // Lifts the card off the dimmed screen behind it.
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  header: { gap: t.spacing.xs },
  footer: { gap: t.spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
