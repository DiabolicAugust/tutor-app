import { Linking, Share, View } from 'react-native';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Text, useToast } from '@/shared/ui';

import type { MeetingProvider } from '../meeting-provider';

export type MeetingLinkProps = {
  url: string;
  /** Null for a lesson booked before the provider was recorded. */
  provider: MeetingProvider | null;
  /**
   * What the lesson is, for the message that goes out with the link. Without it
   * a student receives a bare URL from an unnamed sender, which reads like spam
   * and is the reason this is not optional in practice.
   */
  shareTitle: string;
};

/**
 * The link to join a lesson, and the two things anybody does with it.
 *
 * Opening and sharing rather than a "copy" button: the system share sheet
 * already offers copying alongside every messenger on the phone, and a tutor
 * sending a link to a parent is sending it *somewhere* — a clipboard is a detour
 * through an app they then have to find.
 */
export function MeetingLink({ url, provider, shareTitle }: MeetingLinkProps) {
  const { t } = useT();
  const styles = useStyles();
  const toast = useToast();

  const open = async () => {
    try {
      await Linking.openURL(url);
    } catch {
      // The provider's app may not be installed and no browser may claim the
      // URL. Saying so beats a button that does nothing.
      toast.show(t('meetings.cannotOpen'), 'error');
    }
  };

  const share = async () => {
    try {
      await Share.share({
        // Both fields: Android reads `message`, iOS prefers `url` and puts the
        // title on the sheet itself.
        message: `${shareTitle}\n${url}`,
        url,
        title: shareTitle,
      });
    } catch {
      toast.show(t('meetings.cannotShare'), 'error');
    }
  };

  return (
    <View style={styles.container} testID="lesson-meeting">
      <Text variant="label" color="textSecondary">
        {provider === null
          ? t('meetings.onlineLesson')
          : t(`meetings.provider.${provider}`)}
      </Text>
      {/* The address itself, so somebody can see where they are being sent
          before they tap — and read it out if the link will not open. */}
      <Text testID="lesson-meeting-url" variant="bodySm" numberOfLines={1}>
        {url}
      </Text>

      <View style={styles.actions}>
        <Button
          testID="lesson-meeting-join"
          label={t('meetings.join')}
          onPress={() => void open()}
        />
        <Button
          testID="lesson-meeting-share"
          label={t('meetings.share')}
          variant="secondary"
          onPress={() => void share()}
        />
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  container: { gap: t.spacing.xs },
  actions: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.xs },
}));
