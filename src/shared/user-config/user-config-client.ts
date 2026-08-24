import { http } from '@/shared/api/http';

import type { UserConfig, UserConfigPatch } from './user-config';

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
