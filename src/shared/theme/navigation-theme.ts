import { DarkTheme, DefaultTheme } from 'expo-router';

import type { Theme } from './theme';

type NavigationTheme = typeof DefaultTheme;

/**
 * Bridges our tokens into the theme shape React Navigation expects, so
 * navigator chrome (headers, tab bars, screen backgrounds) follows the same
 * palette as the rest of the app.
 *
 * The navigation defaults are spread first so fields we do not model — fonts,
 * platform specifics — keep their upstream values.
 */
export function toNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: theme.scheme === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.brand,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}
