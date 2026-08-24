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
