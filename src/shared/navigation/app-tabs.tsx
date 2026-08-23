import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useT } from '@/shared/i18n';
import { useNotifications } from '@/shared/notifications';
import { useTheme } from '@/shared/theme';

import { useTabPreferences } from './tab-preferences';

/**
 * The app's bottom tab bar (native).
 *
 * Every tab keeps a trigger — hidden ones are marked `hidden` rather than
 * omitted, so their routes stay registered and a deep link to a hidden tab still
 * resolves. Order comes straight from the user's preference.
 *
 * Icons are platform sets (SF Symbols on iOS, Material Symbols on Android),
 * colors come from the theme and labels from the dictionary.
 */
export default function AppTabs() {
  const { t } = useT();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const { orderedTabs, isVisible } = useTabPreferences();

  return (
    <NativeTabs
      backgroundColor={colors.surfaceElevated}
      iconColor={{ default: colors.textMuted, selected: colors.brand }}
      indicatorColor={colors.brandSoft}
      labelStyle={{ color: colors.textSecondary, selected: { color: colors.brand } }}
    >
      {orderedTabs.map((tab) => (
        <NativeTabs.Trigger key={tab.key} name={tab.key} hidden={!isVisible(tab.key)}>
          <NativeTabs.Trigger.Icon sf={tab.icon.ios} md={tab.icon.android} />
          <NativeTabs.Trigger.Label>{t(tab.labelKey)}</NativeTabs.Trigger.Label>
          {/* The badge is the point of a news tab: the only way the app can say
              something needs attention without a push notification. */}
          {tab.key === 'news' ? (
            <NativeTabs.Trigger.Badge hidden={unreadCount === 0}>
              {unreadCount > 0 ? String(unreadCount) : undefined}
            </NativeTabs.Trigger.Badge>
          ) : null}
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
