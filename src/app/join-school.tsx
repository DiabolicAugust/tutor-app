import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiClients } from '@/shared/api';
import { useSession } from '@/shared/auth';
import { useT } from '@/shared/i18n';
import { deviceTimezone } from '@/shared/lib/timezone';
import { useSteps } from '@/shared/lib/use-steps';
import { createStyles } from '@/shared/theme';
import { requestTutorial } from '@/shared/tutorial';
import { Button, Card, StepDots, Text, TextField } from '@/shared/ui';

/** Which field, if any, the person needs to fix. */
type FieldError = 'schoolName' | 'adminName' | 'adminEmail' | 'adminPassword' | 'failed';

const MIN_PASSWORD = 8;
const STEP_COUNT = 2;

/**
 * Opening a school.
 *
 * Two steps rather than one long form: the fields belong to two different things
 * — the school, and the person running it — and a single screen asking for five
 * unrelated values at signup is the shape people abandon. Each step validates on
 * the way out, so nobody discovers on the last screen that the first one was
 * wrong.
 *
 * On success the tour is requested and the session adopted, in that order. The
 * session flips the root guard and the app opens on the calendar; the tour then
 * starts there, which is the screen it has something to say about.
 */
export default function JoinSchoolScreen() {
  const { t } = useT();
  const styles = useStyles();
  const { adoptSession } = useSession();
  const steps = useSteps(STEP_COUNT);

  const [schoolName, setSchoolName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<FieldError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read once, not per render: it is the device's setting, not app state.
  const [timezone] = useState(deviceTimezone);

  const handleContinue = () => {
    if (schoolName.trim().length < 2) return setError('schoolName');
    setError(null);
    steps.next();
  };

  const handleCreate = async () => {
    if (adminName.trim().length < 2) return setError('adminName');
    if (!adminEmail.includes('@')) return setError('adminEmail');
    if (adminPassword.length < MIN_PASSWORD) return setError('adminPassword');

    setError(null);
    setIsSubmitting(true);
    try {
      const session = await apiClients.school.registerSchool({
        schoolName,
        timezone,
        adminName,
        adminEmail,
        adminPassword,
      });

      // Before adopting: adopting unmounts this screen, so anything that has to
      // happen has to happen first.
      requestTutorial();
      adoptSession(session);
    } catch {
      setError('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text variant="titleLg">{t('join.school.title')}</Text>
            <Text color="textSecondary">
              {steps.isFirst ? t('join.school.aboutSchool') : t('join.school.aboutYou')}
            </Text>
          </View>

          <StepDots total={STEP_COUNT} current={steps.index} />

          {steps.isFirst ? (
            <View style={styles.form}>
              <TextField
                testID="school-name"
                label={t('join.school.nameLabel')}
                value={schoolName}
                onChangeText={setSchoolName}
                placeholder={t('join.school.namePlaceholder')}
                hint={t('join.school.nameHint')}
                error={error === 'schoolName' ? t('join.school.nameRequired') : undefined}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={handleContinue}
              />

              <Card title={t('join.school.timezoneLabel')}>
                <Text variant="bodyStrong">{timezone}</Text>
                <Text variant="caption" color="textMuted">
                  {t('join.school.timezoneHint')}
                </Text>
              </Card>

              <Button
                testID="school-continue"
                label={t('common.continue')}
                size="lg"
                fullWidth
                onPress={handleContinue}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <TextField
                testID="admin-name"
                label={t('join.school.yourName')}
                value={adminName}
                onChangeText={setAdminName}
                placeholder={t('join.school.yourNamePlaceholder')}
                error={error === 'adminName' ? t('join.school.yourNameRequired') : undefined}
                autoCapitalize="words"
              />

              <TextField
                testID="admin-email"
                label={t('auth.email')}
                value={adminEmail}
                onChangeText={setAdminEmail}
                placeholder={t('auth.emailPlaceholder')}
                error={error === 'adminEmail' ? t('join.school.emailInvalid') : undefined}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />

              <TextField
                testID="admin-password"
                label={t('auth.password')}
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                error={
                  error === 'adminPassword'
                    ? t('join.school.passwordTooShort')
                    : error === 'failed'
                      ? t('join.school.failed')
                      : undefined
                }
                hint={error ? undefined : t('join.school.passwordHint')}
              />

              <Button
                testID="school-create"
                label={t('join.school.create')}
                size="lg"
                fullWidth
                loading={isSubmitting}
                onPress={() => void handleCreate()}
              />

              <Button
                testID="school-back"
                label={t('common.back')}
                variant="ghost"
                fullWidth
                onPress={steps.back}
              />
            </View>
          )}

          {steps.isFirst ? (
            <Button
              label={t('common.back')}
              variant="ghost"
              fullWidth
              onPress={() => router.back()}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: t.spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    padding: t.spacing.xl,
  },
  header: { gap: t.spacing.xs },
  form: { gap: t.spacing.md },
}));
