import { Share, View } from 'react-native';

import { useCurrentUser } from '@/shared/auth';
import { describeTimeAgo, useT } from '@/shared/i18n';
import { useNow } from '@/shared/lib/use-now';
import { createStyles } from '@/shared/theme';
import { Button, Card, Text, useToast } from '@/shared/ui';

import { debtorKind, type Debtor } from '../debtor';

/**
 * The list itself, one card per student.
 *
 * Two situations, said in words rather than left as a number to interpret:
 * somebody already taught beyond their package, and somebody sitting at the end
 * of one with another lesson booked. The first is a conversation today, the
 * second is a top-up before the next lesson, and a person acts on them
 * differently.
 *
 * Never a sum of money. The app does not know what a lesson costs — a first
 * lesson, an exam-prep hour and a group place are three different prices for
 * every tutor who has thought about it — so it says how many lessons and lets
 * the person who set the price do the multiplication.
 */
export function DebtorList({ debtors }: { debtors: readonly Debtor[] }) {
  const { t } = useT();
  const styles = useStyles();
  // From a hook rather than `Date.now()` inline: reading the clock during render
  // makes the same props produce a different result every time, and a relative
  // timestamp computed that way freezes at whatever the clock last said.
  const now = useNow();
  const toast = useToast();
  const me = useCurrentUser();

  const remind = async (debtor: Debtor) => {
    const message =
      debtorKind(debtor) === 'owing'
        ? t('debtors.messageOwing', {
            name: debtor.name,
            count: debtor.lessonsOwed,
          })
        : t('debtors.messageRunningOut', { name: debtor.name });

    try {
      // The system sheet, so the message goes out through whatever the tutor and
      // the family already use. Deliberately not an email or an SMS from the
      // server: the app holds no way to reach a student — no address, no number,
      // no account of their own — and inventing one would be a much larger
      // feature than this screen.
      await Share.share({ message, title: debtor.name });
    } catch {
      toast.show(t('debtors.cannotShare'), 'error');
    }
  };

  return (
    <>
      {debtors.map((debtor, index) => (
        <Card key={debtor.studentId}>
          <View style={styles.row} testID={`debtor-${index}`}>
            <View style={styles.who}>
              <Text variant="titleSm">{debtor.name}</Text>
              <Text
                testID={`debtor-${index}-state`}
                variant="bodySm"
                color={debtorKind(debtor) === 'owing' ? 'danger' : 'textSecondary'}
              >
                {debtorKind(debtor) === 'owing'
                  ? t('debtors.owing', { count: debtor.lessonsOwed })
                  : t('debtors.runningOut')}
              </Text>

              {/* Whose student this is, for an admin reading the school's list.
                  Left out on your own students, where it would be your own name
                  on every row. */}
              {debtor.tutorId === me.id ? null : (
                <Text variant="caption" color="textMuted">
                  {debtor.tutorName ?? t('debtors.formerTutor')}
                </Text>
              )}

              <Text variant="caption" color="textMuted">
                {debtor.lessonsBooked > 0
                  ? t('debtors.booked', { count: debtor.lessonsBooked })
                  : t('debtors.nothingBooked')}
              </Text>

              {/* When they were last taught, so a row nobody needs to act on is
                  recognisable as one: a package that ran out in March on a
                  student who stopped coming is not a debt to chase. */}
              <LastTaught at={debtor.lastTaughtAt} now={now} />
            </View>

            <Button
              testID={`debtor-${index}-remind`}
              label={t('debtors.remind')}
              variant="secondary"
              onPress={() => void remind(debtor)}
            />
          </View>
        </Card>
      ))}
    </>
  );
}

/**
 * "Last taught two days ago", in one place.
 *
 * Its own component because the phrase is two dictionary lookups — one for the
 * interval, one for the sentence around it — and `Intl.RelativeTimeFormat` is
 * not an option: Hermes ships a reduced `Intl` without it, which is how the news
 * feed once came to say "-52 hour".
 */
function LastTaught({ at, now }: { at: string | null; now: number }) {
  const { t } = useT();

  if (at === null) {
    return (
      <Text variant="caption" color="textMuted">
        {t('debtors.neverTaught')}
      </Text>
    );
  }

  const ago = describeTimeAgo(at, now);

  return (
    <Text variant="caption" color="textMuted">
      {t('debtors.lastTaught', { when: t(ago.key, { count: ago.count }) })}
    </Text>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: t.spacing.md,
  },
  who: { flexShrink: 1, gap: 2 },
}));
