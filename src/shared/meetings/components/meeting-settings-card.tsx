import { useState } from 'react';
import { View } from 'react-native';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, ChipGroup, Text, TextField, useToast } from '@/shared/ui';
import { useUserConfig } from '@/shared/user-config';

import {
  meetingProviders,
  meetingRoomProblemKey,
  needsRoomUrl,
  type MeetingProvider,
} from '../meeting-provider';
import { useMeetingConnections } from '../use-meeting-connections';

/** The picker's own value for "I teach in a room", which is not a provider. */
const NONE = 'NONE';

type Choice = MeetingProvider | typeof NONE;

/**
 * Where this tutor teaches online.
 *
 * Two things happen here, and they are separate on purpose. The **choice** is a
 * preference on the account, read when a lesson is booked. The **connection** is
 * a credential held only by the server, and it is what allows a room to be
 * created per lesson rather than reusing one.
 *
 * Choosing Zoom or Meet starts the connection immediately, because the two are
 * one intention: nobody picks a provider in order to not use it, and a screen
 * that accepts the choice and then waits to be asked again is a screen where
 * half the tutors end up with no rooms and no idea why.
 *
 * Changing any of this affects lessons booked from now on. Links already sent to
 * students keep working, which the screen says, because it is the first thing
 * somebody wonders.
 */
export function MeetingSettingsCard() {
  const { t } = useT();
  const styles = useStyles();
  const toast = useToast();
  const { config, isSaving, hasError, update } = useUserConfig();
  const accounts = useMeetingConnections();

  const saved = config.meeting;
  const [choice, setChoice] = useState<Choice>(saved?.provider ?? NONE);
  const [roomUrl, setRoomUrl] = useState(saved?.roomUrl ?? '');
  const [showProblem, setShowProblem] = useState(false);

  // The session is the one owner of the choice, so a change made anywhere else —
  // another device, a failed save rolling back — has to win over what is on
  // screen. Adjusted during render rather than in an effect: React's own guidance
  // for "reset state when something changes", and it avoids showing the stale
  // value for a frame first.
  const signature = `${saved?.provider ?? NONE}:${saved?.roomUrl ?? ''}`;
  const [syncedTo, setSyncedTo] = useState(signature);

  if (syncedTo !== signature) {
    setSyncedTo(signature);
    setChoice(saved?.provider ?? NONE);
    setRoomUrl(saved?.roomUrl ?? '');
    setShowProblem(false);
  }

  const problemKey =
    choice === NONE ? null : meetingRoomProblemKey(choice, roomUrl);
  const wantsRoom = choice !== NONE && needsRoomUrl(choice);
  const connected = choice !== NONE && accounts.isConnected(choice);
  const connectable = choice !== NONE && accounts.canConnect(choice);

  const isUnchanged =
    choice === (saved?.provider ?? NONE) &&
    (!wantsRoom || roomUrl.trim() === (saved?.roomUrl ?? ''));

  /** Stores the choice. Returns whether it went through. */
  const save = async (next: Choice): Promise<boolean> => {
    if (next !== NONE && meetingRoomProblemKey(next, roomUrl) !== null) {
      // Shown on demand rather than while typing: an address is invalid for most
      // of the time it takes to enter one, and a field that scolds from the first
      // character is one people fight.
      setShowProblem(true);
      return false;
    }

    await update({
      meeting:
        next === NONE
          ? null
          : {
              provider: next,
              // Narrowed already by the branch above; kept only when this
              // provider reuses one room and something was actually typed.
              roomUrl:
                needsRoomUrl(next) && roomUrl.trim() !== ''
                  ? roomUrl.trim()
                  : null,
            },
    });

    return true;
  };

  const authorise = async (provider: MeetingProvider) => {
    const outcome = await accounts.connect(provider);

    if (outcome === 'connected') {
      toast.show(t('meetings.connectedToast'), 'success');
    } else if (outcome === 'failed') {
      toast.show(t('meetings.connectFailed'), 'error');
    }
    // A cancelled consent screen is not a failure and gets no message: the
    // person just decided not to, and they can see that for themselves.
  };

  const choose = async (next: Choice) => {
    setChoice(next);
    setShowProblem(false);

    // Saved straight away, so the connection that follows applies to a provider
    // the account has actually chosen. Without this, approving Zoom and then
    // leaving the screen would leave a credential attached to nothing.
    if (!(await save(next))) return;

    if (next !== NONE && accounts.canConnect(next) && !accounts.isConnected(next)) {
      await authorise(next);
    }
  };

  return (
    <View style={styles.card}>
      <ChipGroup
        testID="settings-meeting-provider"
        accessibilityLabel={t('meetings.provider.label')}
        value={choice}
        onChange={(next) => void choose(next)}
        options={[
          { value: NONE as Choice, label: t('meetings.provider.NONE') },
          ...meetingProviders.map((provider) => ({
            value: provider as Choice,
            label: t(`meetings.provider.${provider}`),
          })),
        ]}
      />

      <Text variant="caption" color="textSecondary">
        {t(`meetings.hint.${choice}`)}
      </Text>

      {/* The state of the connection, in the three ways it can be. Each says
          what rooms this tutor will actually get, because that is the only thing
          the distinction means to them. */}
      {choice === NONE || !needsRoomUrl(choice) ? null : accounts.isLoading ? null : !connectable ? (
        <Text testID="settings-meeting-unavailable" variant="caption" color="textMuted">
          {t('meetings.notConfigured')}
        </Text>
      ) : connected ? (
        <View style={styles.row}>
          <Text testID="settings-meeting-connected" variant="bodySm">
            {t('meetings.connected')}
          </Text>
          <Button
            testID="settings-meeting-disconnect"
            label={t('meetings.disconnect')}
            variant="secondary"
            disabled={accounts.isBusy}
            onPress={() => void accounts.disconnect(choice)}
          />
        </View>
      ) : (
        <View style={styles.row}>
          <Text testID="settings-meeting-disconnected" variant="bodySm" color="textSecondary">
            {t('meetings.notConnected')}
          </Text>
          <Button
            testID="settings-meeting-connect"
            label={t('meetings.connect')}
            loading={accounts.isBusy}
            onPress={() => void authorise(choice)}
          />
        </View>
      )}

      {wantsRoom ? (
        <TextField
          testID="settings-meeting-room"
          label={t('meetings.roomLabel')}
          value={roomUrl}
          onChangeText={(next) => {
            setRoomUrl(next);
            setShowProblem(false);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder={t(`meetings.example.${choice}`)}
          error={showProblem && problemKey ? t(problemKey) : undefined}
          // Optional, and the hint says what it is for. Once an account is
          // connected this address is only the fallback for a minute when the
          // provider cannot be reached.
          hint={t(connected ? 'meetings.roomHintFallback' : 'meetings.roomHint')}
        />
      ) : null}

      {wantsRoom ? (
        <Button
          testID="settings-meeting-save"
          label={t('common.save')}
          variant="secondary"
          disabled={isSaving || isUnchanged}
          onPress={() => void save(choice)}
        />
      ) : null}

      {hasError ? (
        <Text testID="settings-meeting-error" variant="caption" color="danger">
          {t('meetings.saveFailed')}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  card: { gap: t.spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.sm,
    flexWrap: 'wrap',
  },
}));
