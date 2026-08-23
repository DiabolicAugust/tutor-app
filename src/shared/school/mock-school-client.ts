import type { AddonKey } from '@/shared/addons';
import { mockAuthClient } from '@/shared/auth';
import { fixtures } from '@/shared/fixtures';

import type { SchoolClient } from './school-client';
import type { Invitation } from './school';

/**
 * Stand-in until the API exists.
 *
 * Invitations are held in memory so the flow is genuinely exercisable: inviting
 * an address adds a pending row, and the token it hands back is accepted by
 * `describeInvitation`, which is what lets the deep link be tested end to end
 * without a mail server. Nothing survives a reload — the honest behaviour while
 * there is no server to store it.
 */
let sequence = 0;
const created = new Map<string, { token: string; invitation: Invitation }>();

function inviteToken(id: string): string {
  return `mock-token-${id}`;
}

const TTL_HOURS = 72;

/** Grant overrides made during this session, keyed by member id. */
const grantOverrides = new Map<string, AddonKey[]>();

export const mockSchoolClient: SchoolClient = {
  async listTutors() {
    return fixtures.schoolMembers.map((member) => ({
      ...member,
      addons: grantOverrides.get(member.id) ?? member.addons,
    }));
  },

  async setMemberAddons(userId, addons) {
    const next = [...new Set(addons)];
    grantOverrides.set(userId, next);
    return next;
  },

  async announce() {
    // Nothing to deliver without a server; the count is what the UI reports.
    return { recipients: fixtures.schoolMembers.length };
  },

  async listInvitations() {
    return [...fixtures.invitations, ...[...created.values()].map((entry) => entry.invitation)];
  },

  async inviteTutor(email) {
    sequence += 1;
    const id = `local-invite-${sequence}`;
    const invitation: Invitation = {
      id,
      email: email.trim().toLowerCase(),
      status: 'pending',
      expiresAt: new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    created.set(id, { token: inviteToken(id), invitation });
    return invitation;
  },

  async revokeInvitation(id) {
    created.delete(id);
  },

  async describeInvitation(token) {
    const entry = [...created.values()].find((candidate) => candidate.token === token);

    return {
      // Any token resolves in the mock, so a link pasted by hand still opens the
      // form. Only a real backend can tell a good token from a bad one.
      email: entry?.invitation.email ?? 'invited.tutor@gmail.com',
      schoolName: fixtures.schoolName || 'Fox Academy',
      invitedByName: 'School Admin',
      expiresAt:
        entry?.invitation.expiresAt ??
        new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000).toISOString(),
    };
  },

  async acceptInvitation(token, input) {
    const details = await this.describeInvitation(token);
    // Reuses the auth mock so the resulting session is identical in shape to a
    // normal sign-in — the app must not be able to tell the difference.
    const session = await mockAuthClient.signIn({ email: details.email, password: input.password });

    return { ...session, user: { ...session.user, name: input.name.trim() } };
  },
};
