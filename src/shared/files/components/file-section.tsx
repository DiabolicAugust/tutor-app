import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCurrentUser } from '@/shared/auth';
import { useFormat, useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, Icon, IconButton, Text, icons, motion } from '@/shared/ui';

import { pickFile } from '../pick-file';
import { formatFileSize } from '../student-file';
import { useStudentFiles } from '../use-student-files';

export type FileSectionProps = {
  studentId: string | null;
};

/**
 * Documents kept against a student.
 *
 * There is no "open" action yet: showing a stored file needs a download to the
 * cache and a viewer to hand it to, and a button that half works would be worse
 * than its absence. What this does is the part that was asked for — put a file
 * somewhere it will still be next month, and take it away again.
 */
export function FileSection({ studentId }: FileSectionProps) {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const user = useCurrentUser();
  const { files, isLoading, isUploading, hasError, upload, remove } = useStudentFiles(studentId);

  const [pickerFailed, setPickerFailed] = useState(false);

  const choose = async () => {
    setPickerFailed(false);
    try {
      const picked = await pickFile();
      if (picked) await upload(picked);
    } catch {
      setPickerFailed(true);
    }
  };

  return (
    <Card title={t('files.title')}>
      {isLoading ? (
        <Text color="textSecondary">{t('common.loading')}</Text>
      ) : files.length === 0 ? (
        <Text variant="bodySm" color="textMuted">
          {t('files.empty')}
        </Text>
      ) : (
        files.map((file) => (
          <Animated.View
            key={file.id}
            style={styles.row}
            entering={motion.listEnter()}
            exiting={motion.listResolve()}
            layout={motion.listReflow()}
          >
            <Icon name={icons.document} size={18} color="textSecondary" />
            <View style={styles.details}>
              <Text variant="bodySm" numberOfLines={1}>
                {file.originalName}
              </Text>
              <Text variant="caption" color="textMuted">
                {t('files.meta', {
                  size: formatFileSize(file.sizeBytes),
                  when: format.dayTitle(new Date(file.createdAt)),
                })}
              </Text>
            </View>
            {/* Only what you added: the server refuses anything else, and an
                action that fails is worse than one that is not offered. */}
            {file.uploadedById === user.id ? (
              <IconButton
                name={icons.close}
                accessibilityLabel={t('files.remove')}
                onPress={() => void remove(file.id)}
              />
            ) : null}
          </Animated.View>
        ))
      )}

      <Button
        label={t('files.add')}
        variant="secondary"
        fullWidth
        loading={isUploading}
        onPress={() => void choose()}
      />

      {hasError || pickerFailed ? (
        <Animated.View entering={motion.messageEnter()}>
          <Text variant="caption" color="danger">
            {t('files.failed')}
          </Text>
        </Animated.View>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  details: { flex: 1, gap: 2 },
}));
