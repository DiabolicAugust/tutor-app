import { http } from '@/shared/api/http';

import type { UserConfig, UserConfigPatch } from './user-config';

/**
 * Preference changes go to the server, like every other write in the app.
 *
 * The response is the *whole* config rather than an acknowledgement, so the app
 * ends up with exactly what was stored — including anything the server clamped.
 *
 * No mapping in either direction, and that is a property of the shapes rather
 * than an oversight: the config also arrives inside the sign-in payload, through
 * a different client, and anything translated here would have to be translated
 * there too. See `shared/meetings` for why the provider list is spelled the same
 * on both sides.
 */
export type UserConfigClient = {
  update: (patch: UserConfigPatch) => Promise<UserConfig>;
};

export const httpUserConfigClient: UserConfigClient = {
  update: (patch) => http.patch<UserConfig>('/users/me/config', patch),
};
