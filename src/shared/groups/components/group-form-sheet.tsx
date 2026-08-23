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
    key: group?.id ?? null,
    draft: draftFor(group),
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  // Reseeded during render rather than in an effect, so editing a second group
  // never shows the first one's name for a frame.
  const key = group?.id ?? null;
  const current = state.key === key ? state : { key, draft: draftFor(group) };
  if (state.key !== key) setState(current);

  const { draft } = current;
  const set = (field: keyof typeof emptyDraft, value: string) =>
    setState((previous) => ({
      ...previous,
      draft: { ...previous.draft, [field]: value },
    }));

  const members = group ? membersOf(group) : [];
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
        await onCreate(input);
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
      footer={
        <Button
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
          label={t('groups.name')}
          value={draft.name}
          onChangeText={(value) => set('name', value)}
          placeholder={t('groups.nameHint')}
        />
        <TextField
          label={t('groups.subject')}
          value={draft.subject}
          onChangeText={(value) => set('subject', value)}
        />
        <TextField
          label={t('groups.level')}
          value={draft.level}
          onChangeText={(value) => set('level', value)}
          placeholder={t('groups.levelHint')}
        />

        {hasError ? (
          <Text variant="bodySm" color="danger">
            {t('groups.failed')}
          </Text>
        ) : null}
      </View>

      {/* Nothing to put anybody into until the group exists. */}
      {group ? (
        <View style={styles.section}>
          <Text variant="label">{t('groups.members')}</Text>

          {members.length === 0 ? (
            <Text variant="bodySm" color="textMuted">
              {t('groups.membersEmpty')}
            </Text>
          ) : (
            members.map((student) => (
              <Animated.View
                key={student.id}
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
                  name={icons.close}
                  accessibilityLabel={t('groups.removeMember')}
                  onPress={() => void onRemoveMember(group.id, student.id)}
                />
              </Animated.View>
            ))
          )}

          {isPicking ? (
            addable.length === 0 ? (
              <Text variant="bodySm" color="textMuted">
                {t('groups.nobodyLeft')}
              </Text>
            ) : (
              addable.map((student) => (
                <ListRow
                  key={student.id}
                  label={student.name}
                  description={student.subject}
                  onPress={() => {
                    void onAddMember(group.id, student.id);
                    setIsPicking(false);
                  }}
                />
              ))
            )
          ) : (
            <Button
              label={t('groups.addMember')}
              variant="secondary"
              fullWidth
              onPress={() => setIsPicking(true)}
            />
          )}

          <Button
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
        </View>
      ) : null}
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
