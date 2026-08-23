import { router } from 'expo-router';
import { ScrollView } from 'react-native';

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
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="titleLg">{t('more.title')}</Text>

      <Card title={t('more.account')}>
        <Text variant="titleSm">{user.name}</Text>
        <Text variant="bodySm" color="textSecondary">
          {user.email}
        </Text>
      </Card>

      <Card>
        <ListRow label={t('more.settings')} onPress={() => router.push('/settings')} />
      </Card>

      <Button
        label={t('auth.signOut')}
        variant="secondary"
        fullWidth
        onPress={() => void signOut()}
      />
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
}));
