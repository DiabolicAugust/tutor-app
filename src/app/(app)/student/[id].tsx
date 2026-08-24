import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAddons } from '@/shared/addons';
import { apiClients } from '@/shared/api';
import { useCurrentUser } from '@/shared/auth';
import { FileSection } from '@/shared/files';
import {
  GradeSection,
  LessonJournalSheet,
  ProgressCard,
  attendanceKeys,
  useStudentProgress,
} from '@/shared/gradebook';
import { useFormat, useT } from '@/shared/i18n';
import { useAsyncData } from '@/shared/lib/use-async-data';
import { NoteSection } from '@/shared/notes';
import { StudentFormSheet, useStudents, type Student } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import { Button, Card, ListRow, Text, motion } from '@/shared/ui';

import { attendanceFor, type LessonStatus, type StudentLesson } from '@/shared/lessons';

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

  const {
    data,
    isLoading: isLoadingLessons,
    setData: setLessons,
  } = useAsyncData(id ?? null, (studentId) => apiClients.lessons.listForStudent(studentId));
  const lessons = useMemo(() => data ?? [], [data]);

  const {
    progress,
    isLoading: isLoadingProgress,
    reload: reloadProgress,
  } = useStudentProgress(id ?? null);

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

  /**
   * The right-hand side of a lesson row: how this student was marked, or a nudge
   * that the lesson still needs writing up.
   */
  const valueFor = (lesson: StudentLesson): string | undefined => {
    const marked = attendanceFor(lesson, student.id);
    if (marked) return t(attendanceKeys[marked.status]);
    return lesson.status === 'scheduled'
      ? undefined
      : t('gradebook.journal.needsWriteUp');
  };

  const mayEdit =
    has('MANAGE_STUDENTS') && (user.role === 'admin' || student.tutorId === user.id);

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

        <ProgressCard progress={progress} isLoading={isLoadingProgress} />

        <GradeSection
          subject={{ kind: 'student', id: student.id }}
          title={t('gradebook.grade.studentTitle')}
          emptyHint={t('gradebook.grade.studentEmpty')}
          onChanged={reloadProgress}
        />

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
                  // The topic is what makes the history readable: "Mathematics ·
                  // Took place" is the same line twenty times over, while what
                  // was covered is the thing anybody scrolls this looking for.
                  description={[
                    // The topic is what makes the history readable; the group
                    // name is what tells a shared lesson from a private one.
                    lesson.topic ?? lesson.subject,
                    lesson.group?.name,
                    t(statusKeys[lesson.status]),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  // This student's own line, not the whole room's: a group
                  // lesson carries a register, and their page is about them.
                  value={valueFor(lesson)}
                  onPress={() => setOpenLesson(lesson)}
                />
              </Animated.View>
            ))
          )}
        </Card>

        <FileSection source={{ kind: 'student', id: student.id }} />
      </ScrollView>

      <StudentFormSheet
        key={editing?.student?.id ?? 'new'}
        editing={editing}
        onClose={() => setEditing(null)}
        // Removed from here, so there is nothing left to look at.
        onRemoved={() => router.back()}
      />

      <LessonJournalSheet
        lesson={openLesson}
        title={
          openLesson
            ? `${openLesson.subject} · ${format.dayTitle(new Date(openLesson.startsAt))}`
            : ''
        }
        onClose={() => setOpenLesson(null)}
        // Patched in place rather than refetched: the sheet already has the
        // authoritative row back from the server, and a second request would put
        // a spinner over a list that is already correct.
        onSaved={(saved) => {
          setLessons((current) =>
            (current ?? []).map((lesson) =>
              lesson.id === saved.id ? { ...lesson, ...saved } : lesson,
            ),
          );
          setOpenLesson((current) =>
            current && current.id === saved.id ? { ...current, ...saved } : current,
          );
        }}
        onChanged={reloadProgress}
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
