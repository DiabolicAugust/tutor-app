import { useEffect } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
/**
 * Padding that matches the keyboard's height, so the sheet rides above it.
 *
 * Driven by `Keyboard` events rather than Reanimated's `useAnimatedKeyboard`.
 * That was the first attempt and it does not work here: a `Modal` is its own
 * native window on Android, `useAnimatedKeyboard` reads the *app* window's
 * insets, and inside a modal window it reports zero — so a sheet with a text
 * field in it stayed behind the keyboard while the code read as correct.
 *
 * `Keyboard` events are dispatched app-wide and carry the real height, which is
 * why they reach a modal at all. Interpolated rather than followed frame by
 * frame: the event fires once with the final height, so a timing curve is what
 * keeps the sheet from jumping.
 */
function useKeyboardLift() {
  const height = useSharedValue(0);

  useEffect(() => {
    // `Will` on iOS, where it fires before the animation so the sheet moves with
    // it; `Did` on Android, which has no `Will` events.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const shown = Keyboard.addListener(showEvent, (event) => {
      height.set(
        withTiming(event.endCoordinates.height, { duration: event.duration || 250 }),
      );
    });
    const hidden = Keyboard.addListener(hideEvent, (event) => {
      height.set(withTiming(0, { duration: event.duration || 200 }));
    });

    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [height]);

  return useAnimatedStyle(() => ({ paddingBottom: height.get() }));
}

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

  const lift = useKeyboardLift();

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
