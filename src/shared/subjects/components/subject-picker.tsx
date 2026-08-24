import { useState } from 'react';
import { View } from 'react-native';

import { useCurrentUser } from '@/shared/auth';
import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, ChipGroup, Text, TextField, type ChipOption } from '@/shared/ui';

import { useSubjects } from '../subjects-store';

import type { Subject } from '../subject';

/** The chip that means "no subject". Empty, so it can never be a real id. */
const NONE = '';

export type SubjectPickerProps = {
  /** The chosen subject's id, or null for none. */
  value: string | null;
  onChange: (subjectId: string | null) => void;
  /**
   * The subject the record being edited already has.
   *
   * Offered even when the school has retired it. Without this, editing a student
   * who studies a subject nobody teaches any more would show no selection and
   * silently move them the moment anything else was saved.
   */
  current?: Subject | null;
  /**
   * Whether leaving it unset is allowed.
   *
   * True for a student, who can be on the books before anybody has decided what
   * they are studying, and for a lesson. False for a group, which is defined by
   * what it studies.
   */
  allowNone?: boolean;
  label?: string;
  testID?: string;
};

const useStyles = createStyles((t) => ({
  field: { gap: t.spacing.xs },
  adding: { gap: t.spacing.xs, marginTop: t.spacing.xs },
}));

/**
 * Choosing what is being taught, from the school's list.
 *
 * Chips rather than a native picker, for the reason `ChipGroup` exists: they
 * behave identically on every platform and keep every option one tap away.
 *
 * An admin can add a subject without leaving the form. That is not a
 * convenience — a school that has just been created has an empty list, so
 * without it the first student could not be given a subject at all until
 * somebody found the management screen.
 */
export function SubjectPicker({
  value,
  onChange,
  current = null,
  allowNone = true,
  label,
  testID = 'subject-picker',
}: SubjectPickerProps) {
  const { t } = useT();
  const styles = useStyles();
  const user = useCurrentUser();
  const { offered, addSubject } = useSubjects();

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<'subjects.exists' | 'errors.saveSubject' | null>(null);

  const canAdd = user.role === 'admin';

  // The record's own subject belongs in the list even when it is retired; every
  // other retired one stays out.
  const choices: Subject[] =
    current && !offered.some((subject) => subject.id === current.id)
      ? [...offered, current]
      : [...offered];

  const options: ChipOption<string>[] = [
    ...(allowNone ? [{ value: NONE, label: t('subjects.none') }] : []),
    ...choices.map((subject) => ({
      value: subject.id,
      label: subject.name,
      // Says why a name is here that no other form offers.
      caption: subject.hiddenAt ? t('subjects.retired') : undefined,
    })),
  ];

  const handleAdd = async () => {
    const name = draft.trim();
    if (!name) return;

    setIsBusy(true);
    setErrorKey(null);
    try {
      const created = await addSubject(name);
      onChange(created.id);
      setDraft('');
      setIsAdding(false);
    } catch {
      // Both endings are the same to this form: it cannot offer to restore a
      // hidden subject the way the management screen can, because the picker is
      // not where a school decides what it teaches.
      setErrorKey('subjects.exists');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View style={styles.field}>
      {label ? (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      ) : null}

      {choices.length === 0 && !isAdding ? (
        <Text variant="bodySm" color="textMuted" testID={`${testID}-empty`}>
          {canAdd ? t('subjects.empty') : t('subjects.emptyForTutor')}
        </Text>
      ) : (
        <ChipGroup
          testID={testID}
          options={options}
          value={value ?? NONE}
          onChange={(next) => onChange(next === NONE ? null : next)}
          accessibilityLabel={label}
        />
      )}

      {canAdd ? (
        isAdding ? (
          <View style={styles.adding}>
            <TextField
              testID={`${testID}-name`}
              label={t('subjects.name')}
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                setErrorKey(null);
              }}
              placeholder={t('subjects.namePlaceholder')}
              autoFocus
              onSubmitEditing={() => void handleAdd()}
              error={errorKey ? t(errorKey) : undefined}
            />
            <Button
              testID={`${testID}-save`}
              label={t('common.save')}
              disabled={isBusy || draft.trim().length === 0}
              onPress={() => void handleAdd()}
            />
          </View>
        ) : (
          <Button
            testID={`${testID}-add`}
            label={t('subjects.add')}
            variant="ghost"
            onPress={() => setIsAdding(true)}
          />
        )
      ) : null}
    </View>
  );
}
