import { useT } from '@/shared/i18n';
import { useAsyncData } from '@/shared/lib/use-async-data';
import { Text } from '@/shared/ui';

import { isRegistration, requestPushToken, type PushUnavailable } from '../push-token';

const reasonKeys = {
  denied: 'notificationSettings.pushDenied',
  unsupported: 'notificationSettings.pushUnsupported',
  'not-configured': 'notificationSettings.pushNotConfigured',
  failed: 'notificationSettings.pushNotConfigured',
} as const satisfies Record<PushUnavailable['reason'], string>;

/**
 * Whether this device will actually receive announcements.
 *
 * Worth stating rather than leaving to be discovered. Every reason it might not
 * is invisible from inside the app — permission switched off in system settings,
 * a build with no push project, a browser — and silence is indistinguishable
 * from "nothing has been announced".
 *
 * Reads the current state rather than prompting: this is a status line, and a
 * permission dialog appearing because somebody opened settings would be a
 * dialog they did not ask for.
 */
export function PushStatus() {
  const { t } = useT();
  const { data } = useAsyncData('push-status', requestPushToken);

  if (!data) return null;

  return isRegistration(data) ? (
    <Text variant="caption" color="textMuted">
      {t('notificationSettings.pushReady')}
    </Text>
  ) : (
    <Text variant="caption" color={data.reason === 'denied' ? 'warning' : 'textMuted'}>
      {t(reasonKeys[data.reason])}
    </Text>
  );
}
