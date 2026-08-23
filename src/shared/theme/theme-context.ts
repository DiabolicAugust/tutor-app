import { createContext } from 'react';

import { defaultTheme, type Theme, type ThemeMode } from './theme';
import type { PaletteVariant } from './tokens';

/**
 * Split into two contexts on purpose:
 *
 * - `ThemeContext` changes on every appearance change and is consumed by every
 *   styled component.
 * - `ThemeControllerContext` holds a stable value (setters + the raw
 *   preferences) and is consumed only by settings UI, so a theme switch does not
 *   re-render the controls that merely *change* the theme.
 */
export const ThemeContext = createContext<Theme>(defaultTheme);

export type ThemeController = {
  /** What the user picked, including `system`. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Flips between light and dark, leaving `system` behind. */
  toggleScheme: () => void;
  /** The active palette variant (the accent axis, orthogonal to light/dark). */
  variant: PaletteVariant;
  setVariant: (variant: PaletteVariant) => void;
  availableVariants: readonly PaletteVariant[];
};

export const ThemeControllerContext = createContext<ThemeController | null>(null);
