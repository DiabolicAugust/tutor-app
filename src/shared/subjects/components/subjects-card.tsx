import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, ListRow, ModalSheet, Text, TextField, motion } from '@/shared/ui';

import { conflictFrom, inUseFrom } from '../subjects-client';
import { useSubjects } from '../subjects-store';

import type { Subject, SubjectUsage } from '../subject';

/** Which transient surface is open. Only one at a time. */
type Sheet = 'none' | 'add' | 'edit' | 'inUse';

const useStyles = createStyles((t) => ({
  hint: { marginBottom: t.spacing.xs },
  actions: { gap: t.spacing.sm, marginTop: t.spacing.sm },
  usageGroup: { gap: t.spacing.xs, marginTop: t.spacing.md },
  names: { gap: 2 },
}));

/**
 * The school's subject list, and the one place it is changed.
 *
 * Admin-only, and mounted by the school screen rather than exported as a route:
 * deciding what a school teaches belongs with deciding who works there.
 *
 * Retiring a subject is the whole reason this screen is not a list with a delete
 * button. A subject is never deleted, because a lesson taught in it still has to
 * say what it was about; it is taken off the list, and only once nothing current
 * studies it. When something does, the server answers with exactly what — and
 * that list is shown here, by name, so the admin knows who to move.
 */
