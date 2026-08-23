import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useT } from '@/shared/i18n';
import { createStyles, durations } from '@/shared/theme';

import { Text } from './text';

const DOT_COUNT = 3;
/** Offset between dots, so the row reads as a wave rather than a blink. */
const DOT_STAGGER_MS = 90;
/** One pulse is up then down, so a full cycle is twice this. */
const DOT_HALF_CYCLE_MS = durations.fast;

/**
 * How long the loader stays up at minimum.
 *
 * Every provider in this app hydrates synchronously, so on a fast device the app
 * is ready before the first frame. Without a floor the loader would flash for one
 * frame — worse than not having one.
 *
 * **Derived rather than chosen.** It is exactly how long the last dot needs to
 * complete one pulse. A hand-picked number drifted from the animation it was
 * supposed to accommodate: at 420ms the third dot began its first cycle at 260ms
 * and needed 480ms, so the loader started fading out with every dot caught
 * mid-pulse — a loop whose whole message is "work is happening", visibly cut
 * before it had said anything. Deriving it means shortening the floor and
 * breaking that again are the same edit.
 */
const MIN_VISIBLE_MS = (DOT_COUNT - 1) * DOT_STAGGER_MS + DOT_HALF_CYCLE_MS * 2;

const useStyles = createStyles((t) => ({
  overlay: {
    ...({ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const),
    backgroundColor: t.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.lg,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGlyph: { color: t.colors.textOnAccent },
  dots: { flexDirection: 'row', gap: t.spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.brand,
  },
}));

/**
 * The app's own loading screen, shown over the first frames and faded out.
 *
 * Replaces the Expo template's animated logo. The one place in the app where an
 * animation loops — for a loader the loop *is* the message, that work is still
 * happening — and it stops existing the moment the app is ready.
 */
export function AppSplash() {
  const { t } = useT();
  const styles = useStyles();
  const [visible, setVisible] = useState(true);
  const markScale = useSharedValue(0.86);

  useEffect(() => {
    markScale.set(
      withTiming(1, {
        duration: durations.normal,
        easing: Easing.out(Easing.back(1.4)),
      }),
    );

    // Hand the native splash over to this one, then dismiss on our own clock.
    SplashScreen.hideAsync().catch(() => {
      // Already hidden, or unavailable on this platform. Nothing to recover.
    });

    const timer = setTimeout(() => setVisible(false), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [markScale]);

  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: markScale.get() }] }));

  if (!visible) return null;

  return (
    <Animated.View
      style={styles.overlay}
      exiting={FadeOut.duration(durations.normal)}
      pointerEvents="none"
    >
      <Animated.View style={[styles.mark, markStyle]}>
        <Text variant="displayLg" style={styles.markGlyph}>
          F
        </Text>
      </Animated.View>

      <Text variant="titleSm" color="textSecondary">
        {t('common.appName')}
      </Text>

      <View style={styles.dots}>
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <LoadingDot key={index} index={index} />
        ))}
      </View>
    </Animated.View>
  );
}

/** One dot of the staggered pulse. */
function LoadingDot({ index }: { index: number }) {
  const styles = useStyles();
  const progress = useSharedValue(0.35);

  useEffect(() => {
    progress.set(
      withDelay(
        index * DOT_STAGGER_MS,
        withRepeat(
          withSequence(
            withTiming(1, { duration: DOT_HALF_CYCLE_MS }),
            withTiming(0.35, { duration: DOT_HALF_CYCLE_MS }),
          ),
          -1,
          false,
        ),
      ),
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.8 + progress.get() * 0.35 }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}
