import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Icon, IconButton, Text, icons, motion } from '@/shared/ui';

import { useTabPreferences } from './tab-preferences';

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    minHeight: t.layout.minTouchSize,
  },
  rowHidden: { opacity: 0.5 },
  label: { flex: 1 },
  locked: { paddingHorizontal: t.spacing.sm },
}));

/**
 * Reorders and hides bottom-tab entries.
 *
 * Up/down buttons rather than drag-and-drop: with three tabs a gesture is
 * harder to hit than a button, works worse with a screen reader, and would pull
 * in a gesture-handler list. Worth revisiting if the app ever has six tabs.
 *
 * A tab that cannot be hidden shows a lock instead of a toggle — the reason it
 * cannot is in the tab definition, not in this component.
 */
export function TabSettings() {
  const { t } = useT();
  const styles = useStyles();
  const { orderedTabs, isVisible, canHide, toggleVisible, move, reset } = useTabPreferences();

  return (
    <>
      <Text variant="caption" color="textMuted">
        {t('settings.navigation.hint')}
      </Text>

      {orderedTabs.map((tab, index) => {
        const visible = isVisible(tab.key);
        const label = t(tab.labelKey);

        return (
          <Animated.View
            key={tab.key}
            layout={motion.listReflow()}
            style={[styles.row, !visible && styles.rowHidden]}
          >
            <Icon name={tab.icon} size={20} color={visible ? 'text' : 'textMuted'} />

            <Text style={styles.label}>{label}</Text>

            <IconButton
              name={icons.arrowUp}
              accessibilityLabel={`${label}: ${t('settings.navigation.moveUp')}`}
              onPress={() => move(tab.key, -1)}
              color={index === 0 ? 'textMuted' : 'textSecondary'}
            />
            <IconButton
              name={icons.arrowDown}
              accessibilityLabel={`${label}: ${t('settings.navigation.moveDown')}`}
              onPress={() => move(tab.key, 1)}
              color={index === orderedTabs.length - 1 ? 'textMuted' : 'textSecondary'}
            />

            {tab.alwaysVisible ? (
              <View style={styles.locked}>
                <Icon name={icons.lock} size={16} color="textMuted" />
              </View>
            ) : (
              <IconButton
                name={visible ? icons.check : icons.eyeOff}
                accessibilityLabel={`${label}: ${t('settings.navigation.toggle')}`}
                active={visible}
                onPress={() => toggleVisible(tab.key)}
                color={canHide(tab.key) || !visible ? 'textSecondary' : 'textMuted'}
              />
            )}
          </Animated.View>
        );
      })}

      <Button label={t('settings.navigation.reset')} variant="ghost" onPress={reset} />
    </>
  );
}