export function SubjectsCard() {
  const { t } = useT();
  const styles = useStyles();
  const {
    all,
    offered,
    isLoading,
    addSubject,
    renameSubject,
    hideSubject,
    restoreSubject,
  } = useSubjects();

  const [sheet, setSheet] = useState<Sheet>('none');
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showRetired, setShowRetired] = useState(false);
  const [usage, setUsage] = useState<SubjectUsage | null>(null);
  /**
   * The retired subject whose name was just typed into the add form.
   *
   * Kept so the sheet can offer to bring it back. Telling an admin that a name
   * is taken, when the row holding it is one they cannot see, is the least
   * useful true thing the app could say.
   */
  const [collision, setCollision] = useState<Subject | null>(null);
  const [errorKey, setErrorKey] = useState<
    'subjects.exists' | 'subjects.existsRetired' | 'errors.saveSubject' | null
  >(null);

  const retired = all.filter((subject) => subject.hiddenAt !== null);

  const close = () => {
    setSheet('none');
    setEditing(null);
    setName('');
    setUsage(null);
    setCollision(null);
    setErrorKey(null);
  };

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsBusy(true);
    setErrorKey(null);
    setCollision(null);
    try {
      await addSubject(trimmed);
      close();
    } catch (error) {
      const conflict = conflictFrom(error);
      if (conflict?.code === 'SUBJECT_HIDDEN') {
        setCollision(conflict.subject);
        setErrorKey('subjects.existsRetired');
      } else if (conflict) {
        setErrorKey('subjects.exists');
      } else {
        setErrorKey('errors.saveSubject');
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleRename = async () => {
    const trimmed = name.trim();
    if (!editing || !trimmed || trimmed === editing.name) {
      close();
      return;
    }

    setIsBusy(true);
    setErrorKey(null);
    try {
      await renameSubject(editing.id, trimmed);
      close();
    } catch (error) {
      const conflict = conflictFrom(error);
      setErrorKey(
        conflict?.code === 'SUBJECT_HIDDEN'
          ? 'subjects.existsRetired'
          : conflict
            ? 'subjects.exists'
            : 'errors.saveSubject',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleRetire = async () => {
    if (!editing) return;

    setIsBusy(true);
    setErrorKey(null);
    try {
      await hideSubject(editing.id);
      close();
    } catch (error) {
      const blocked = inUseFrom(error);
      if (blocked) {
        // Not an error message: it is a list of work to do, so it gets a screen
        // rather than a line of red text.
        setUsage(blocked);
        setSheet('inUse');
      } else {
        setErrorKey('errors.saveSubject');
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleRestore = async (id: string) => {
    setIsBusy(true);
    try {
      await restoreSubject(id);
      close();
    } catch {
      setErrorKey('errors.saveSubject');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <Card title={t('subjects.title')}>
        <Text variant="caption" color="textMuted" style={styles.hint}>
          {t('subjects.hint')}
        </Text>

        {isLoading ? (
          <Text color="textSecondary">{t('common.loading')}</Text>
        ) : offered.length === 0 ? (
          <Text testID="subjects-empty" variant="bodySm" color="textMuted">
            {t('subjects.empty')}
          </Text>
        ) : (
          offered.map((subject, index) => (
            <Animated.View
              key={subject.id}
              entering={motion.listEnter()}
              layout={motion.listReflow()}
            >
              <ListRow
                testID={`subject-${index}`}
                label={subject.name}
                onPress={() => {
                  setEditing(subject);
                  setName(subject.name);
                  setSheet('edit');
                }}
              />
            </Animated.View>
          ))
        )}

        {retired.length > 0 ? (
          <View style={styles.actions}>
            <Button
              testID="subjects-toggle-retired"
              label={
                showRetired
                  ? t('subjects.hideRetired')
                  : `${t('subjects.showRetired')} · ${t('subjects.retiredCount', {
                      count: retired.length,
                    })}`
              }
              variant="ghost"
              onPress={() => setShowRetired((current) => !current)}
            />

            {showRetired
              ? retired.map((subject, index) => (
                  <ListRow
                    key={subject.id}
                    testID={`subject-retired-${index}`}
                    label={subject.name}
                    description={t('subjects.retired')}
                    value={t('subjects.restore')}
                    onPress={() => void handleRestore(subject.id)}
                  />
                ))
              : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            testID="subjects-add"
            label={t('subjects.add')}
            variant="secondary"
            fullWidth
            onPress={() => {
              setName('');
              setSheet('add');
            }}
          />
        </View>
      </Card>

      <ModalSheet
        visible={sheet === 'add'}
        onClose={close}
        title={t('subjects.add')}
        testID="subject-add-sheet"
        footer={
          collision ? (
            <Button
              testID="subject-bring-back"
              label={t('subjects.bringBack')}
              disabled={isBusy}
              onPress={() => void handleRestore(collision.id)}
            />
          ) : (
            <Button
              testID="subject-add-save"
              label={t('common.save')}
              disabled={isBusy || name.trim().length === 0}
              onPress={() => void handleAdd()}
            />
          )
        }
      >
        <TextField
          testID="subject-add-name"
          label={t('subjects.name')}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrorKey(null);
            setCollision(null);
          }}
          placeholder={t('subjects.namePlaceholder')}
          autoFocus
          error={errorKey ? t(errorKey) : undefined}
        />
      </ModalSheet>

      <ModalSheet
        visible={sheet === 'edit'}
        onClose={close}
        title={editing?.name ?? ''}
        testID="subject-edit-sheet"
        footer={
          <Button
            testID="subject-rename-save"
            label={t('common.save')}
            disabled={isBusy || name.trim().length === 0}
            onPress={() => void handleRename()}
          />
        }
      >
        <TextField
          testID="subject-rename-name"
          label={t('subjects.name')}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrorKey(null);
          }}
          error={errorKey ? t(errorKey) : undefined}
        />

        <View style={styles.actions}>
          <Text variant="caption" color="textMuted">
            {t('subjects.retireHint')}
          </Text>
          <Button
            testID="subject-retire"
            label={t('subjects.retire')}
            variant="danger"
            disabled={isBusy}
            onPress={() => void handleRetire()}
          />
        </View>
      </ModalSheet>

      <ModalSheet
        visible={sheet === 'inUse'}
        onClose={close}
        title={t('subjects.inUseTitle')}
        testID="subject-in-use-sheet"
        footer={
          <Button testID="subject-in-use-close" label={t('common.close')} onPress={close} />
        }
      >
        <Text variant="bodySm" color="textSecondary">
          {t('subjects.inUseHint')}
        </Text>

        {usage && usage.students.length > 0 ? (
          <View style={styles.usageGroup}>
            <Text variant="label" color="textSecondary">
              {t('subjects.inUseStudents')}
            </Text>
            <View style={styles.names}>
              {usage.students.map((student) => (
                <Text key={student.id} variant="bodySm">
                  {student.name}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {usage && usage.groups.length > 0 ? (
          <View style={styles.usageGroup}>
            <Text variant="label" color="textSecondary">
              {t('subjects.inUseGroups')}
            </Text>
            <View style={styles.names}>
              {usage.groups.map((group) => (
                <Text key={group.id} variant="bodySm">
                  {group.name}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {usage && usage.upcomingLessons > 0 ? (
          <View style={styles.usageGroup}>
            <Text variant="bodySm" color="textSecondary">
              {t('subjects.inUseLessons', { count: usage.upcomingLessons })}
            </Text>
          </View>
        ) : null}

        {/* What retiring would preserve, said out loud: the fear this screen has
            to answer is that old lessons will be damaged, and they will not. */}
        {usage && usage.pastLessons > 0 ? (
          <View style={styles.usageGroup}>
            <Text variant="caption" color="textMuted">
              {t('subjects.keepsLessons', { count: usage.pastLessons })}
            </Text>
          </View>
        ) : null}
      </ModalSheet>
    </>
  );
}
