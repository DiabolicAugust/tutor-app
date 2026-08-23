import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import type { ColorScheme } from './theme';

/**
 * Web variant. Static rendering (`web.output: static`) prerenders in Node where
 * no media query exists, so the first client render must match the server's
 * `light` output and only then adopt the real scheme.
 */
export function useSystemColorScheme(): ColorScheme {
  const [hasHydrated, setHasHydrated] = useState(false);
  const colorScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) return 'light';
  return colorScheme === 'dark' ? 'dark' : 'light';
}
