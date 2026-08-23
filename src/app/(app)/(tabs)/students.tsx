import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAddons } from '@/shared/addons';
import { useCurrentUser } from '@/shared/auth';
import { useT } from '@/shared/i18n';
import { StudentFormSheet, byName, useStudents, type Student } from '@/shared/students';
import { createStyles } from '@/shared/theme';
import { Card, Fab, ListRow, Text, icons, motion } from '@/shared/ui';

/**
 * The roster.
 *
 * Reading is open to every member — a tutor sees the students they teach, an
 * admin the whole school, and the server does that scoping, so this screen has
 * no branch for it. Adding and removing need `MANAGE_STUDENTS`.
 *
 * Every row opens, including students somebody else teaches: their page is
 * readable, and only the actions on it are gated. A row that does nothing when
 * tapped is a worse answer than a page that explains what you may not do.
 */
export default function StudentsTab() {
  const { t } = useT();
  const styles = useStyles();
  const user = useCurrentUser();
  const { has } = useAddons();
  const { students, isLoading } = useStudents();

  const [editing, setEditing] = useState<{ student: Student | null } | null>(null);

  const canManage = has('MANAGE_STUDENTS');
  const sorted = [...students].sort(byName);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="titleLg">{t('tabs.students')}</Text>
          <Text variant="bodySm" color="textSecondary">
            {user.role === 'admin' ? t('studentsAdmin.allHint') : t('studentsAdmin.ownHint')}
          </Text>
        </View>

        {sorted.length === 0 && !isLoading ? (
          <Card style={styles.empty}>
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
              sorted.map((student) => (
                <Animated.View key={student.id} layout={motion.listReflow()}>
                  <ListRow
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
          name={icons.add}
          accessibilityLabel={t('studentsAdmin.add')}
          onPress={() => setEditing({ student: null })}
        />
      ) : null}

      <StudentFormSheet
        key={editing?.student?.id ?? 'new'}
        editing={editing}
        onClose={() => setEditing(null)}
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: {
    gap: t.spacing.lg,
    padding: t.spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
  header: { gap: t.spacing.xs },
  empty: { alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.xl },
  centered: { textAlign: 'center' },
}));
