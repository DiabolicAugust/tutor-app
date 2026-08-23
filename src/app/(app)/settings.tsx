import { ScrollView, View } from 'react-native';

import { useT } from '@/shared/i18n';
import { TabSettings } from '@/shared/navigation';
import { NotificationSettings } from '@/shared/user-config';
import { createStyles } from '@/shared/theme';
import { Card, LanguageSwitcher, PaletteVariantSwitcher, Text, ThemeModeSwitcher } from '@/shared/ui';

/**
 * Account-level settings: appearance and language.
 *
 * Pushed from the More tab rather than living inside it, so the tab stays a
 * short list of destinations as the product grows.
 */
export default function SettingsScreen() {
  const { t } = useT();
  const styles = useStyles();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card title={t('settings.appearance.title')}>
        <View style={styles.group}>
          <ThemeModeSwitcher />
          <Text variant="label" color="textSecondary">
            {t('settings.appearance.accent')}
          </Text>
          <PaletteVariantSwitcher />
        </View>
      </Card>

      <Card title={t('settings.language.title')}>
        <LanguageSwitcher />
      </Card>

      <Card title={t('notificationSettings.title')}>
        <NotificationSettings />
      </Card>

      <Card title={t('settings.navigation.title')}>
        <TabSettings />
      </Card>
    </ScrollView>
  );
}

const useStyles = createStyles((t) => ({
  content: {
    gap: t.spacing.lg,
    padding: t.spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
  group: { gap: t.spacing.sm },
}));
