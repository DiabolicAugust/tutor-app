import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { describeTimeAgo, useFormat, useT } from '@/shared/i18n';
import { useNow } from '@/shared/lib/use-now';
import { createStyles, durations, useTheme, type Palette } from '@/shared/theme';
import { Button, Icon, Text, motion } from '@/shared/ui';

import type { Notification, NotificationTone } from '../notification';
import { describeNotification, type NotificationAction } from '../registry';

export type NotificationCardProps = {
  notification: Notification;
  read: boolean;
  onPress: (notification: Notification) => void;
  onAction: (notification: Notification, action: NotificationAction) => void;
};

/** Tone to palette. The only place a notification's colors are decided. */
const toneColors: Record<NotificationTone, { icon: keyof Palette; background: keyof Palette }> = {
  info: { icon: 'info', background: 'infoSoft' },
  warning: { icon: 'warning', background: 'warningSoft' },
  success: { icon: 'success', background: 'successSoft' },
  brand: { icon: 'brand', background: 'brandSoft' },
};

const READ_OPACITY = 0.62;

const useStyles = createStyles((t) => ({
  card: {
    flexDirection: 'row',
    gap: t.spacing.md,
    padding: t.spacing.md,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  cardPressed: { backgroundColor: t.colors.surfaceActive },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  title: { flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.brand },
  actions: { flexDirection: 'row', gap: t.spacing.sm, paddingTop: t.spacing.sm },
  action: { flex: 1 },
}));

/**
 * Renders any notification from its registry descriptor.
 *
 * Nothing here is kind-specific: no switch, no per-kind branch. Message text
 * comes from the descriptor's translation keys interpolated with the
 * notification's raw data, and the timestamp is formatted at render time, so the
 * feed re-reads correctly after a language switch.
 */
export function NotificationCard({
  notification,
  read,
  onPress,
  onAction,
}: NotificationCardProps) {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const { colors } = useTheme();
  const now = useNow();

  const descriptor = describeNotification(notification.kind);
  const tone = toneColors[descriptor.tone];

  const params = {
    studentName: notification.data.studentName ?? '',
    personName: notification.data.personName ?? '',
    text: notification.data.text ?? '',
    count: notification.data.count ?? 0,
    time: notification.data.at ? format.time(new Date(notification.data.at)) : '',
  };

  // `now` comes from a hook rather than `Date.now()` inline: reading the clock
  // during render makes the same props produce a different result each time, and
  // a relative timestamp computed that way freezes at whatever the clock said
  // when the card last happened to re-render.
  const sent = describeTimeAgo(notification.createdAt, now);

  // Read items stay legible but stop competing for attention. Faded rather than
  // switched, so tapping a card visibly acknowledges the tap.
  const readStyle = useAnimatedStyle(() => ({
    opacity: withTiming(read ? READ_OPACITY : 1, { duration: durations.normal }),
  }));

  return (
    <Animated.View
      entering={motion.listEnter()}
      exiting={motion.listResolve()}
      layout={motion.listReflow()}
      style={readStyle}
    >
      <Pressable
        // Named by kind rather than by id: a flow cares that "a lesson needs
        // writing up" is on the feed, not which lesson generated it.
        testID={`notification-${notification.kind}`}
        accessibilityRole="button"
        accessibilityLabel={t(descriptor.titleKey, params)}
        onPress={() => onPress(notification)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors[tone.background] }]}>
          <Icon name={descriptor.icon} size={20} color={tone.icon} />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text variant="bodyStrong" style={styles.title}>
              {t(descriptor.titleKey, params)}
            </Text>
            {read ? null : <View style={styles.unreadDot} />}
          </View>

          <Text variant="bodySm" color="textSecondary">
            {t(descriptor.bodyKey, params)}
          </Text>

          <Text variant="caption" color="textMuted">
            {t(sent.key, { count: sent.count })}
          </Text>

          {descriptor.actions ? (
            <View style={styles.actions}>
              {descriptor.actions.map((action) => (
                <View key={action.id} style={styles.action}>
                  <Button
                    testID={`notification-action-${action.id}`}
                    label={t(action.labelKey)}
                    variant={action.variant}
                    onPress={() => onAction(notification, action)}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
