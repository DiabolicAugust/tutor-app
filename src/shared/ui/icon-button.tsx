import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { createStyles, type Palette } from '@/shared/theme';

import { Icon, type IconName } from './icon';

export type IconButtonProps = {
  name: IconName;
  /** Required: an icon-only control is invisible to screen readers without it. */
  accessibilityLabel: string;
  onPress: () => void;
  color?: keyof Palette;
  /** Tinted variant, for a control that is currently active. */
  active?: boolean;
  size?: number;
  /**
   * Stable handle for end-to-end tests.
   *
   * Preferred over matching visible text, which is translated and rewritten for
   * clarity — a test that keys on copy fails for cosmetic edits and stops being
   * believed.
   */
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  button: {
    minWidth: t.layout.minTouchSize,
    minHeight: t.layout.minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
  },
  pressed: { backgroundColor: t.colors.surfaceActive },
  active: { backgroundColor: t.colors.brandSoft },
}));

/** Icon-only control sized to a comfortable tap target. */
export function IconButton({
  name,
  accessibilityLabel,
  onPress,
  color = 'textSecondary',
  active = false,
  size,
  style,
  testID,
}: IconButtonProps) {
  const styles = useStyles();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.active,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name={name} size={size} color={active ? 'brand' : color} />
    </Pressable>
  );
}
