import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAddons } from '@/shared/addons';
import { apiClients } from '@/shared/api';
import { useCurrentUser } from '@/shared/auth';
import { FileSection } from '@/shared/files';
import { useFormat, useT } from '@/shared/i18n';
import { useAsyncData } from '@/shared/lib/use-async-data';
import { LessonNotesSheet, NoteSection } from '@/shared/notes';
import { StudentFormSheet, useStudents, type Student } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import { ownCalendarId } from '@/shared/tutors';
import { Button, Card, ListRow, Text, motion } from '@/shared/ui';

import type { LessonStatus, StudentLesson } from '@/shared/lessons';

/**
 * Status to copy.
 *
 * A record rather than an interpolated key: `t()` only accepts literal paths, so
 * a renamed status fails to compile here instead of rendering a raw key on
 * somebody's phone.
 */
const statusKeys = {
  scheduled: 'studentDetail.status.scheduled',
  completed: 'studentDetail.status.completed',
  cancelled: 'studentDetail.status.cancelled',
} as const satisfies Record<LessonStatus, string>;

/**
 * One student: who they are, what has happened, what was written down, and what
 * has been kept.
 *
 * Reading is open to any member who can reach the student. Editing needs
 * `MANAGE_STUDENTS` **and** the student to be theirs — an admin holds every
 * capability and reaches the whole school, so the same screen serves both
 * without a branch beyond that one check.
 */
export default function StudentScreen() {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useCurrentUser();
  const { has } = useAddons();
  const { students } = useStudents();

  const student: Student | undefined = students.find((candidate) => candidate.id === id);

  const [editing, setEditing] = useState<{ student: Student | null } | null>(null);
  const [openLesson, setOpenLesson] = useState<StudentLesson | null>(null);

  const { data, isLoading: isLoadingLessons } = useAsyncData(id ?? null, (studentId) =>
    apiClients.lessons.listForStudent(studentId),
  );
  const lessons = useMemo(() => data ?? [], [data]);

  // The student was removed — from this screen, most likely. Saying so beats a
  // page of empty sections.
  if (!student) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text color="textSecondary">{t('studentDetail.notFound')}</Text>
        </Card>
      </ScrollView>
    );
  }

  const mayEdit =
    has('MANAGE_STUDENTS') && (user.role === 'admin' || student.tutorId === ownCalendarId);

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.header}>
            <Text variant="titleLg">{student.name}</Text>
            <Text color="textSecondary">{student.subject}</Text>
            <Text variant="bodySm" color={student.paidLessonsLeft <= 2 ? 'warning' : 'textMuted'}>
              {t('event.lessonsLeft', { count: student.paidLessonsLeft })}
            </Text>
          </View>

          {mayEdit ? (
            <Button
              label={t('common.edit')}
              variant="secondary"
              fullWidth
              onPress={() => setEditing({ student })}
            />
          ) : null}
        </Card>

        <NoteSection
          subject={{ kind: 'student', id: student.id }}
          title={t('notes.studentTitle')}
          emptyHint={t('notes.studentEmpty')}
        />

        <Card title={t('studentDetail.lessons')}>
          {isLoadingLessons ? (
            <Text color="textSecondary">{t('common.loading')}</Text>
          ) : lessons.length === 0 ? (
            <Text variant="bodySm" color="textMuted">
              {t('studentDetail.lessonsEmpty')}
            </Text>
          ) : (
            lessons.map((lesson) => (
              <Animated.View key={lesson.id} layout={motion.listReflow()}>
                <ListRow
                  label={format.dayTitle(new Date(lesson.startsAt))}
                  description={`${lesson.subject} · ${t(statusKeys[lesson.status])}`}
                  value={
                    lesson.noteCount > 0
                      ? t('studentDetail.noteCount', { count: lesson.noteCount })
                      : undefined
                  }
                  onPress={() => setOpenLesson(lesson)}
                />
              </Animated.View>
            ))
          )}
        </Card>

        <FileSection studentId={student.id} />
      </ScrollView>

      <StudentFormSheet
        key={editing?.student?.id ?? 'new'}
        editing={editing}
        onClose={() => setEditing(null)}
        // Removed from here, so there is nothing left to look at.
        onRemoved={() => router.back()}
      />

      <LessonNotesSheet
        lessonId={openLesson?.id ?? null}
        title={
          openLesson
            ? `${openLesson.subject} · ${format.dayTitle(new Date(openLesson.startsAt))}`
            : ''
        }
        onClose={() => setOpenLesson(null)}
      />
    </>
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
  header: { gap: t.spacing.xs, paddingBottom: t.spacing.sm },
}));
