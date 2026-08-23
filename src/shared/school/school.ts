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

/** Newest first. */
export function byNewestInvitation(a: Invitation, b: Invitation): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
