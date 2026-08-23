import { Slot, router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useT } from '@/shared/i18n';
import { useNotifications } from '@/shared/notifications';
import { createStyles } from '@/shared/theme';
import { Icon, Text } from '@/shared/ui';

import { useTabPreferences } from './tab-preferences';

/**
 * Web tab bar.
 *
 * Built from `Slot` and `usePathname` rather than `expo-router/ui`'s
 * `Tabs`/`TabList`/`TabTrigger`: those rely on the tabs navigator being the
 * layout that owns the route group, which stops holding once the group sits
 * inside a stack — on web the bar then renders nothing at all, silently. A
 * pathname comparison is less clever and cannot break that way.
 *
 * `replace` rather than `push`, so switching tabs does not pile up history.
 */
export default function AppTabs() {
  const { t } = useT();
  const styles = useStyles();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { visibleTabs } = useTabPreferences();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>

      <View style={styles.bar} accessibilityRole="tablist">
        <View style={styles.inner}>
          {visibleTabs.map((tab) => {
            const focused = pathname === tab.href;
            const badge = tab.key === 'news' && unreadCount > 0 ? unreadCount : null;

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={t(tab.labelKey)}
                onPress={() => router.replace(tab.href)}
                style={({ pressed }) => [
                  styles.tab,
                  focused && styles.tabSelected,
                  pressed && !focused && styles.tabPressed,
                ]}
              >
                <Icon name={tab.icon} size={18} color={focused ? 'brand' : 'textSecondary'} />
                <Text variant="label" color={focused ? 'brand' : 'textSecondary'}>
                  {t(tab.labelKey)}
                </Text>
                {badge !== null ? (
                  <View style={styles.badge}>
                    <Text variant="caption" color="textOnAccent">
                      {badge}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  container: { flex: 1 },
  content: { flex: 1 },
  bar: {
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.surfaceElevated,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    gap: t.spacing.sm,
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: t.spacing.xs,
    minHeight: t.layout.minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
  },
  tabSelected: { backgroundColor: t.colors.brandSoft },
  tabPressed: { backgroundColor: t.colors.surfaceActive },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: t.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.brand,
  },
}));
