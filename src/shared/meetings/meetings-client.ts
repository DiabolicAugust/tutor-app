import { http } from '@/shared/api/http';

import type { MeetingProvider } from './meeting-provider';

/**
 * A provider this tutor has authorised, as the server describes it.
 *
 * Deliberately without anything resembling a credential: the refresh token never
 * leaves the server, and this type is the whole of what the app is allowed to
 * know about a connection.
 */
export type MeetingConnection = {
  provider: MeetingProvider;
  /** Who they connected as, when the provider said. */
  accountLabel: string | null;
  connectedAt: string;
};

export type MeetingConnections = {
  /**
   * Providers this server can connect at all.
   *
   * A deployment with only Zoom registered offers Zoom; one with neither offers
   * nothing and the app says so rather than opening a browser that lands on an
   * error page.
   */
  available: MeetingProvider[];
  connected: MeetingConnection[];
};

export type MeetingsClient = {
  connections: () => Promise<MeetingConnections>;
  /**
   * Starts a connection and returns the URL to open.
   *
   * The app opens it and the provider redirects back to the *server*, which is
   * where the exchange happens — the client secret belongs nowhere near a phone,
   * and an app bundle is not a place to keep one.
   */
  connect: (provider: MeetingProvider) => Promise<{ authorizeUrl: string }>;
  disconnect: (provider: MeetingProvider) => Promise<void>;
};

export const httpMeetingsClient: MeetingsClient = {
  connections: () => http.get<MeetingConnections>('/meetings/connections'),

  connect: (provider) =>
    http.post<{ authorizeUrl: string }>(`/meetings/connect/${provider}`, {}),

  disconnect: async (provider) => {
    await http.delete<{ disconnected: string }>(`/meetings/connect/${provider}`);
  },
};
