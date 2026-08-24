import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useT } from '@/shared/i18n';
import { byName, useStudents } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import {
  Button,
  IconButton,
  ListRow,
  ModalSheet,
  Text,
  TextField,
  icons,
  motion,
} from '@/shared/ui';

import { membersOf, type Group, type GroupPatch, type NewGroupInput } from '../group';

export type GroupFormSheetProps = {
  /**
   * `null` closes the sheet. A wrapper with a `null` group is a new one; one with
   * a group is an edit.
   */
  editing: { group: Group | null } | null;
  onClose: () => void;
  onCreate: (input: NewGroupInput) => Promise<Group | null>;
  onUpdate: (id: string, patch: GroupPatch) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onAddMember: (groupId: string, studentId: string) => Promise<void>;
  onRemoveMember: (groupId: string, studentId: string) => Promise<void>;
  hasError: boolean;
};

const emptyDraft = { name: '', subject: '', level: '' };

/**
 * What the sheet is currently pointed at, as something that changes when it is
 * closed and reopened.
 *
 * Not the group's id: for a new group that is `null` both times, so the state
 * below compared equal to itself and was never reseeded — the second "new group"
 * opened holding the first one's name, subject and chosen students. Closing is
 * part of the identity, which is what `null` for "no sheet" carries.
 */
const keyFor = (editing: { group: Group | null } | null): string | null =>
  editing ? (editing.group?.id ?? 'new') : null;

/** An existing group as form fields, or a blank form for a new one. */
const draftFor = (group: Group | null): typeof emptyDraft =>
  group
    ? { name: group.name, subject: group.subject, level: group.level ?? '' }
    : emptyDraft;

/**
 * Making a group, and deciding who is in it.
 *
 * Membership only appears once the group exists, because it has to: there is
 * nothing to put a student into until then. That is why creating and filling are
 * two steps rather than one long form — and why the first button says "create"
 * rather than "save", so nobody expects members they have not chosen yet.
 */
