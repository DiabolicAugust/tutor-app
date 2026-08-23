import { createContext } from 'react';

import type { AnchorRect, TutorialAnchor, TutorialStep } from './tutorial';

export type TutorialValue = {
  /** The step being shown, or `null` when the tour is not running. */
  step: TutorialStep | null;
  /** 1-based, for "3 of 5". */
  position: number;
  total: number;
  isLast: boolean;

  /** Runs the tour from the beginning. Ignored if it is already running. */
  start: () => void;
  next: () => void;
  back: () => void;
  /** Ends the tour and remembers not to offer it again. */
  finish: () => void;

  /**
   * Reports where an anchor is. Called by the screens that own the anchors, so
   * the overlay can highlight something it does not render itself.
   */
  measureAnchor: (anchor: TutorialAnchor, rect: AnchorRect | null) => void;
  /** Where the current step's anchor is, once it has reported in. */
  anchorRect: AnchorRect | null;
};

export const TutorialContext = createContext<TutorialValue | null>(null);
