import { Link } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, Icon, Text, icons } from '@/shared/ui';

/**
 * The fork at the start of registration.
 *
 * Two paths, because they are not variations of one form: opening a school
 * creates a tenant and its first admin, while joining one needs an invitation
 * that already exists. Asking which of those somebody is doing costs one tap and
 * saves them filling in a form that turns out to be the wrong one.
 */
export default function JoinScreen() {
  const { t } = useT();
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="displayLg">{t('common.appName')}</Text>
          <Text variant="titleMd">{t('join.title')}</Text>
          <Text color="textSecondary">{t('join.subtitle')}</Text>
        </View>

        <View style={styles.choices}>
          <Card>
            <View style={styles.choiceHeader}>
              <Icon name={icons.school} size={22} color="brand" />
              <Text variant="bodyStrong">{t('join.openTitle')}</Text>
            </View>
            <Text variant="caption" color="textSecondary">
              {t('join.openBody')}
            </Text>
            <Link href="/join-school" asChild>
              <Button testID="join-open-school" label={t('join.openAction')} fullWidth />
            </Link>
          </Card>

          <Card>
            <View style={styles.choiceHeader}>
              <Icon name={icons.people} size={22} color="textSecondary" />
              <Text variant="bodyStrong">{t('join.existingTitle')}</Text>
            </View>
            <Text variant="caption" color="textSecondary">
              {t('join.existingBody')}
            </Text>
            <Link href="/join-existing" asChild>
              <Button
                testID="join-existing"
                label={t('join.existingAction')}
                variant="secondary"
                fullWidth
              />
            </Link>
          </Card>
        </View>

        <View style={styles.footer}>
          <Text variant="caption" color="textMuted">
            {t('join.haveAccount')}
          </Text>
          <Link href="/sign-in" asChild>
            <Button
              testID="join-have-account"
              label={t('auth.signIn')}
              variant="ghost"
              fullWidth
            />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: t.spacing.xxl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    padding: t.spacing.xl,
  },
  header: { gap: t.spacing.xs },
  choices: { gap: t.spacing.md },
  choiceHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  footer: { gap: t.spacing.xs, alignItems: 'center' },
}));