export function GroupFormSheet({
  editing,
  onClose,
  onCreate,
  onUpdate,
  onRemove,
  onAddMember,
  onRemoveMember,
  hasError,
}: GroupFormSheetProps) {
  const { t } = useT();
  const styles = useStyles();
  const { students } = useStudents();

  const group = editing?.group ?? null;

  const [state, setState] = useState(() => ({
    key: keyFor(editing),
    draft: draftFor(group),
    /** Students picked for a group that does not exist yet. */
    pending: [] as string[],
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  // Reseeded during render rather than in an effect, so editing a second group
  // never shows the first one's name for a frame.
  const key = keyFor(editing);
  const current =
    state.key === key ? state : { key, draft: draftFor(group), pending: [] };
  if (state.key !== key) setState(current);

  /**
   * Students chosen before the group exists.
   *
   * Membership needs a group id, so for a new group the picks are held with the
   * draft and applied the moment it is created. Without this, filling a group was
   * two visits to the same sheet — create it, reopen it, add people — and the
   * second visit is the one people forget.
   *
   * Reseeded with the draft, so reopening "new group" does not arrive carrying
   * the last one's picks.
   */
  const pending = current.pending;
  const setPending = (next: (previous: string[]) => string[]) =>
    setState((previous) => ({ ...previous, pending: next(previous.pending) }));

  const { draft } = current;
  const set = (field: keyof typeof emptyDraft, value: string) =>
    setState((previous) => ({
      ...previous,
      draft: { ...previous.draft, [field]: value },
    }));

  const members = group
    ? membersOf(group)
    : // Rendered from the roster, so a picked student is visible immediately
      // rather than only after the group is saved.
      students.filter((student) => pending.includes(student.id));
  const memberIds = new Set(members.map((student) => student.id));
  // Only students this tutor can actually add — the server refuses a colleague's.
  const addable = [...students]
    .sort(byName)
    .filter((student) => !memberIds.has(student.id));

  const canSubmit =
    draft.name.trim().length > 0 && draft.subject.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;

    setIsSaving(true);
    try {
      const input = {
        name: draft.name,
        subject: draft.subject,
        level: draft.level,
      };
      if (group) {
        await onUpdate(group.id, input);
      } else {
        const created = await onCreate(input);
        // Applied in the order they were picked, and only once the group has an
        // id to attach them to.
        if (created) {
          for (const studentId of pending) {
            await onAddMember(created.id, studentId);
          }
        }
      }
      if (!hasError) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalSheet
      visible={editing !== null}
      onClose={onClose}
      title={t(group ? 'groups.edit' : 'groups.create')}
      testID="group-sheet"
      footer={
        <Button
          testID="group-save"
          label={t(group ? 'common.save' : 'groups.createAction')}
          onPress={() => void submit()}
          loading={isSaving}
          disabled={!canSubmit}
          fullWidth
        />
      }
    >
      <View style={styles.form}>
        <TextField
          testID="group-name"
          label={t('groups.name')}
          value={draft.name}
          onChangeText={(value) => set('name', value)}
          placeholder={t('groups.nameHint')}
        />
        <TextField
          testID="group-subject"
          label={t('groups.subject')}
          value={draft.subject}
          onChangeText={(value) => set('subject', value)}
        />
        <TextField
          testID="group-level"
          label={t('groups.level')}
          value={draft.level}
          onChangeText={(value) => set('level', value)}
          placeholder={t('groups.levelHint')}
        />

        {hasError ? (
          <Text testID="group-error" variant="bodySm" color="danger">
            {t('groups.failed')}
          </Text>
        ) : null}
      </View>

      {/* Shown for a new group too. The picks are held until it has an id — see
          `pending` — because asking somebody to create a group and then come back
          to fill it is asking them to do it twice. */}
      <View style={styles.section}>
        <Text variant="label">{t('groups.members')}</Text>

          {members.length === 0 ? (
            <Text testID="group-members-empty" variant="bodySm" color="textMuted">
              {t('groups.membersEmpty')}
            </Text>
          ) : (
            members.map((student, index) => (
              <Animated.View
                key={student.id}
                testID={`group-member-${index}`}
                style={styles.member}
                entering={motion.listEnter()}
                exiting={motion.listResolve()}
                layout={motion.listReflow()}
              >
                <View style={styles.memberText}>
                  <Text numberOfLines={1}>{student.name}</Text>
                  <Text variant="caption" color="textMuted">
                    {t('event.lessonsLeft', { count: student.paidLessonsLeft })}
                  </Text>
                </View>
                <IconButton
                  testID={`group-member-remove-${index}`}
                  name={icons.close}
                  accessibilityLabel={t('groups.removeMember')}
                  onPress={() => {
                    if (group) void onRemoveMember(group.id, student.id);
                    else setPending((current) => current.filter((id) => id !== student.id));
                  }}
                />
              </Animated.View>
            ))
          )}

          {isPicking ? (
            addable.length === 0 ? (
              <Text testID="group-nobody-left" variant="bodySm" color="textMuted">
                {t('groups.nobodyLeft')}
              </Text>
            ) : (
              addable.map((student, index) => (
                <ListRow
                  key={student.id}
                  testID={`group-pick-${index}`}
                  label={student.name}
                  description={student.subject}
                  onPress={() => {
                    if (group) void onAddMember(group.id, student.id);
                    else setPending((current) => [...current, student.id]);
                    setIsPicking(false);
                  }}
                />
              ))
            )
          ) : (
            <Button
              testID="group-add-member"
              label={t('groups.addMember')}
              variant="secondary"
              fullWidth
              onPress={() => setIsPicking(true)}
            />
          )}

        {/* Only for a group that exists; there is nothing to dissolve otherwise. */}
        {group ? (
          <>
            <Button
              testID="group-remove"
              label={t('groups.remove')}
              variant="ghost"
              fullWidth
              onPress={() => {
                void onRemove(group.id);
                onClose();
              }}
            />
            <Text variant="caption" color="textMuted">
              {t('groups.removeHint')}
            </Text>
          </>
        ) : null}
      </View>
    </ModalSheet>
  );
}

const useStyles = createStyles((t) => ({
  form: { gap: t.spacing.md },
  section: { gap: t.spacing.sm, paddingTop: t.spacing.lg },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  memberText: { flex: 1, gap: 1 },
}));
