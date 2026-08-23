import { ScrollView } from 'react-native';

import { FileSection } from '@/shared/files';
import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Card, Text } from '@/shared/ui';

/**
 * The tutor's own shelf.
 *
 * Their material rather than the school's: a worksheet somebody reuses, a
 * textbook scan, an exam paper. Kept apart from a student's documents because
 * they answer different questions — "what do I have to teach with" and "what do
 * we hold about this person" — and mixing them would make both lists useless.
 *
 * The same `FileSection` the student page uses, pointed at a different source.
 * One component for one interaction: read what is there, add to it, open it,
 * send it on.
 */
export default function FilesScreen() {
  const { t } = useT();
  const styles = useStyles();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text variant="titleSm">{t('library.title')}</Text>
        <Text variant="bodySm" color="textSecondary">
          {t('library.hint')}
        </Text>
      </Card>

      <FileSection
        source={{ kind: 'library' }}
        title={t('library.files')}
        emptyHint={t('library.empty')}
      />
    </ScrollView>
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
