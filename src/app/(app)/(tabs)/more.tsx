import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentUser, useSession } from '@/shared/auth';
import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, ListRow, Text } from '@/shared/ui';

/**
 * "More" tab: the account, and links to everything that is not a primary
 * destination. As the product grows this becomes the list of secondary
 * sections — students, billing, school settings.
 */
export default function MoreScreen() {
  const { t } = useT();
  // Safe to assume a user here: this screen lives behind the root layout's guard.
  const user = useCurrentUser();
  const { signOut } = useSession();
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleLg">{t('more.title')}</Text>

        <Card title={t('more.account')}>
          <Text variant="titleSm">{user.name}</Text>
          <Text variant="bodySm" color="textSecondary">
            {user.email}
          </Text>
        </Card>

        <Card>
          {/* The role arrives with the session at sign-in, so gating on it costs
              no extra request. */}
          {user.role === 'admin' ? (
            <ListRow label={t('more.school')} onPress={() => router.push('/school')} />
          ) : null}
          <ListRow label={t('more.settings')} onPress={() => router.push('/settings')} />
        </Card>

        <Button
          label={t('auth.signOut')}
          variant="secondary"
          fullWidth
          onPress={() => void signOut()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: {
    gap: t.spacing.lg,
    padding: t.spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
}));
