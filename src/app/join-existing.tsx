import { Link, router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, Icon, Text, icons } from '@/shared/ui';

/**
 * Why there is no form here.
 *
 * Joining an existing school is by invitation: the school decides who teaches
 * under its name, and a self-service form would let anybody attach themselves to
 * somebody else's roster. So instead of a form this screen explains what to ask
 * for and what will happen next — the two things somebody who arrived here
 * actually needs.
 *
 * Worth being warm rather than terse. A wall that says "invitation required" and
 * stops reads as a door being shut; the same fact with the next step attached
 * reads as directions.
 */
export default function JoinExistingScreen() {
  const { t } = useT();
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Icon name={icons.mail} size={32} color="brand" />
          <Text variant="titleLg">{t('join.existing.title')}</Text>
          <Text color="textSecondary">{t('join.existing.body')}</Text>
        </View>

        <Card title={t('join.existing.stepsTitle')}>
          <Step index={1} text={t('join.existing.step1')} />
          <Step index={2} text={t('join.existing.step2')} />
          <Step index={3} text={t('join.existing.step3')} />
        </Card>

        <Text variant="caption" color="textMuted">
          {t('join.existing.note')}
        </Text>

        <View style={styles.actions}>
          <Link href="/sign-in" asChild>
            <Button label={t('join.existing.haveLink')} variant="secondary" fullWidth />
          </Link>
          <Button
            label={t('common.back')}
            variant="ghost"
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

/** A numbered line. The number carries the order, so the text does not have to. */
function Step({ index, text }: { index: number; text: string }) {
  const styles = useStyles();

  return (
    <View style={styles.step}>
      <View style={styles.stepBadge}>
        <Text variant="caption" color="textOnAccent">
          {String(index)}
        </Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: t.spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    padding: t.spacing.xl,
  },
  header: { gap: t.spacing.xs },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.sm },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  actions: { gap: t.spacing.xs },
}));
