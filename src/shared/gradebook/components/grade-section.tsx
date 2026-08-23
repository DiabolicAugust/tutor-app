import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCurrentUser } from '@/shared/auth';
import { useFormat, useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, IconButton, Text, icons, motion } from '@/shared/ui';

import type { Grade, GradeInput, GradeSubject } from '../grade';
import { useGradesEnabled } from '../use-grades-enabled';
import { useGradebook } from '../use-student-gradebook';
import { GradeBadge } from './grade-badge';
import { GradeFormSheet } from './grade-form-sheet';

export type GradeSectionProps = {
  subject: GradeSubject | null;
  /** Card heading — a student's whole record reads differently from one lesson's. */
  title: string;
  emptyHint: string;
  /** Called after any write, so a progress card above can refresh its average. */
  onChanged?: () => void;
};

/**
 * The marks for one subject, with a way to add another.
 *
 * The same component for a student and for a lesson, because it is the same
 * interaction — read what was given, add to it, correct your own. Only the
 * heading and the empty hint differ, and those are props rather than a branch.
 */
export function GradeSection({
  subject,
  title,
  emptyHint,
  onChanged,
}: GradeSectionProps) {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const user = useCurrentUser();
  const gradesEnabled = useGradesEnabled();
  // Passing `null` when marking is off means the hook never fetches, so a tutor
  // who does not grade pays for no request either.
  const { grades, isLoading, hasError, add, update, remove } = useGradebook(
    gradesEnabled ? subject : null,
  );

  const [editing, setEditing] = useState<{ grade: Grade | null } | null>(null);

  // Nothing at all, not an empty card: the point of the setting is that a tutor
  // who never marks anything stops seeing a gradebook on every student.
  if (!gradesEnabled) return null;

  const submit = async (input: GradeInput) => {
    const target = editing?.grade;
    if (target) {
      await update(target.id, input);
    } else {
      await add(input);
    }
    onChanged?.();
    // Left open on failure, so what was typed is still there to retry with.
    if (!hasError) setEditing(null);
  };

  return (
    <>
      <Card title={title}>
        {isLoading ? (
          <Text color="textSecondary">{t('common.loading')}</Text>
        ) : grades.length === 0 ? (
          <Text variant="bodySm" color="textMuted">
            {emptyHint}
          </Text>
        ) : (
          grades.map((grade) => (
            <Animated.View
              key={grade.id}
              style={styles.row}
              entering={motion.listEnter()}
              exiting={motion.listResolve()}
              layout={motion.listReflow()}
            >
              <GradeBadge grade={grade} />

              <View style={styles.body}>
                <Text variant="label" numberOfLines={1}>
                  {grade.category ?? t('gradebook.grade.uncategorised')}
                </Text>
                {grade.comment ? (
                  <Text variant="bodySm" color="textSecondary">
                    {grade.comment}
                  </Text>
                ) : null}
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {t('gradebook.grade.byline', {
                    author: grade.author.name,
                    when: format.dayTitle(new Date(grade.createdAt)),
                  })}
                  {/* Only worth saying when it is not the default. */}
                  {grade.weight > 1
                    ? ` · ${t('gradebook.grade.weightBadge', { count: grade.weight })}`
                    : ''}
                </Text>
              </View>

              {/* Only your own: the server refuses a colleague's, and offering a
                  control that always fails is worse than not offering it. */}
              {grade.author.id === user.id ? (
                <View style={styles.actions}>
                  <IconButton
                    name={icons.pencil}
                    accessibilityLabel={t('gradebook.grade.correct')}
                    onPress={() => setEditing({ grade })}
                  />
                  <IconButton
                    name={icons.trash}
                    accessibilityLabel={t('gradebook.grade.remove')}
                    onPress={() => {
                      void remove(grade.id);
                      onChanged?.();
                    }}
                  />
                </View>
              ) : null}
            </Animated.View>
          ))
        )}

        <Button
          label={t('gradebook.grade.add')}
          variant="secondary"
          fullWidth
          disabled={subject === null}
          onPress={() => setEditing({ grade: null })}
        />

        {hasError && editing === null ? (
          <Text variant="bodySm" color="danger">
            {t('gradebook.grade.failed')}
          </Text>
        ) : null}
      </Card>

      <GradeFormSheet
        key={editing?.grade?.id ?? 'new'}
        editing={editing}
        onClose={() => setEditing(null)}
        onSubmit={submit}
        hasError={hasError}
      />
    </>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  body: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
}));
