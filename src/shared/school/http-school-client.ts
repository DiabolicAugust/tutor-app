import type { AddonKey } from '@/shared/addons';
import { http } from '@/shared/api/http';
import type { Session } from '@/shared/auth';

import type { SchoolClient } from './school-client';
import type { Invitation, InvitationDetails, SchoolMember } from './school';

type WireMember = {
  id: string;
  name: string;
  email: string;
  role: 'TUTOR' | 'ADMIN';
  addons: AddonKey[];
};

type WireInvitation = {
  id: string;
  email: string;
  status: Invitation['status'];
  expiresAt: string;
  createdAt: string;
};

const toMember = (member: WireMember): SchoolMember => ({
  id: member.id,
  name: member.name,
  email: member.email,
  role: member.role.toLowerCase() as SchoolMember['role'],
  // Addon keys are identifiers, not copy, so they cross the wire unchanged.
  addons: member.addons ?? [],
});

export const httpSchoolClient: SchoolClient = {
  async listTutors() {
    const wire = await http.get<WireMember[]>('/schools/current/tutors');
    return wire.map(toMember);
  },

  listInvitations: () => http.get<WireInvitation[]>('/invitations'),

  inviteTutor: (email) => http.post<Invitation>('/invitations', { email }),

  revokeInvitation: async (id) => {
    await http.delete<void>(`/invitations/${id}`);
  },

  // Both invitation-by-token routes are public: holding the token is the
  // authorisation, and the recipient has no session yet.
  setMemberAddons: (userId, addons) =>
    http.patch<AddonKey[]>(`/schools/current/members/${userId}/addons`, { addons }),

  announce: (text) => http.post<{ recipients: number }>('/notifications/announcements', { text }),

  describeInvitation: (token) =>
    http.get<InvitationDetails>(`/invitations/token/${token}`, undefined, true),

  acceptInvitation: (token, input) =>
    http.post<Session>(`/invitations/token/${token}/accept`, input, true),
};
