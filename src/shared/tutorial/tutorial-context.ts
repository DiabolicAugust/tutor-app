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
  /**
   * Where the current step's anchor is, **relative to the overlay**.
   *
   * Anchors measure themselves in window coordinates, because that is the only
   * frame they can know about from inside a scroll view. The overlay is not the
   * window, though — it is a child of the signed-in layout, which on Android sits
   * below the status bar unless the app is drawing edge to edge. Reporting the
   * overlay's own origin lets the difference be subtracted rather than assumed to
   * be zero, which is what made every highlight land low by a status bar.
   */
  anchorRect: AnchorRect | null;
  /** Called by the overlay once it knows where it is in the window. */
  setOverlayOrigin: (origin: { x: number; y: number }) => void;
};

export const TutorialContext = createContext<TutorialValue | null>(null);
