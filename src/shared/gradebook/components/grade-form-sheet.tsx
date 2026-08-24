import { useState } from 'react';
import { View } from 'react-native';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, ModalSheet, SegmentedControl, Text, TextField } from '@/shared/ui';

import {
  MAX_PERCENTAGE,
  gradeKindKeys,
  gradeKindOrder,
  type Grade,
  type GradeInput,
  type GradeKind,
} from '../grade';

export type GradeFormSheetProps = {
  /**
   * `null` closes the sheet. A wrapper with a `null` grade is a new mark; one
   * with a grade is a correction.
   *
   * The wrapper object is what distinguishes "closed" from "adding", which are
   * otherwise both the absence of a grade.
   */
  editing: { grade: Grade | null } | null;
  onClose: () => void;
  onSubmit: (input: GradeInput) => Promise<void>;
  /** Set when the last attempt was refused, so the sheet can stay open and say so. */
  hasError: boolean;
};

const emptyDraft = {
  kind: 'classic' as GradeKind,
  value: '',
  category: '',
  comment: '',
  weight: '1',
};

/**
 * What the sheet is pointed at, as something that changes when it closes.
 *
 * Not the mark's id: for a new mark that is `null` every time, so the state below
 * compared equal to itself and was never reseeded — giving a second mark opened
 * the form still holding the first one's value and category.
 */
const keyFor = (editing: { grade: Grade | null } | null): string | null =>
  editing ? (editing.grade?.id ?? 'new') : null;

/** An existing mark as form fields, or a blank form for a new one. */
const draftFor = (grade: Grade | null): typeof emptyDraft =>
  grade
    ? {
        kind: grade.kind,
        value: grade.value === null ? '' : String(grade.value),
        category: grade.category ?? '',
        comment: grade.comment ?? '',
        weight: String(grade.weight),
      }
    : emptyDraft;

/**
 * Writing or correcting a mark.
 *
 * The kind comes first because it decides what the rest of the form means: a
 * descriptive mark has no number to type, and showing a disabled number field
 * next to it would be the form arguing with a choice just made.
 */
export function GradeFormSheet({
  editing,
  onClose,
  onSubmit,
  hasError,
}: GradeFormSheetProps) {
  const { t } = useT();
  const styles = useStyles();

  const grade = editing?.grade ?? null;

  const [state, setState] = useState(() => ({ key: keyFor(editing), draft: draftFor(grade) }));
  const [isSaving, setIsSaving] = useState(false);

  // Reseeded when the sheet is pointed at a different mark — or at a new one.
  // Adjusted during render rather than in an effect, so a correction never opens
  // showing the previous mark for a frame.
  const key = keyFor(editing);
  const current = state.key === key ? state : { key, draft: draftFor(grade) };
  if (state.key !== key) setState(current);

  const draft = current.draft;

  const set = <K extends keyof typeof emptyDraft>(
    key_: K,
    value: (typeof emptyDraft)[K],
  ) => setState((previous) => ({ ...previous, draft: { ...previous.draft, [key_]: value } }));

  const descriptive = draft.kind === 'descriptive';
  // Commas are what a Ukrainian or Polish keyboard offers for a decimal point,
  // and rejecting one would be the app blaming somebody for their own locale.
  const parsedValue = Number(draft.value.replace(',', '.'));
  const hasValue = draft.value.trim().length > 0 && Number.isFinite(parsedValue);

  const valueError =
    hasValue && parsedValue < 0
      ? t('gradebook.grade.negative')
      : hasValue && draft.kind === 'percentage' && parsedValue > MAX_PERCENTAGE
        ? t('gradebook.grade.overHundred')
        : undefined;

  const canSubmit = descriptive
    ? draft.comment.trim().length > 0
    : hasValue && valueError === undefined;

  const submit = async () => {
    if (!canSubmit) return;

    setIsSaving(true);
    try {
      await onSubmit({
        kind: draft.kind,
        ...(descriptive ? {} : { value: parsedValue }),
        category: draft.category,
        comment: draft.comment,
        weight: Number(draft.weight) || 1,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalSheet
      visible={editing !== null}
      onClose={onClose}
      title={t(grade ? 'gradebook.grade.correct' : 'gradebook.grade.add')}
      testID="grade-sheet"
      footer={
        <Button
          testID="grade-save"
          label={t('common.save')}
          onPress={() => void submit()}
          loading={isSaving}
          disabled={!canSubmit}
          fullWidth
        />
      }
    >
      <View style={styles.form}>
        <SegmentedControl
          testID="grade-kind"
          options={gradeKindOrder.map((kind) => ({
            value: kind,
            label: t(gradeKindKeys[kind]),
          }))}
          value={draft.kind}
          onChange={(kind) => set('kind', kind)}
          accessibilityLabel={t('gradebook.grade.kind')}
        />

        {descriptive ? null : (
          <TextField
            testID="grade-value"
            label={t(
              draft.kind === 'percentage'
                ? 'gradebook.grade.valuePercent'
                : 'gradebook.grade.value',
            )}
            value={draft.value}
            onChangeText={(value) => set('value', value)}
            keyboardType="decimal-pad"
            error={valueError}
          />
        )}

        <TextField
          testID="grade-category"
          label={t('gradebook.grade.category')}
          value={draft.category}
          onChangeText={(value) => set('category', value)}
          placeholder={t('gradebook.grade.categoryHint')}
        />

        <TextField
          testID="grade-comment"
          label={t(descriptive ? 'gradebook.grade.words' : 'gradebook.grade.remark')}
          value={draft.comment}
          onChangeText={(value) => set('comment', value)}
          placeholder={t('gradebook.grade.commentHint')}
          multiline
        />

        {descriptive ? null : (
          <TextField
            label={t('gradebook.grade.weight')}
            value={draft.weight}
            onChangeText={(value) => set('weight', value)}
            keyboardType="number-pad"
          />
        )}

        <Text variant="caption" color="textMuted">
          {t(descriptive ? 'gradebook.grade.descriptiveHint' : 'gradebook.grade.weightHint')}
        </Text>

        {hasError ? (
          <Text variant="bodySm" color="danger">
            {t('gradebook.grade.rejected')}
          </Text>
        ) : null}
      </View>
    </ModalSheet>
  );
}

const useStyles = createStyles((t) => ({
  form: { gap: t.spacing.md },
}));
