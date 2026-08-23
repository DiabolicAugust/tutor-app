import type { ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles } from '@/shared/theme';

import { Text } from './text';

export type ScreenHeaderProps = {
  /** The screen's name. Omitted when `children` supply their own title row. */
  title?: string;
  /** One line under it — what this screen is showing, or how much of it. */
  subtitle?: string;
  /** Pinned to the right of the title: a single button, usually. */
  action?: ReactNode;
  /**
   * True when the header sits **outside** a scroll view.
   *
   * That placement is the one thing a header cannot work out for itself, and it
   * decides the gap below: a header inside a scroll container gets that gap from
   * the container's `gap`, while a pinned one has nothing beneath it to space
   * against and has to supply it. Without this the two placements drift apart by
   * exactly one `gap` — which is the bug this component exists to end.
   */
  pinned?: boolean;
  /** Extra rows below the title — the calendar's date navigation. */
  children?: ReactNode;
};

/**
 * A screen's title block.
 *
 * Its own component because four screens had four different answers for the same
 * three values: the calendar padded 12 horizontally, students and news 16, and
 * the two pinned headers had no top padding at all while the two inside a scroll
 * view inherited 16 from their container. On a wide screen the pinned ones were
 * also unconstrained, so a title sat against the window edge while the cards
 * below it were centred.
 *
 * Composition is deliberately left to the caller — `children` rather than a
 * growing set of props — because the calendar's header is two rows of controls
 * and no prop shape would have survived it. This owns spacing and width, which is
 * what was actually drifting.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
  pinned = false,
  children,
}: ScreenHeaderProps) {
  const styles = useStyles();

  return (
    <View style={[styles.header, pinned && styles.pinned]}>
      {title ? (
        <View style={styles.titleRow}>
          <Text variant="titleLg" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {action}
        </View>
      ) : null}

      {subtitle ? (
        <Text variant="bodySm" color="textSecondary">
          {subtitle}
        </Text>
      ) : null}

      {children}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  header: {
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.lg,
    // Aligned with the content below it, which is centred and capped on a wide
    // screen. A full-width header over centred cards is the misalignment this
    // fixes on web and tablets.
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
  pinned: { paddingBottom: t.spacing.lg },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  // Takes the room the action does not, so a long title truncates instead of
  // pushing the button off the edge.
  title: { flex: 1 },
}));
