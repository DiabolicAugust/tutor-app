import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/shared/auth';
import { useMockClients } from '@/shared/api';
import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, LanguageSwitcher, Text, TextField } from '@/shared/ui';

export default function SignInScreen() {
  const { t } = useT();
  const { signIn, isPending, errorKey } = useSession();
  const styles = useStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // No navigation call: flipping the session satisfies the root layout's guard,
  // which moves the user into the app.
  const handleSignIn = () => void signIn({ email, password });

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text variant="displayLg">{t('common.appName')}</Text>
            <Text variant="titleMd">{t('auth.signInTitle')}</Text>
            <Text color="textSecondary">{t('auth.signInSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            <TextField
              testID="signin-email"
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <TextField
              testID="signin-password"
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
            />

            {errorKey && (
              <Text variant="caption" color="danger">
                {t(errorKey)}
              </Text>
            )}

            <Button
              testID="signin-submit"
              label={isPending ? t('auth.signingIn') : t('auth.signIn')}
              onPress={handleSignIn}
              loading={isPending}
              size="lg"
              fullWidth
            />

            <Button label={t('auth.forgotPassword')} variant="ghost" fullWidth disabled />

            {/* The only route into registration, so it is a button rather than a
                line of small print. */}
            <Link href="/join" asChild>
              <Button
                testID="signin-create-account"
                label={t('auth.createAccount')}
                variant="secondary"
                fullWidth
              />
            </Link>
          </View>

          <View style={styles.footer}>
            {/* Shown only when the mock auth client is in use — it is what makes
                any credentials work. Pointing the build at a real API removes
                both the mock and the notice. */}
            {useMockClients ? (
              <View style={styles.notice}>
                <Text variant="caption" color="warning">
                  {t('auth.mockNotice')}
                </Text>
              </View>
            ) : null}
            <LanguageSwitcher />
          </View>
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
    gap: t.spacing.xxl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: t.spacing.xl,
    paddingVertical: t.spacing.xxl,
  },
  header: { gap: t.spacing.xs },
  form: { gap: t.spacing.md },
  footer: { gap: t.spacing.md },
  notice: {
    backgroundColor: t.colors.warningSoft,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
  },
}));
