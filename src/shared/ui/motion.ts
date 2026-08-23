import { FadeIn, FadeOut, LinearTransition, SlideOutRight } from 'react-native-reanimated';

import { durations } from '@/shared/theme';

/**
 * The app's motion vocabulary.
 *
 * Every animation in the app comes from here, for two reasons: durations stay
 * consistent with the theme tokens, and there is one place to audit whether a
 * movement is earning its keep.
 *
 * The rule applied throughout: animate only when something changes state in a
 * way the user needs to follow — an item leaving a list, content replacing other
 * content, a control acknowledging a press. Decoration that repeats on every
 * render becomes noise by the tenth time it is seen, so entrances are short and
 * nothing loops — the one exception being the launch loader, where the loop is
 * the message.
 *
 * Builders are returned from functions rather than shared as constants: a
 * builder instance carries its own config, and reusing one across components
 * couples their animations.
 */
export const motion = {
  /** A new item appearing in a list. Short, no movement — just presence. */
  listEnter: () => FadeIn.duration(durations.fast),

  /**
   * An item leaving because the user resolved it. Slides out to signal handled
   * and gone, rather than merely vanishing.
   */
  listResolve: () => SlideOutRight.duration(durations.normal),

  /** Neighbours closing the gap after a removal. */
  listReflow: () => LinearTransition.duration(durations.normal),

  /** Content swapped in place, e.g. switching calendar view mode. */
  contentSwap: () => FadeIn.duration(durations.normal),

  /** Content swapped out in place. */
  contentSwapOut: () => FadeOut.duration(durations.fast),

  /** A validation message or hint appearing under a field. */
  messageEnter: () => FadeIn.duration(durations.fast),

  /** ...and leaving once the input is corrected. */
  messageExit: () => FadeOut.duration(durations.instant),

  /** Scale applied while a large control is held. */
  pressScale: 0.94,
} as const;
