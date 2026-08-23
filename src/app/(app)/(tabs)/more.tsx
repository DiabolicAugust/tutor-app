import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAddons } from '@/shared/addons';
import { useCurrentUser, useSession } from '@/shared/auth';
import { useT } from '@/shared/i18n';
import { SupportSheet } from '@/shared/support';
import { createStyles } from '@/shared/theme';
import { useTutorialAnchor } from '@/shared/tutorial';
import { Button, Card, ListRow, ScreenHeader, Text } from '@/shared/ui';

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
  const { granted } = useAddons();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const styles = useStyles();
  const settingsAnchor = useTutorialAnchor('more.settings');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('more.title')} />

        <Card title={t('more.account')}>
          <Text variant="titleSm">{user.name}</Text>
          <Text variant="bodySm" color="textSecondary">
            {user.email}
          </Text>
        </Card>

        <Card>
          {/* Admins manage the school; anyone holding a capability needs the
              screen too, or the grant would be unreachable. Both role and addons
              arrive with the session, so this costs no request. */}
          {user.role === 'admin' || granted.length > 0 ? (
            <ListRow label={t('more.school')} onPress={() => router.push('/school')} />
          ) : null}
          <ListRow label={t('more.files')} onPress={() => router.push('/files')} />
          <View {...settingsAnchor}>
            <ListRow label={t('more.settings')} onPress={() => router.push('/settings')} />
          </View>
          <ListRow label={t('more.support')} onPress={() => setIsSupportOpen(true)} />
        </Card>

        <Button
          label={t('auth.signOut')}
          variant="secondary"
          fullWidth
          onPress={() => void signOut()}
        />
      </ScrollView>

      <SupportSheet visible={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: {
    gap: t.spacing.lg,
    // No top padding: `ScreenHeader` supplies it, so this screen and the pinned
    // ones start their titles at the same height.
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.xl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
}));
