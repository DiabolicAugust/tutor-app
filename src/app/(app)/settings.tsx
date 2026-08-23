import { ScrollView, View } from 'react-native';

import { useT } from '@/shared/i18n';
import { TabSettings } from '@/shared/navigation';
import { GradebookSettings, NotificationSettings } from '@/shared/user-config';
import { createStyles } from '@/shared/theme';
import { PushStatus } from '@/shared/push';
import { useTutorial } from '@/shared/tutorial';
import {
  Button,
  Card,
  LanguageSwitcher,
  PaletteVariantSwitcher,
  Text,
  ThemeModeSwitcher,
} from '@/shared/ui';

/**
 * Account-level settings: appearance and language.
 *
 * Pushed from the More tab rather than living inside it, so the tab stays a
 * short list of destinations as the product grows.
 */
export default function SettingsScreen() {
  const { t } = useT();
  const styles = useStyles();
  const { start } = useTutorial();

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

      {/* A separate card, because these are separate Android channels and can be
          muted independently — and because there is nothing to configure here,
          only something to know. */}
      <Card title={t('notificationSettings.announcementsTitle')}>
        <Text variant="bodySm" color="textSecondary">
          {t('notificationSettings.announcementsHint')}
        </Text>
        <PushStatus />
      </Card>

      <Card title={t('gradebookSettings.title')}>
        <GradebookSettings />
      </Card>

      <Card title={t('settings.navigation.title')}>
        <TabSettings />
      </Card>

      {/* The tour otherwise happens once, to one person, on the day they open a
          school — which leaves it unreachable both for a tutor who joined by
          invitation and for anybody trying to check it still works. */}
      <Card title={t('settings.tour.title')}>
        <Text variant="caption" color="textSecondary">
          {t('settings.tour.hint')}
        </Text>
        <Button label={t('settings.tour.action')} variant="secondary" fullWidth onPress={start} />
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
