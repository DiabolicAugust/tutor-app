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
  const { granted } = useAddons();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const styles = useStyles();
  const settingsAnchor = useTutorialAnchor('more.settings');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} testID="screen-more">
        <Card title={t('more.account')}>
          <Text variant="titleSm">{user.name}</Text>
          <Text variant="bodySm" color="textSecondary">
            {user.email}
          </Text>
        </Card>

        <Card>
          {/* First, and the reason this tab is worth opening on its own: the
              others are places to change something, this is the one somebody
              comes here to read. */}
          <ListRow
            testID="more-reports"
            label={t('reports.title')}
            description={t('reports.subtitle')}
            onPress={() => router.push('/reports')}
          />
          {/* Next to the reports, because it answers the same kind of question —
              what is the state of things — rather than changing anything. */}
          <ListRow
            testID="more-debtors"
            label={t('debtors.title')}
            description={t('debtors.subtitle')}
            onPress={() => router.push('/debtors')}
          />
          {/* Admins manage the school; anyone holding a capability needs the
              screen too, or the grant would be unreachable. Both role and addons
              arrive with the session, so this costs no request. */}
          {user.role === 'admin' || granted.length > 0 ? (
            <ListRow
              testID="more-school"
              label={t('more.school')}
              onPress={() => router.push('/school')}
            />
          ) : null}
          <ListRow
            testID="more-files"
            label={t('more.files')}
            onPress={() => router.push('/files')}
          />
          <View {...settingsAnchor}>
            <ListRow
              testID="more-settings"
              label={t('more.settings')}
              onPress={() => router.push('/settings')}
            />
          </View>
          <ListRow
            testID="more-support"
            label={t('more.support')}
            onPress={() => setIsSupportOpen(true)}
          />
        </Card>

        <Button
          testID="more-sign-out"
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
    // Pads itself, unlike the screens with a header: this one has no title to
    // name what is already the tab's own label.
    paddingTop: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.xl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
}));
