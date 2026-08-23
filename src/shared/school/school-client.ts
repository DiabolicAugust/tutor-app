import type { Session } from '@/shared/auth';

import type { AddonKey } from '@/shared/addons';

import type {
  AcceptInvitationInput,
  Invitation,
  InvitationDetails,
  RegisterSchoolInput,
  SchoolMember,
} from './school';

/**
 * The seam between school-management screens and whatever serves them.
 *
 * Same pattern as `AuthClient`: screens talk only to this interface, so the mock
 * below becomes an HTTP client without touching a single component.
 */
export type SchoolClient = {
  /**
   * Creates a school and its first admin, and returns them already signed in.
   *
   * Public, like the invitation routes: the caller has no account yet, and
   * ending onboarding on a login form would be a worse first minute for no gain.
   */
  registerSchool: (input: RegisterSchoolInput) => Promise<Session>;

  /** Calendar owners, caller first — also what the calendar filters list. */
  listTutors: () => Promise<SchoolMember[]>;
  listInvitations: () => Promise<Invitation[]>;
  /** Sends the email. Resending to the same address replaces the invitation. */
  inviteTutor: (email: string) => Promise<Invitation>;
  revokeInvitation: (id: string) => Promise<void>;

  /**
   * Replaces a member's capabilities with exactly this set. A replace rather
   * than add/remove: the UI shows toggles and submits what it wants to be true,
   * which is idempotent and cannot half-apply.
   */
  setMemberAddons: (userId: string, addons: readonly AddonKey[]) => Promise<AddonKey[]>;

  /** Sends an announcement to every member. Resolves with how many got it. */
  announce: (text: string) => Promise<{ recipients: number }>;

  /** Public, keyed by the token from the emailed link. */
  describeInvitation: (token: string) => Promise<InvitationDetails>;
  /** Creates the account and returns a session, already signed in. */
  acceptInvitation: (token: string, input: AcceptInvitationInput) => Promise<Session>;
};
