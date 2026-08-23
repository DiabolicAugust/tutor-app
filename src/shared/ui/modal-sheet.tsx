import { Modal, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

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
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text variant="titleSm">{title}</Text>
            <IconButton
              name={icons.close}
              accessibilityLabel={t('common.close')}
              onPress={onClose}
            />
          </View>

          <ScrollView contentContainerStyle={[styles.body, contentStyle]}>{children}</ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
