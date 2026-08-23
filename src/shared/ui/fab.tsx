import { Pressable, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { createStyles, durations } from '@/shared/theme';

import { Icon, type IconName } from './icon';
import { motion } from './motion';

export type FabProps = Omit<ViewProps, 'style' | 'children'> & {
  name: IconName;
  accessibilityLabel: string;
  onPress: () => void;
};

const useStyles = createStyles((t) => ({
  fab: {
    position: 'absolute',
    right: t.spacing.lg,
    bottom: t.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.brand,
    // Keeps the button legible over a dense grid on both platforms.
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
}));

/**
 * Floating action button. Anchored to the screen rather than the scroll
 * content, so "add event" stays reachable in every calendar view.
 *
 * The press scale is the one bit of motion here: a round button over a busy
 * grid has no pressed-state background to fall back on, so without it a tap
 * gives no feedback at all until the sheet opens.
 */
export function Fab({ name, accessibilityLabel, onPress, ...rest }: FabProps) {
  const styles = useStyles();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    // `rest` reaches the root rather than the pressable so that anything
    // measuring this control — the interface tour, for one — gets the button's
    // real position on screen, not the icon's inside it.
    <Animated.View style={[styles.fab, animatedStyle]} {...rest}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => {
          scale.set(withTiming(motion.pressScale, { duration: durations.instant }));
        }}
        onPressOut={() => {
          scale.set(withTiming(1, { duration: durations.fast }));
        }}
        onPress={onPress}
      >
        <Icon name={name} size={26} color="textOnAccent" />
      </Pressable>
    </Animated.View>
  );
}
