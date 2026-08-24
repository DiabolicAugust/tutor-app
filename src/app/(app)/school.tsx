import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { allAddons, describeAddon, useAddons, type AddonKey } from '@/shared/addons';
import { useCurrentUser } from '@/shared/auth';
import { useFormat, useT } from '@/shared/i18n';
import { useSchool, type SchoolMember } from '@/shared/school';
import { SubjectsCard } from '@/shared/subjects';
import { createStyles } from '@/shared/theme';
import { Button, Card, Icon, ListRow, ModalSheet, Text, TextField, motion } from '@/shared/ui';

/** Which transient surface is open. Only one at a time. */
type Sheet = 'none' | 'invite' | 'announce' | 'member';

/**
 * School management.
 *
 * Two different gates are at work here, and the difference matters:
 * - **The screen itself** is for admins — it is where capabilities are handed
 *   out, and that is the one thing which must not be delegable.
 * - **The actions on it** are gated on capabilities, so the invite button
 *   appears for anyone holding `INVITE_TUTORS`, admin or not.
 *
 * Both read from the session, which already carries role and addons, so nothing
 * here waits on a request to decide what to render.
 */
export default function SchoolScreen() {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const user = useCurrentUser();
  const { has } = useAddons();
  const {
    tutors,
    invitations,
    isLoading,
    errorKey,
    inviteTutor,
    setMemberAddons,
    announce,
    clearError,
  } = useSchool();

  const [sheet, setSheet] = useState<Sheet>('none');
  const [member, setMember] = useState<SchoolMember | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [validationKey, setValidationKey] = useState<'school.invalidEmail' | 'announcement.tooShort' | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [sentTo, setSentTo] = useState<number | null>(null);

  const canInvite = has('INVITE_TUTORS');
  const canAnnounce = has('BROADCAST_ANNOUNCEMENTS');
  const isAdmin = user.role === 'admin';

  const closeSheet = () => {
    setSheet('none');
    setMember(null);
    setEmail('');
    setMessage('');
    setValidationKey(null);
    clearError();
  };

  const handleInvite = async () => {
    // Deliberately lenient: the server decides what a valid address is, and a
    // regex here would only reject addresses that actually work.
    if (!email.includes('@') || email.trim().length < 5) {
      setValidationKey('school.invalidEmail');
      return;
    }

    setIsBusy(true);
    const sent = await inviteTutor(email);
    setIsBusy(false);
    if (sent) closeSheet();
  };

  const handleAnnounce = async () => {
    if (message.trim().length < 4) {
      setValidationKey('announcement.tooShort');
      return;
    }

    setIsBusy(true);
    const recipients = await announce(message);
    setIsBusy(false);

    if (recipients !== null) {
      setSentTo(recipients);
      closeSheet();
    }
  };

  const toggleAddon = (target: SchoolMember, addon: AddonKey) => {
    const next = target.addons.includes(addon)
      ? target.addons.filter((key) => key !== addon)
      : [...target.addons, addon];

    setMember({ ...target, addons: next });
    void setMemberAddons(target.id, next);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} testID="screen-school">
        {sentTo !== null ? (
          <Animated.View entering={motion.listEnter()} exiting={motion.messageExit()}>
            <Card style={styles.confirmation} testID="announcement-sent">
              <Text variant="bodySm" color="success">
                {t('announcement.sent', { count: sentTo })}
              </Text>
            </Card>
          </Animated.View>
        ) : null}

        <Card title={t('school.tutors')}>
          {isLoading ? (
            <Text color="textSecondary">{t('common.loading')}</Text>
          ) : tutors.length === 0 ? (
            // "Loading" for a school that simply has nobody in it yet is the
            // app saying it is working when it has finished.
            <Text testID="school-tutors-empty" variant="bodySm" color="textMuted">
              {t('school.tutorsEmpty')}
            </Text>
          ) : (
            tutors.map((tutor, index) => (
              <ListRow
                key={tutor.id}
                testID={`school-tutor-${index}`}
                label={tutor.id === user.id ? t('school.you', { name: tutor.name }) : tutor.name}
                description={tutor.email}
                value={
                  tutor.addons.length > 0 ? String(tutor.addons.length) : undefined
                }
                // Only an admin can change grants, so only an admin gets a row
                // that opens.
                onPress={
                  isAdmin
                    ? () => {
                        setMember(tutor);
                        setSheet('member');
                      }
                    : undefined
                }
              />
            ))
          )}
        </Card>

        <Card title={t('school.invitations')}>
          <Text variant="caption" color="textMuted">
            {t('school.invitationsHint')}
          </Text>

          {invitations.length === 0 ? (
            <Text testID="school-no-invitations" color="textSecondary">
              {t('school.noInvitations')}
            </Text>
          ) : (
            invitations.map((invitation, index) => (
              <Animated.View
                key={invitation.id}
                testID={`school-invitation-${index}`}
                entering={motion.listEnter()}
                layout={motion.listReflow()}
              >
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

        {/* Admin-only, and by role rather than by capability: what a school
            teaches is the vocabulary every record is written in, so changing it
            is not a job to hand out. */}
        {isAdmin ? <SubjectsCard /> : null}

        {/* Each action appears only for the capability that permits it. */}
        {canInvite ? (
          <Button
            testID="school-invite"
            label={t('school.inviteTutor')}
            fullWidth
            onPress={() => setSheet('invite')}
          />
        ) : null}

        {canAnnounce ? (
          <Button
            testID="school-announce"
            label={t('announcement.compose')}
            variant="secondary"
            fullWidth
            onPress={() => setSheet('announce')}
          />
        ) : null}
      </ScrollView>

      <ModalSheet
        visible={sheet === 'invite'}
        onClose={closeSheet}
        title={t('school.inviteTutor')}
        testID="invite-sheet"
        footer={
          <Button
            testID="invite-send"
            label={t('school.sendInvite')}
            fullWidth
            size="lg"
            loading={isBusy}
            onPress={() => void handleInvite()}
          />
        }
      >
        <Text variant="bodySm" color="textSecondary">
          {t('school.inviteExplanation')}
        </Text>

        <TextField
          testID="invite-email"
          label={t('auth.email')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setValidationKey(null);
          }}
          placeholder={t('auth.emailPlaceholder')}
          error={validationKey ? t(validationKey) : errorKey ? t(errorKey) : undefined}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          autoFocus
        />
      </ModalSheet>

      <ModalSheet
        visible={sheet === 'announce'}
        onClose={closeSheet}
        title={t('announcement.compose')}
        testID="announce-sheet"
        footer={
          <Button
            testID="announce-send"
            label={t('announcement.send')}
            fullWidth
            size="lg"
            loading={isBusy}
            onPress={() => void handleAnnounce()}
          />
        }
      >
        <Text variant="bodySm" color="textSecondary">
          {t('announcement.explanation')}
        </Text>

        <TextField
          testID="announce-message"
          label={t('announcement.message')}
          value={message}
          onChangeText={(value) => {
            setMessage(value);
            setValidationKey(null);
          }}
          placeholder={t('announcement.placeholder')}
          error={validationKey ? t(validationKey) : errorKey ? t(errorKey) : undefined}
          multiline
          numberOfLines={4}
          maxLength={500}
          autoFocus
        />
      </ModalSheet>

      <ModalSheet
        visible={sheet === 'member' && member !== null}
        onClose={closeSheet}
        title={member?.name ?? ''}
        testID="member-sheet"
      >
        <Text variant="label" color="textSecondary">
          {t('addons.title')}
        </Text>
        <Text variant="caption" color="textMuted">
          {t('addons.hint')}
        </Text>

        {member
          ? allAddons.map((key) => {
              const descriptor = describeAddon(key);
              return (
                <View key={key} style={styles.addonRow}>
                  <Icon
                    name={descriptor.icon}
                    size={18}
                    color={member.addons.includes(key) ? 'brand' : 'textMuted'}
                  />
                  <ListRow
                    testID={`member-addon-${key}`}
                    // This row shares its line with the icon beside it, so
                    // reaching outwards would paint the highlight over it.
                    edgeToEdge={false}
                    label={t(descriptor.titleKey)}
                    description={t(descriptor.descriptionKey)}
                    selectable
                    selected={member.addons.includes(key)}
                    onPress={() => toggleAddon(member, key)}
                    style={styles.addonListRow}
                  />
                </View>
              );
            })
          : null}
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
  confirmation: { backgroundColor: t.colors.successSoft, borderColor: 'transparent' },
  addonRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  addonListRow: { flex: 1 },
}));
