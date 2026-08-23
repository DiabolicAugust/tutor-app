import { http } from '@/shared/api/http';

import type { DeviceRegistration } from './push-token';

/**
 * The seam for telling the server where to send notifications.
 *
 * Two calls rather than one: a device is registered when somebody signs in and
 * forgotten when they sign out, and forgetting has to be a request of its own or
 * the next person to use the phone inherits the last person's notifications.
 */
export type PushClient = {
  register: (device: DeviceRegistration) => Promise<void>;
  unregister: (device: DeviceRegistration) => Promise<void>;
};

export const httpPushClient: PushClient = {
  register: async (device) => {
    await http.post<void>('/users/me/devices', device);
  },
  unregister: async (device) => {
    await http.delete<void>('/users/me/devices', device);
  },
};

/**
 * Stand-in with no server to tell.
 *
 * Resolves rather than throwing: registration runs on every sign-in, and a test
 * build should not log an error on every launch for a server it was never
 * pointed at.
 */
export const mockPushClient: PushClient = {
  async register() {},
  async unregister() {},
};
