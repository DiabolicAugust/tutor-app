import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { mockSchoolClient } from './mock-school-client';
import type { SchoolClient } from './school-client';
import { byNewestInvitation, type Invitation, type SchoolMember } from './school';

export type SchoolStore = {
  tutors: readonly SchoolMember[];
  invitations: readonly Invitation[];
  isLoading: boolean;
  /** Translation key of the last failure, or `null`. */
  errorKey: 'school.inviteFailed' | null;
  inviteTutor: (email: string) => Promise<boolean>;
  revokeInvitation: (id: string) => Promise<void>;
  clearError: () => void;
};

const SchoolContext = createContext<SchoolStore | null>(null);

/**
 * School management state.
 *
 * Mounted app-wide rather than inside the admin screen because the tutor roster
 * is also what the calendar's filters need — one fetch, two consumers.
 */
export function SchoolProvider({
  children,
  client = mockSchoolClient,
}: {
  children: ReactNode;
  client?: SchoolClient;
}) {
  const [tutors, setTutors] = useState<SchoolMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<SchoolStore['errorKey']>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const [nextTutors, nextInvitations] = await Promise.all([
        client.listTutors(),
        client.listInvitations(),
      ]);
      // Guard against a resolve after unmount, which would warn and leak.
      if (!active) return;
      setTutors(nextTutors);
      setInvitations(nextInvitations.sort(byNewestInvitation));
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [client]);

  const inviteTutor = useCallback(
    async (email: string) => {
      setErrorKey(null);
      try {
        const invitation = await client.inviteTutor(email);
        setInvitations((current) => [invitation, ...current.filter((i) => i.email !== invitation.email)]);
        return true;
      } catch {
        setErrorKey('school.inviteFailed');
        return false;
      }
    },
    [client],
  );

  const revokeInvitation = useCallback(
    async (id: string) => {
      await client.revokeInvitation(id);
      setInvitations((current) => current.filter((invitation) => invitation.id !== id));
    },
    [client],
  );

  const value = useMemo<SchoolStore>(
    () => ({
      tutors,
      invitations,
      isLoading,
      errorKey,
      inviteTutor,
      revokeInvitation,
      clearError: () => setErrorKey(null),
    }),
    [tutors, invitations, isLoading, errorKey, inviteTutor, revokeInvitation],
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool(): SchoolStore {
  const value = useContext(SchoolContext);
  if (!value) {
    throw new Error('useSchool must be used inside <SchoolProvider>.');
  }
  return value;
}
