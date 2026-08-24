import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAddons } from '@/shared/addons';
import { useCurrentUser } from '@/shared/auth';
import { GroupFormSheet, describeGroup, useGroups, type Group } from '@/shared/groups';
import { useT } from '@/shared/i18n';
import { useRefresh } from '@/shared/lib/use-refresh';
import { StudentFormSheet, byName, useStudents, type Student } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import {
  Card,
  Fab,
  ListRow,
  ScreenHeader,
  SegmentedControl,
  Text,
  icons,
  motion,
} from '@/shared/ui';

/** Which half of the roster is showing. */
type RosterView = 'students' | 'groups';

/**
 * The roster: the people, and the groups they are taught in.
 *
 * One screen with two views rather than two tabs, because they are one idea —
 * a group is students, organised. Splitting them across the bottom bar would put
 * "add a student" and "put that student in a group" two taps apart.
 *
 * Reading is open to every member — a tutor sees what they teach, an admin the
 * whole school, and the server does that scoping, so this screen has no branch
 * for it. Adding and removing need `MANAGE_STUDENTS`.
 *
 * Every student row opens, including students somebody else teaches: their page
 * is readable, and only the actions on it are gated. A row that does nothing when
 * tapped is a worse answer than a page that explains what you may not do.
 */
export default function StudentsTab() {
  const { t } = useT();
  const styles = useStyles();
  const user = useCurrentUser();
  const { has } = useAddons();
  const { students, isLoading, reload } = useStudents();
  const {
    groups,
    isLoading: isLoadingGroups,
    hasError: groupsFailed,
    create,
    update,
    remove,
    addMember,
    removeMember,
    reload: reloadGroups,
  } = useGroups();

  // Both halves of this screen come from the server, so a pull refreshes both.
  const { isRefreshing, refresh, controlKey } = useRefresh([reload, reloadGroups]);

  const [view, setView] = useState<RosterView>('students');
  const [editing, setEditing] = useState<{ student: Student | null } | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ group: Group | null } | null>(null);

  const canManage = has('MANAGE_STUDENTS');
  const sorted = [...students].sort(byName);
  const showingGroups = view === 'groups';

  // Kept in step with the list, so a member added inside the sheet is visible
  // there immediately rather than after it closes and reopens.
  const openGroup = editingGroup?.group
    ? (groups.find((group) => group.id === editingGroup.group?.id) ?? editingGroup.group)
    : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            key={controlKey}
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
          />
        }
      >
        <ScreenHeader
          testID="screen-students"
          title={t('tabs.students')}
          subtitle={
            user.role === 'admin' ? t('studentsAdmin.allHint') : t('studentsAdmin.ownHint')
          }
        />

        <SegmentedControl
          testID="roster-view"
          options={[
            { value: 'students', label: t('groups.students') },
            { value: 'groups', label: t('groups.tab') },
          ]}
          value={view}
          onChange={setView}
          accessibilityLabel={t('tabs.students')}
        />

        {showingGroups ? (
          groups.length === 0 && !isLoadingGroups ? (
            <Card style={styles.empty} testID="groups-empty">
              <Text variant="titleSm">{t('groups.empty')}</Text>
              <Text variant="bodySm" color="textSecondary" style={styles.centered}>
                {t('groups.emptyHint')}
              </Text>
            </Card>
          ) : (
            <Card>
              {isLoadingGroups ? (
                <Text color="textSecondary">{t('common.loading')}</Text>
              ) : (
                groups.map((group, index) => (
                  <Animated.View key={group.id} layout={motion.listReflow()}>
                    <ListRow
                      testID={`group-row-${index}`}
                      label={group.name}
                      description={describeGroup(group)}
                      value={t('groups.count', { count: group.members.length })}
                      // Opens the same sheet that creates one, because editing a
                      // group and filling it are the same screen.
                      onPress={() => setEditingGroup({ group })}
                    />
                  </Animated.View>
                ))
              )}

              {groupsFailed ? (
                <Text variant="bodySm" color="danger">
                  {t('groups.failed')}
                </Text>
              ) : null}
            </Card>
          )
        ) : sorted.length === 0 && !isLoading ? (
          <Card style={styles.empty} testID="students-empty">
            <Text variant="titleSm">{t('studentsAdmin.empty')}</Text>
            <Text variant="bodySm" color="textSecondary" style={styles.centered}>
              {t('studentsAdmin.emptyHint')}
            </Text>
          </Card>
        ) : (
          <Card>
            {isLoading ? (
              <Text color="textSecondary">{t('common.loading')}</Text>
            ) : (
              sorted.map((student, index) => (
                <Animated.View key={student.id} layout={motion.listReflow()}>
                  <ListRow
                    testID={`student-row-${index}`}
                    label={student.name}
                    description={student.subject}
                    value={t('event.lessonsLeft', { count: student.paidLessonsLeft })}
                    // The object form rather than an interpolated path: typed
                    // routes only accept the literal, and this is also what
                    // escapes the id correctly.
                    onPress={() =>
                      router.push({ pathname: '/student/[id]', params: { id: student.id } })
                    }
                  />
                </Animated.View>
              ))
            )}
          </Card>
        )}
      </ScrollView>

      {canManage ? (
        <Fab
          testID="students-add"
          name={icons.add}
          accessibilityLabel={t(showingGroups ? 'groups.create' : 'studentsAdmin.add')}
          onPress={() =>
            showingGroups ? setEditingGroup({ group: null }) : setEditing({ student: null })
          }
        />
      ) : null}

      <StudentFormSheet
        key={editing?.student?.id ?? 'new'}
        editing={editing}
        onClose={() => setEditing(null)}
      />

      <GroupFormSheet
        key={editingGroup?.group?.id ?? 'new-group'}
        editing={editingGroup ? { group: openGroup } : null}
        onClose={() => setEditingGroup(null)}
        onCreate={create}
        onUpdate={update}
        onRemove={remove}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        hasError={groupsFailed}
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: {
    gap: t.spacing.lg,
    // No top padding: `ScreenHeader` supplies it, so the first screen with a
    // header and the first without one start at the same place.
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.xl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
  empty: { alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.xl },
  centered: { textAlign: 'center' },
}));
