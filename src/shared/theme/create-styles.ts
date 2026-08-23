import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import type { Theme } from './theme';
import { useTheme } from './use-theme';

type Style = ViewStyle | TextStyle | ImageStyle;
type NamedStyles<T> = { [K in keyof T]: Style };

/**
 * Declares a component's styles as a function of the theme and returns a hook
 * that yields real `StyleSheet` objects for the active theme.
 *
 * Why not `style={{ color: theme.colors.text }}`? Inline objects are rebuilt on
 * every render, cannot be flattened by RN, and scatter design decisions across
 * call sites. Here the factory runs at most once per *distinct theme* for the
 * whole app — the cache is keyed by `theme.id`, not by component instance — so
 * switching palette or scheme costs one stylesheet build, not one per mounted
 * component.
 *
 * @example
 * const useStyles = createStyles((t) => ({
 *   card: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg },
 *   title: { ...t.typography.titleMd, color: t.colors.text },
 * }));
 *
 * function LessonCard() {
 *   const styles = useStyles();
 *   return <View style={styles.card} />;
 * }
 */
export function createStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (theme: Theme) => T & NamedStyles<any>,
): () => T {
  const cache = new Map<string, T>();

  const build = (theme: Theme): T => {
    const cached = cache.get(theme.id);
    if (cached) return cached;
    const created = StyleSheet.create(factory(theme)) as T;
    cache.set(theme.id, created);
    return created;
  };

  return function useStyles(): T {
    return build(useTheme());
  };
}
