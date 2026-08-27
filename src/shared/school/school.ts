import type { AddonKey } from '@/shared/addons';
import type { UserRole } from '@/shared/auth';

/**
 * School management types.
 *
 * Field names match the backend's responses (`GET /schools/current/tutors`,
 * `GET /invitations`), so swapping the mock client for HTTP is a fetch and a
 * cast rather than a mapping layer.
 */

/** Someone with an account in the school. */
export type SchoolMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Capabilities this member holds — see `shared/addons`. */
  addons: AddonKey[];
};

/**
 * An invitation's state, as the backend reports it.
 *
 * Three states rather than a boolean: an admin looking at a list needs to tell
 * "not answered yet" from "the link died".
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export type Invitation = {
  id: string;
  email: string;
  status: InvitationStatus;
  /** ISO instant. */
  expiresAt: string;
  createdAt: string;
  /**
   * The link that opens the app on the registration form.
   *
   * Present only while the invitation is **pending**: an accepted or expired one
   * has nothing left to send, and a dead token is only something to paste by
   * mistake. So the presence of this is what says "there is still something to
   * share here", and the share control follows it rather than re-deriving the
   * rule.
   *
   * The email carries the same link. This is the other channel — the admin's own
   * messenger — because email is the one that fails quietly.
   */
  acceptUrl?: string;
};

/**
 * What the invited person sees before typing anything — only what they already
 * know from the email.
 */
export type InvitationDetails = {
  email: string;
  schoolName: string;
  invitedByName: string;
  expiresAt: string;
};

export type AcceptInvitationInput = {
  name: string;
  password: string;
};

/**
 * Everything needed to bring a school into existence.
 *
 * The school and its first admin are created together, because a school with no
 * admin is a tenant nobody can enter — so this is one input rather than two
 * calls the caller has to sequence correctly.
 */
export type RegisterSchoolInput = {
  schoolName: string;
  /** IANA zone the school schedules in; the app fills in the device's. */
  timezone: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

/** Newest first. */
export function byNewestInvitation(a: Invitation, b: Invitation): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
