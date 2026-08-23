import type { Session } from '@/shared/auth';

import type {
  AcceptInvitationInput,
  Invitation,
  InvitationDetails,
  SchoolMember,
} from './school';

/**
 * The seam between school-management screens and whatever serves them.
 *
 * Same pattern as `AuthClient`: screens talk only to this interface, so the mock
 * below becomes an HTTP client without touching a single component.
 */
export type SchoolClient = {
  /** Calendar owners, caller first — also what the calendar filters list. */
  listTutors: () => Promise<SchoolMember[]>;
  listInvitations: () => Promise<Invitation[]>;
  /** Sends the email. Resending to the same address replaces the invitation. */
  inviteTutor: (email: string) => Promise<Invitation>;
  revokeInvitation: (id: string) => Promise<void>;

  /** Public, keyed by the token from the emailed link. */
  describeInvitation: (token: string) => Promise<InvitationDetails>;
  /** Creates the account and returns a session, already signed in. */
  acceptInvitation: (token: string, input: AcceptInvitationInput) => Promise<Session>;
};
