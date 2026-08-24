import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { hasApi } from '@/shared/api/api-config';
import { useCurrentUser } from '@/shared/auth';
import { useFormat, useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, Icon, IconButton, Text, icons, motion } from '@/shared/ui';

import { isPreviewable, openFileExternally, shareFile } from '../open-file';
import { pickFile } from '../pick-file';
import { formatFileSize, type StoredFile } from '../stored-file';
import { useFiles, type FileFailure, type FileSource } from '../use-files';
import { FilePreviewSheet } from './file-preview-sheet';

/** A record, so a renamed reason fails to compile rather than render a key. */
const failureKeys = {
  type: 'files.failedType',
  tooLarge: 'files.failedTooLarge',
  offline: 'files.failedOffline',
  unknown: 'files.failed',
} as const satisfies Record<FileFailure, string>;

export type FileSectionProps = {
  /** Whose files to show — a student's documents, or the caller's own shelf. */
  source: FileSource | null;
  /** Card heading. A student's documents read differently from a shelf. */
  title?: string;
  emptyHint?: string;
};

/**
 * Documents kept against a student.
 *
 * Tapping one opens it. Images are shown here — a photo of homework is the common
 * case and bouncing out to another app to look at one is worse than showing it.
 * Everything else goes to the OS through the share sheet, because these are
 * contracts and spreadsheets and this app has no business rendering a `.docx`
 * when the device already knows which app does.
 */
export function FileSection({ source, title, emptyHint }: FileSectionProps) {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const user = useCurrentUser();
  const { files, isLoading, isUploading, hasError, failure, upload, remove } = useFiles(source);

  const [pickerFailed, setPickerFailed] = useState(false);
  const [preview, setPreview] = useState<StoredFile | null>(null);
  const [openFailed, setOpenFailed] = useState<'unavailable' | 'failed' | null>(null);

  const open = async (file: StoredFile) => {
    setOpenFailed(null);

    // No server, no bytes. The mock records what was picked so the list behaves,
    // but there is nothing to fetch — saying so beats a spinner that ends in an
    // error nobody can act on.
    if (!hasApi) {
      setOpenFailed('unavailable');
      return;
    }

    if (isPreviewable(file)) {
      setPreview(file);
      return;
    }

    try {
      await openFileExternally(file);
    } catch {
      setOpenFailed('failed');
    }
  };

  /**
   * Sends the file somewhere.
   *
   * Its own action rather than a second tap inside the preview: sharing a
   * worksheet with a parent is one of the two things tutors do with these, and
   * burying it behind opening the file first would add a step to the common case.
   */
  const share = async (file: StoredFile) => {
    setOpenFailed(null);

    if (!hasApi) {
      setOpenFailed('unavailable');
      return;
    }

    try {
      await shareFile(file);
    } catch {
      setOpenFailed('failed');
    }
  };

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
    <Card title={title ?? t('files.title')}>
      {isLoading ? (
        <Text color="textSecondary">{t('common.loading')}</Text>
      ) : files.length === 0 ? (
        <Text variant="bodySm" color="textMuted">
          {emptyHint ?? t('files.empty')}
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
            <Pressable
              style={styles.open}
              onPress={() => void open(file)}
              accessibilityRole="button"
              accessibilityLabel={t('files.open', { name: file.originalName })}
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
            </Pressable>
            <IconButton
              name={icons.share}
              accessibilityLabel={t('files.share', { name: file.originalName })}
              onPress={() => void share(file)}
            />

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
          {/* Named rather than generic: the three common reasons need three
              different responses, and one message for all of them tells nobody
              what to do next. */}
          <Text variant="caption" color="danger">
            {t(failureKeys[failure ?? 'unknown'])}
          </Text>
        </Animated.View>
      ) : null}

      {openFailed ? (
        <Animated.View entering={motion.messageEnter()}>
          <Text variant="caption" color={openFailed === 'unavailable' ? 'warning' : 'danger'}>
            {t(openFailed === 'unavailable' ? 'files.openUnavailable' : 'files.openFailed')}
          </Text>
        </Animated.View>
      ) : null}

      <FilePreviewSheet file={preview} onClose={() => setPreview(null)} />
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
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  details: { flex: 1, gap: 2 },
}));
