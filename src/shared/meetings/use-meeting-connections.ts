import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';

import { apiClients } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/use-async-data';

import type { MeetingProvider } from './meeting-provider';
import type { MeetingConnections, MeetingsClient } from './meetings-client';

/**
 * Where the server sends the browser once a provider has approved.
 *
 * Has to match `MEETING_CONNECTED_URL` on the server. The scheme is what closes
 * the browser tab and hands control back, so a mismatch leaves somebody staring
 * at a page that says "connected" with no way back into the app.
 */
const RETURN_URL = 'foxacademy://settings';

export type ConnectOutcome = 'connected' | 'cancelled' | 'failed';

export type MeetingConnectionsState = {
  connections: MeetingConnections | null;
  isLoading: boolean;
  isBusy: boolean;
  /** Whether a provider has been authorised by this tutor. */
  isConnected: (provider: MeetingProvider) => boolean;
  /** Whether this server can connect it at all. */
  canConnect: (provider: MeetingProvider) => boolean;
  connect: (provider: MeetingProvider) => Promise<ConnectOutcome>;
  disconnect: (provider: MeetingProvider) => Promise<void>;
};

export function useMeetingConnections(
  client: MeetingsClient = apiClients.meetings,
): MeetingConnectionsState {
  const { data, isLoading, reload } = useAsyncData('meeting-connections', () =>
    client.connections(),
  );
  const [isBusy, setIsBusy] = useState(false);

  const connect = useCallback(
    async (provider: MeetingProvider): Promise<ConnectOutcome> => {
      setIsBusy(true);
      try {
        const { authorizeUrl } = await client.connect(provider);

        // An auth session rather than a plain `openURL`: it closes itself on the
        // redirect back, and on iOS it shares nothing with the ordinary browser
        // — so somebody signed into two Google accounts is asked which, rather
        // than silently connecting whichever the phone's browser holds.
        const result = await WebBrowser.openAuthSessionAsync(
          authorizeUrl,
          RETURN_URL,
        );

        if (result.type !== 'success') return 'cancelled';

        // The server has already stored the credential by the time it redirects;
        // the parameters are only how it reports what happened.
        const status = new URL(result.url).searchParams.get('status');
        // Reloaded either way. A failure that left a connection behind, or a
        // success that did not, both show up here rather than being assumed.
        reload();

        return status === 'connected'
          ? 'connected'
          : status === 'cancelled'
            ? 'cancelled'
            : 'failed';
      } catch {
        return 'failed';
      } finally {
        setIsBusy(false);
      }
    },
    [client, reload],
  );

  const disconnect = useCallback(
    async (provider: MeetingProvider) => {
      setIsBusy(true);
      try {
        await client.disconnect(provider);
      } finally {
        // Reloaded even on failure: the server is the authority on what is
        // connected, and guessing would leave the screen disagreeing with it.
        reload();
        setIsBusy(false);
      }
    },
    [client, reload],
  );

  const isConnected = useCallback(
    (provider: MeetingProvider) =>
      (data?.connected ?? []).some((entry) => entry.provider === provider),
    [data],
  );

  const canConnect = useCallback(
    (provider: MeetingProvider) => (data?.available ?? []).includes(provider),
    [data],
  );

  return {
    connections: data,
    isLoading,
    isBusy,
    isConnected,
    canConnect,
    connect,
    disconnect,
  };
}
