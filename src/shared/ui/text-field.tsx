import { useState } from 'react';
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { createStyles, useTheme } from '@/shared/theme';

import { motion } from './motion';
import { Text } from './text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Validation message. Its presence is what puts the field in an error state. */
  error?: string;
  /** Hint shown under the field while there is no error. */
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  container: { gap: t.spacing.xs, alignSelf: 'stretch' },
  input: {
    ...t.typography.body,
    color: t.colors.text,
    minHeight: t.layout.minTouchSize,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: t.radius.md,
  },
  inputFocused: { borderColor: t.colors.brand },
  inputError: { borderColor: t.colors.danger },
}));

/**
 * Labelled text input. Owns its focus state so a screen never has to; keeps the
 * label/error/hint arrangement identical across every form in the app.
 */
export function TextField({
  label,
  error,
  hint,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>

      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        // Keeps the caret and selection on-brand instead of platform blue.
        selectionColor={colors.brand}
        style={[styles.input, isFocused && styles.inputFocused, !!error && styles.inputError]}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />

      {/* Faded rather than popped in: a validation message appearing under the
          cursor mid-typing is easy to miss as a hard cut, and jarring as one. */}
      {error ? (
        <Animated.View entering={motion.messageEnter()} exiting={motion.messageExit()}>
          <Text variant="caption" color="danger">
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Animated.View entering={motion.messageEnter()} exiting={motion.messageExit()}>
          <Text variant="caption" color="textMuted">
            {hint}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
