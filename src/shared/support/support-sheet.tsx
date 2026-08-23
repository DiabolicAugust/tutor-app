import { useState } from 'react';
import Animated from 'react-native-reanimated';

import { apiClients } from '@/shared/api';
import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, ModalSheet, Text, TextField, motion } from '@/shared/ui';

import type { SupportClient } from './support-client';

/**
 * Contact form for support.
 *
 * Submits through the backend, which stores the request before trying to notify
 * anyone — so "sent" means recorded, not merely emailed. That is why the
 * confirmation can be stated plainly.
 */
export function SupportSheet({
  visible,
  onClose,
  client = apiClients.support,
}: {
  visible: boolean;
  onClose: () => void;
  client?: SupportClient;
}) {
  const { t } = useT();
  const styles = useStyles();

  const [message, setMessage] = useState('');
  const [errorKey, setErrorKey] = useState<'support.tooShort' | 'support.failed' | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const close = () => {
    setMessage('');
    setErrorKey(null);
    setIsSent(false);
    onClose();
  };

  const handleSend = async () => {
    if (message.trim().length < 10) {
      setErrorKey('support.tooShort');
      return;
    }

    setErrorKey(null);
    setIsSending(true);
    try {
      await client.submit(message);
      setIsSent(true);
      setMessage('');
    } catch {
      setErrorKey('support.failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={close}
      title={t('support.compose')}
      footer={
        isSent ? (
          <Button label={t('common.done')} fullWidth size="lg" onPress={close} />
        ) : (
          <Button
            label={t('support.send')}
            fullWidth
            size="lg"
            loading={isSending}
            onPress={() => void handleSend()}
          />
        )
      }
    >
      {isSent ? (
        <Animated.View entering={motion.listEnter()}>
          <Card style={styles.confirmation}>
            <Text variant="bodySm" color="success">
              {t('support.sent')}
            </Text>
          </Card>
        </Animated.View>
      ) : (
        <>
          <Text variant="bodySm" color="textSecondary">
            {t('support.explanation')}
          </Text>

          <TextField
            label={t('support.message')}
            value={message}
            onChangeText={(value) => {
              setMessage(value);
              setErrorKey(null);
            }}
            placeholder={t('support.placeholder')}
            error={errorKey ? t(errorKey) : undefined}
            multiline
            numberOfLines={5}
            maxLength={2000}
            autoFocus
          />
        </>
      )}
    </ModalSheet>
  );
}

const useStyles = createStyles((t) => ({
  confirmation: { backgroundColor: t.colors.successSoft, borderColor: 'transparent' },
}));
