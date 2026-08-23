import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { createStyles, useTheme } from '@/shared/theme';

import { Text, type TextColor } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  /** Stretches to the container width — the default for forms. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: { alignSelf: 'stretch' },

  md: { minHeight: t.layout.minTouchSize, paddingHorizontal: t.spacing.lg },
  lg: { minHeight: 52, paddingHorizontal: t.spacing.xl },

  primary: { backgroundColor: t.colors.brand },
  primaryPressed: { backgroundColor: t.colors.brandHover },
  secondary: { backgroundColor: t.colors.surface, borderColor: t.colors.border },
  secondaryPressed: { backgroundColor: t.colors.surfaceActive },
  ghost: { backgroundColor: 'transparent' },
  ghostPressed: { backgroundColor: t.colors.surface },
  danger: { backgroundColor: t.colors.danger },
  dangerPressed: { opacity: 0.85, backgroundColor: t.colors.danger },

  disabled: { backgroundColor: t.colors.surfaceMuted, borderColor: 'transparent' },
}));

const labelColors: Record<ButtonVariant, TextColor> = {
  primary: 'textOnAccent',
  secondary: 'text',
  ghost: 'brand',
  danger: 'textOnAccent',
};

/**
 * The app's button. Variants are semantic (`primary`, `danger`) rather than
 * visual (`orange`, `red`), so a palette change never turns into a rename.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...rest
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isInactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && !isInactive && styles[`${variant}Pressed`],
        isInactive && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={isInactive ? colors.textMuted : colors[labelColors[variant]]}
        />
      )}
      <Text variant="bodyStrong" color={isInactive ? 'textMuted' : labelColors[variant]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Vertical stack for button rows in forms and dialogs. */
export function ButtonGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useGroupStyles();
  return <View style={[styles.group, style]}>{children}</View>;
}

const useGroupStyles = createStyles((t) => ({
  group: { gap: t.spacing.sm },
}));
