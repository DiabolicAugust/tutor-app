import { useT } from '@/shared/i18n';
import { ModalSheet } from '@/shared/ui';

import { NoteSection } from './note-section';

export type LessonNotesSheetProps = {
  /** The lesson to annotate, or `null` to close. */
  lessonId: string | null;
  /** Shown as the sheet's title — the lesson's subject and when it was. */
  title: string;
  onClose: () => void;
};

/**
 * Notes for one lesson, in a sheet.
 *
 * A sheet rather than a screen: writing up a lesson happens while looking at the
 * list of them, and pushing a whole screen for two lines of text means finding
 * your place in the history again afterwards.
 */
export function LessonNotesSheet({ lessonId, title, onClose }: LessonNotesSheetProps) {
  const { t } = useT();

  return (
    <ModalSheet visible={lessonId !== null} onClose={onClose} title={title}>
      <NoteSection
        subject={lessonId ? { kind: 'lesson', id: lessonId } : null}
        title={t('notes.lessonTitle')}
        emptyHint={t('notes.lessonEmpty')}
      />
    </ModalSheet>
  );
}
