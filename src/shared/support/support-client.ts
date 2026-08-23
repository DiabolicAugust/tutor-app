import { http } from '@/shared/api/http';

export type SupportRequestReceipt = {
  id: string;
  createdAt: string;
};

/**
 * Support messages go through the backend and are stored there.
 *
 * Deliberately not a mailto: link. A message that only ever existed in an email
 * client is one nobody can look up, count, or answer twice — the row is the
 * commitment, and the email about it is optional.
 */
export type SupportClient = {
  submit: (message: string) => Promise<SupportRequestReceipt>;
};

export const httpSupportClient: SupportClient = {
  submit: (message) => http.post<SupportRequestReceipt>('/support', { message }),
};

let sequence = 0;

export const mockSupportClient: SupportClient = {
  async submit() {
    sequence += 1;
    // Accepted and dropped: with no server there is nothing to store, and
    // pretending otherwise would hide that from whoever is testing.
    return { id: `mock-support-${sequence}`, createdAt: new Date().toISOString() };
  },
};
