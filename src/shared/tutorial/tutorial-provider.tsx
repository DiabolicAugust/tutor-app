import { router, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';

import { TutorialContext, type TutorialValue } from './tutorial-context';
import { tour } from './tour';
import type { AnchorRect, TutorialAnchor } from './tutorial';

const isTrue = (value: unknown): value is true => value === true;

const seenStore = createPersistedValue(StorageKeys.tutorialSeen, isTrue);
const pendingStore = createPersistedValue(StorageKeys.tutorialPending, isTrue);

/**
 * Asks for the tour to run the next time the app opens signed in.
 *
 * Exported as a plain function rather than something on the context because the
 * caller — the registration screen — lives outside the signed-in tree where the
 * provider is mounted.
 */
export function requestTutorial(): void {
  pendingStore.write(true);
}

/**
 * Owns the interface tour.
 *
 * The tour drives navigation rather than following it: each step names the route
 * it teaches, and moving to a step moves the app there. That is the difference
 * between a walkthrough and a slideshow — people end up on the screen being
 * explained, with the real thing in front of them.
 */
export function TutorialProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Decided at mount rather than in an effect: the tour either was asked for
  // before this tree existed or it was not, and starting it a render later would
  // mean one frame of the app with no explanation on top of it.
  const [index, setIndex] = useState<number | null>(() =>
    pendingStore.read() === true && seenStore.read() !== true ? 0 : null,
  );
  const [anchors, setAnchors] = useState<Partial<Record<TutorialAnchor, AnchorRect>>>({});

  const step = index === null ? null : (tour[index] ?? null);

  const start = useCallback(() => {
    setIndex((current) => (current === null ? 0 : current));
  }, []);

  const finish = useCallback(() => {
    seenStore.write(true);
    pendingStore.clear();
    setIndex(null);
  }, []);

  const next = useCallback(() => {
    setIndex((current) => {
      if (current === null) return null;
      const following = current + 1;
      if (following < tour.length) return following;

      // The last "next" is a finish. Doing it here rather than making the button
      // decide keeps the ending in one place.
      seenStore.write(true);
      pendingStore.clear();
      return null;
    });
  }, []);

  const back = useCallback(() => {
    setIndex((current) => (current === null ? null : Math.max(0, current - 1)));
  }, []);

  // The request has been honoured, so it is consumed. In an effect because
  // clearing it during render would mean a re-render that never runs the tour.
  useEffect(() => {
    pendingStore.clear();
  }, []);

  // Takes the app to the screen the current step is about.
  useEffect(() => {
    if (!step) return;
    if (pathname === step.route) return;

    router.navigate(step.route as never);
  }, [step, pathname]);

  const measureAnchor = useCallback((anchor: TutorialAnchor, rect: AnchorRect | null) => {
    setAnchors((current) => {
      const existing = current[anchor];

      // Anchors re-measure on every layout pass. Writing an identical rect back
      // would re-render the overlay for no reason, on every scroll.
      if (rect === null) {
        if (!existing) return current;
        const { [anchor]: _removed, ...rest } = current;
        return rest;
      }

      if (
        existing &&
        existing.x === rect.x &&
        existing.y === rect.y &&
        existing.width === rect.width &&
        existing.height === rect.height
      ) {
        return current;
      }

      return { ...current, [anchor]: rect };
    });
  }, []);

  const value = useMemo<TutorialValue>(
    () => ({
      step,
      position: index === null ? 0 : index + 1,
      total: tour.length,
      isLast: index !== null && index === tour.length - 1,
      start,
      next,
      back,
      finish,
      measureAnchor,
      anchorRect: step?.anchor ? (anchors[step.anchor] ?? null) : null,
    }),
    [step, index, start, next, back, finish, measureAnchor, anchors],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}
