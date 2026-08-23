import { View } from 'react-native';

import { createStyles } from '@/shared/theme';

import type { AnchorRect } from '../tutorial';

export type SpotlightProps = {
  /** The area to leave uncovered, or `null` to dim everything evenly. */
  rect: AnchorRect | null;
  /** Breathing room around the anchor, so the ring does not clip it. */
  padding?: number;
};

/**
 * Dims the screen except for one rectangle.
 *
 * Four rectangles around the hole rather than a masked shape: masking needs
 * either SVG or `mix-blend-mode`, one of which is a dependency and the other of
 * which behaves differently on web and native. Four plain views composite
 * identically everywhere and cost nothing.
 */
export function Spotlight({ rect, padding = 8 }: SpotlightProps) {
  const styles = useStyles();

  if (!rect) return <View style={[styles.fill, styles.scrim]} pointerEvents="none" />;

  const top = Math.max(0, rect.y - padding);
  const left = Math.max(0, rect.x - padding);
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  return (
    <View style={styles.fill} pointerEvents="none">
      <View style={[styles.scrim, styles.band, { top: 0, height: top }]} />
      <View style={[styles.scrim, styles.band, { top: top + height, bottom: 0 }]} />
      <View style={[styles.scrim, { position: 'absolute', top, height, left: 0, width: left }]} />
      <View
        style={[styles.scrim, { position: 'absolute', top, height, left: left + width, right: 0 }]}
      />

      {/* The ring is what says "this thing", rather than leaving the eye to infer
          it from a gap in the dimming. */}
      <View style={[styles.ring, { top, left, width, height }]} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrim: { backgroundColor: 'rgba(0, 0, 0, 0.62)' },
  band: { position: 'absolute', left: 0, right: 0 },
  ring: {
    position: 'absolute',
    borderRadius: t.radius.md,
    borderWidth: 2,
    borderColor: t.colors.brand,
  },
}));
