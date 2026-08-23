import type { AppDictionary, TranslationKey } from '@/shared/i18n';

/** A key of the app's own dictionary, so a step with a typo does not compile. */
type StepTextKey = TranslationKey<AppDictionary>;

/**
 * A place on screen a tutorial step can point at.
 *
 * A closed union rather than free strings: a step whose anchor was renamed
 * should stop compiling, not silently point at nothing on a device nobody
 * checked.
 */
export type TutorialAnchor =
  | 'calendar.title'
  | 'calendar.views'
  | 'calendar.add'
  | 'more.settings';

/** Where the explanation sits relative to the thing it explains. */
export type TutorialPlacement = 'above' | 'below';

export type TutorialStep = {
  id: string;
  /**
   * The route this step teaches. The tour navigates there before showing the
   * step, which is what makes it a walk through the app rather than a slideshow
   * about it.
   */
  route: string;
  titleKey: StepTextKey;
  bodyKey: StepTextKey;
  /**
   * What to highlight, if anything.
   *
   * Optional on purpose. Some steps are about a whole screen, and the tab bar is
   * a native view this code cannot measure — a step that insists on a spotlight
   * would have to fake one, and a highlight ring around the wrong place is worse
   * than no ring at all.
   */
  anchor?: TutorialAnchor;
  placement?: TutorialPlacement;
};

/** A measured anchor, in window coordinates. */
export type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
