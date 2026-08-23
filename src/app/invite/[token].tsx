import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/shared/auth';
import { useT } from '@/shared/i18n';
import { apiClients } from '@/shared/api';
import type { InvitationDetails } from '@/shared/school';
import { createStyles } from '@/shared/theme';
import { Button, Card, Text, TextField } from '@/shared/ui';

/**
 * Registration from an invitation link.
 *
 * Reached by tapping the link in the invitation email: the backend sends
 * `foxacademy://invite/<token>`, which the OS routes straight to this route.
 * Lives outside the authenticated group because the whole point is that the
 * person has no account yet.
 *
 * The email is not editable — it comes from the invitation, or the link would be
 * a way to create an account for any address.
 */
export default function InviteScreen() {
  const { t } = useT();
  const styles = useStyles();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { adoptSession } = useSession();

  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<'name' | 'password' | 'failed' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const resolved = await apiClients.school.describeInvitation(token);
        if (active) setDetails(resolved);
      } catch {
        if (active) setInvalid(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async () => {
    if (name.trim().length < 2) return setError('name');
    if (password.length < 8) return setError('password');

    setError(null);
    setIsSubmitting(true);
    try {
      const session = await apiClients.school.acceptInvitation(token, { name, password });
      // Adopting the session satisfies the root layout's guard, which moves the
      // new tutor into the app — no navigation call needed.
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
          {invalid ? (
            <Card>
              <Text variant="titleSm">{t('invite.invalidTitle')}</Text>
              <Text color="textSecondary">{t('invite.invalidBody')}</Text>
            </Card>
          ) : !details ? (
            <Text color="textSecondary">{t('common.loading')}</Text>
          ) : (
            <>
              <View style={styles.header}>
                <Text variant="titleLg">{t('invite.title', { school: details.schoolName })}</Text>
                <Text color="textSecondary">
                  {t('invite.subtitle', {
                    name: details.invitedByName,
                    school: details.schoolName,
                  })}
                </Text>
              </View>

              <Card title={t('auth.email')}>
                <Text variant="bodyStrong">{details.email}</Text>
                <Text variant="caption" color="textMuted">
                  {t('invite.emailFixed')}
                </Text>
              </Card>

              <View style={styles.form}>
                <TextField
                  label={t('invite.yourName')}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('invite.namePlaceholder')}
                  error={error === 'name' ? t('invite.nameRequired') : undefined}
                  autoCapitalize="words"
                />

                <TextField
                  label={t('auth.password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  error={
                    error === 'password'
                      ? t('invite.passwordTooShort')
                      : error === 'failed'
                        ? t('invite.failed')
                        : undefined
                  }
                  hint={error ? undefined : t('invite.passwordHint')}
                />

                <Button
                  label={t('invite.join')}
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  onPress={() => void handleSubmit()}
                />
              </View>
            </>
          )}
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
