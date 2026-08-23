import { useUserConfig } from '@/shared/user-config';

/**
 * Whether this tutor marks work.
 *
 * Read by the gradebook's own components rather than by the screens that host
 * them, so a new place that shows marks cannot forget to check: the section
 * simply renders nothing. The alternative — every screen branching — is three
 * places to keep in step and one to miss.
 *
 * Purely about display. Nothing is deleted when this is off, and the API still
 * accepts and returns marks, so switching it back on finds the history intact.
 */
export function useGradesEnabled(): boolean {
  return useUserConfig().config.gradesEnabled;
}
