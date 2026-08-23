import { Modal, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';

import { icons } from './icon';
import { IconButton } from './icon-button';
import { Text } from './text';

export type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Pinned below the scrollable body — the place for confirm/cancel. */
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
    // The sheet sits at the bottom, so padding the backdrop is what lifts it
    // clear of the keyboard — no repositioning, no measuring the sheet.
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: t.colors.surfaceElevated,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    maxHeight: '88%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.md,
    paddingLeft: t.spacing.lg,
    paddingRight: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  body: { padding: t.spacing.lg, gap: t.spacing.md },
  footer: {
    padding: t.spacing.lg,
    gap: t.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
}));

/**
 * Bottom sheet used for every transient surface in the app: filters, view
 * settings, a day's agenda, the new-event form.
 *
 * One implementation rather than four keeps dismiss behaviour identical
 * everywhere — tapping the backdrop closes, the panel itself swallows the tap,
 * and Android's back button routes to `onClose`.
 */
export function ModalSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  contentStyle,
}: ModalSheetProps) {
  const { t } = useT();
  const styles = useStyles();

  /**
   * Reanimated's keyboard tracking rather than `KeyboardAvoidingView`.
   *
   * A `Modal` is its own window on Android, so `windowSoftInputMode` does not
   * reach it and `KeyboardAvoidingView` has nothing to react to — which is how a
   * sheet with a text field in it ended up entirely behind the keyboard. This
   * follows the keyboard's actual height on both platforms, and follows it *as it
   * moves*, so the sheet travels with it instead of jumping when it settles.
   */
  const keyboard = useAnimatedKeyboard();
  const lift = useAnimatedStyle(() => ({ paddingBottom: keyboard.height.get() }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.fill, lift]}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel={t('common.close')}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.header}>
              <Text variant="titleSm">{title}</Text>
              <IconButton
                name={icons.close}
                accessibilityLabel={t('common.close')}
                onPress={onClose}
              />
            </View>

            <ScrollView
              contentContainerStyle={[styles.body, contentStyle]}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Pressable>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
