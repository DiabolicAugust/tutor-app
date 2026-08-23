import { useColorScheme as useRNColorScheme } from 'react-native';

import type { ColorScheme } from './theme';

/** The OS appearance setting, normalized to a concrete scheme. */
export function useSystemColorScheme(): ColorScheme {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
