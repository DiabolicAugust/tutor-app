import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';

import { ThemeContext, ThemeControllerContext, type ThemeController } from './theme-context';
import { isThemeMode, resolveScheme, themes, type Theme, type ThemeMode } from './theme';
import {
  defaultPaletteVariant,
  isPaletteVariant,
  paletteVariantNames,
  type PaletteVariant,
} from './tokens';
import { useSystemColorScheme } from './use-system-color-scheme';

const themeModeStore = createPersistedValue<ThemeMode>(StorageKeys.themeMode, isThemeMode);
const themeVariantStore = createPersistedValue<PaletteVariant>(
  StorageKeys.themeVariant,
  isPaletteVariant,
);

export type ThemeProviderProps = {
  children: ReactNode;
  /** Overrides the persisted value. Useful for tests and screenshot tooling. */
  initialMode?: ThemeMode;
  /** Overrides the persisted palette variant. */
  initialVariant?: PaletteVariant;
  /**
   * Bypasses variant/scheme resolution entirely and forces one theme.
   *
   * The white-label seam: pass `createTheme({ id: schoolId, override })` once a
   * tenant's brand colors are known and the whole tree renders in them, while
   * the controller still reports the user's own preferences.
   */
  theme?: Theme;
};

/**
 * Owns the active appearance for the whole app. Mount once, above the router.
 *
 * Two independent axes:
 * - `mode` — light / dark / follow the OS.
 * - `variant` — which palette variant (accent family) to use.
 *
 * Both are read synchronously from storage in the initial state, so a returning
 * user never sees a flash of the wrong theme.
 */
export function ThemeProvider({
  children,
  initialMode,
  initialVariant,
  theme: forcedTheme,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(
    () => initialMode ?? themeModeStore.read() ?? 'system',
  );
  const [variant, setVariantState] = useState<PaletteVariant>(
    () => initialVariant ?? themeVariantStore.read() ?? defaultPaletteVariant,
  );
  const systemScheme = useSystemColorScheme();
  const scheme = resolveScheme(mode, systemScheme);
  const theme = forcedTheme ?? themes[variant][scheme];

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    themeModeStore.write(next);
  }, []);

  const setVariant = useCallback((next: PaletteVariant) => {
    setVariantState(next);
    themeVariantStore.write(next);
  }, []);

  const controller = useMemo<ThemeController>(
    () => ({
      mode,
      setMode,
      toggleScheme: () => setMode(scheme === 'dark' ? 'light' : 'dark'),
      variant,
      setVariant,
      availableVariants: paletteVariantNames,
    }),
    [mode, setMode, scheme, variant, setVariant],
  );

  return (
    <ThemeControllerContext.Provider value={controller}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemeControllerContext.Provider>
  );
}
