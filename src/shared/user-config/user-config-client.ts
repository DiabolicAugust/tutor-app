import { http } from '@/shared/api/http';

import { defaultUserConfig, type UserConfig, type UserConfigPatch } from './user-config';

/**
 * Preference changes go to the server, like every other write in the app.
 *
 * The response is the *whole* config rather than an acknowledgement, so the app
 * ends up with exactly what was stored — including anything the server clamped.
 */
export type UserConfigClient = {
  update: (patch: UserConfigPatch) => Promise<UserConfig>;
};

export const httpUserConfigClient: UserConfigClient = {
  update: (patch) => http.patch<UserConfig>('/users/me/config', patch),
};

/** Echoes the patch back, merged — enough for the UI to behave correctly. */
let mockConfig: UserConfig = { ...defaultUserConfig };

export const mockUserConfigClient: UserConfigClient = {
  async update(patch) {
    mockConfig = { ...mockConfig, ...patch };
    return mockConfig;
  },
};
