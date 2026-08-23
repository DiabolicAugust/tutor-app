import { useContext } from 'react';

import { TutorialContext, type TutorialValue } from './tutorial-context';

export function useTutorial(): TutorialValue {
  const value = useContext(TutorialContext);
  if (!value) {
    throw new Error('useTutorial must be used inside a TutorialProvider.');
  }
  return value;
}
