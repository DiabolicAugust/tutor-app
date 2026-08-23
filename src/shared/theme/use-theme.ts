import { useContext } from 'react';

import { ThemeContext, ThemeControllerContext, type ThemeController } from './theme-context';
import type { Theme } from './theme';

/**
 * The active theme. Reach for this only for values that cannot be expressed in
 * a stylesheet — an animation color, a prop like `tintColor`, a gradient. For
 * anything static, prefer `createStyles`.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Read/write access to the appearance preference, for settings screens. */
export function useThemeController(): ThemeController {
  const controller = useContext(ThemeControllerContext);
  if (!controller) {
    throw new Error('useThemeController must be used inside <ThemeProvider>.');
  }
  return controller;
}
