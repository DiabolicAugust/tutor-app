import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { createStyles } from '@/shared/theme';

import { Text } from './text';

export type CardProps = ViewProps & {
  /** Optional section heading rendered inside the card. */
  title?: string;
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderColor: t.colors.border,
    borderWidth: 1,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
  },
}));

/** Standard grouping container: one place decides card padding and elevation. */
export function Card({ title, children, style, ...rest }: CardProps) {
  const styles = useStyles();

  return (
    <View style={[styles.card, style]} {...rest}>
      {title && (
        <Text variant="label" color="textSecondary">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
