import { Image } from 'expo-image';

import { useT } from '@/shared/i18n';
import { useAsyncData } from '@/shared/lib/use-async-data';
import { createStyles } from '@/shared/theme';
import { ModalSheet, Text } from '@/shared/ui';

import { downloadFile } from '../open-file';
import type { StoredFile } from '../stored-file';

export type FilePreviewSheetProps = {
  /** The image to show, or `null` to close. */
  file: StoredFile | null;
  onClose: () => void;
};

/**
 * An image, shown in the app.
 *
 * Only images. Anything else goes to the OS through the share sheet, because a
 * tutor's files are contracts and spreadsheets and this app has no business
 * rendering a `.docx` — but a photo of homework is the common case, and bouncing
 * out to another app to look at one is a worse answer than showing it.
 *
 * The file is downloaded first rather than pointed at: the endpoint needs an
 * `Authorization` header, and an `Image` given a bare URL fetches it without one.
 */
export function FilePreviewSheet({ file, onClose }: FilePreviewSheetProps) {
  const { t } = useT();
  const styles = useStyles();
  // Keyed on the file id, so opening a different image drops the previous one
  // rather than showing it while the new one downloads.
  const { data: uri, isLoading } = useAsyncData(file?.id ?? null, () => downloadFile(file!));

  return (
    <ModalSheet
      visible={file !== null}
      onClose={onClose}
      title={file?.originalName ?? ''}
      testID="file-preview-sheet"
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="contain"
          transition={120}
          accessibilityLabel={file?.originalName}
        />
      ) : (
        <Text color={isLoading ? 'textSecondary' : 'danger'}>
          {t(isLoading ? 'common.loading' : 'files.openFailed')}
        </Text>
      )}
    </ModalSheet>
  );
}

const useStyles = createStyles((t) => ({
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
}));
