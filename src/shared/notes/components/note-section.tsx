import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCurrentUser } from '@/shared/auth';
import { useFormat, useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, Icon, IconButton, Text, TextField, icons, motion } from '@/shared/ui';

import type { NoteSubject } from '../note';
import { useNotes } from '../use-notes';

export type NoteSectionProps = {
  subject: NoteSubject | null;
  /** Card heading. Differs between a student's notes and a lesson's. */
  title: string;
  /** Shown when there are none yet. */
  emptyHint: string;
};

/**
 * Notes for one subject, with a box to write another.
 *
 * The same component for a student and for a lesson, because they are the same
 * interaction — read what was written, add to it, remove your own. Only the
 * heading and the empty hint differ, and those are props rather than a branch.
 */
export function NoteSection({ subject, title, emptyHint }: NoteSectionProps) {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const user = useCurrentUser();
  const { notes, isLoading, hasError, add, remove } = useNotes(subject);

  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    if (draft.trim().length === 0) return;

    setIsSaving(true);
    try {
      await add(draft);
      setDraft('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card title={title}>
      {isLoading ? (
        <Text color="textSecondary">{t('common.loading')}</Text>
      ) : notes.length === 0 ? (
        <Text variant="bodySm" color="textMuted">
          {emptyHint}
        </Text>
      ) : (
        notes.map((note) => (
          <Animated.View
            key={note.id}
            style={styles.note}
            entering={motion.listEnter()}
            exiting={motion.listResolve()}
            layout={motion.listReflow()}
          >
            <View style={styles.noteHeader}>
              <Icon name={icons.person} size={14} color="textMuted" />
              <Text variant="caption" color="textMuted" style={styles.noteMeta}>
                {t('notes.byline', {
                  author: note.author.name,
                  when: format.dayTitle(new Date(note.createdAt)),
                })}
              </Text>
              {/* Only your own: editing what a colleague wrote about a shared
                  student is a different feature, and the server refuses it. */}
              {note.author.id === user.id ? (
                <IconButton
                  name={icons.close}
                  accessibilityLabel={t('notes.remove')}
                  onPress={() => void remove(note.id)}
                />
              ) : null}
            </View>
            <Text>{note.text}</Text>
          </Animated.View>
        ))
      )}

      <View style={styles.composer}>
        <TextField
          label={t('notes.add')}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('notes.placeholder')}
          multiline
          error={hasError ? t('notes.failed') : undefined}
        />
        <Button
          label={t('notes.save')}
          onPress={() => void submit()}
          loading={isSaving}
          disabled={draft.trim().length === 0}
          fullWidth
        />
      </View>
    </Card>
  );
}

const useStyles = createStyles((t) => ({
  note: {
    gap: t.spacing.xs,
    paddingVertical: t.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  noteMeta: { flex: 1 },
  composer: { gap: t.spacing.sm, paddingTop: t.spacing.sm },
}));
