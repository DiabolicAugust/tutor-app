import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCurrentUser } from '@/shared/auth';
import { useFormat, useT } from '@/shared/i18n';
import { useSchool } from '@/shared/school';
import { createStyles } from '@/shared/theme';
import {
  Button,
  Card,
  ListRow,
  ModalSheet,
  Text,
  TextField,
  motion,
} from '@/shared/ui';

/**
 * School management, for admins.
 *
 * Reached from the More tab, which only shows the entry when the session's role
 * is `admin` — the role arrives with the session at sign-in, so no extra request
 * is needed to know what to render.
 */
export default function SchoolScreen() {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const user = useCurrentUser();
  const { tutors, invitations, isLoading, errorKey, inviteTutor, clearError } = useSchool();

  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailError, setShowEmailError] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const closeSheet = () => {
    setIsInviting(false);
    setEmail('');
    setShowEmailError(false);
    clearError();
  };

  const handleInvite = async () => {
    // Deliberately lenient: the server is the authority on what a valid address
    // is, and a regex here would only reject addresses that actually work.
    if (!email.includes('@') || email.trim().length < 5) {
      setShowEmailError(true);
      return;
    }

    setIsSending(true);
    const sent = await inviteTutor(email);
    setIsSending(false);
    if (sent) closeSheet();
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <Card title={t('school.tutors')}>
          {isLoading ? (
            <Text color="textSecondary">{t('common.loading')}</Text>
          ) : (
            tutors.map((tutor) => (
              <ListRow
                key={tutor.id}
                label={tutor.id === user.id ? t('school.you', { name: tutor.name }) : tutor.name}
                description={tutor.email}
              />
            ))
          )}
        </Card>

        <Card title={t('school.invitations')}>
          <Text variant="caption" color="textMuted">
            {t('school.invitationsHint')}
          </Text>

          {invitations.length === 0 ? (
            <Text color="textSecondary">{t('school.noInvitations')}</Text>
          ) : (
            invitations.map((invitation) => (
              <Animated.View key={invitation.id} entering={motion.listEnter()} layout={motion.listReflow()}>
                <ListRow
                  label={invitation.email}
                  description={format.date(invitation.createdAt, {
                    day: 'numeric',
                    month: 'short',
                  })}
                  value={t(`school.status.${invitation.status}`)}
                />
              </Animated.View>
            ))
          )}
        </Card>

        <Button label={t('school.inviteTutor')} fullWidth onPress={() => setIsInviting(true)} />
      </ScrollView>

      <ModalSheet
        visible={isInviting}
        onClose={closeSheet}
        title={t('school.inviteTutor')}
        footer={
          <Button
            label={t('school.sendInvite')}
            fullWidth
            size="lg"
            loading={isSending}
            onPress={() => void handleInvite()}
          />
        }
      >
        <Text variant="bodySm" color="textSecondary">
          {t('school.inviteExplanation')}
        </Text>

        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (showEmailError) setShowEmailError(false);
          }}
          placeholder={t('auth.emailPlaceholder')}
          error={
            showEmailError
              ? t('school.invalidEmail')
              : errorKey
                ? t(errorKey)
                : undefined
          }
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          autoFocus
        />
      </ModalSheet>
    </>
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
