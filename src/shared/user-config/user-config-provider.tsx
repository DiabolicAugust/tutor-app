import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { apiClients } from '@/shared/api';
import { useSession } from '@/shared/auth';

import type { UserConfigClient } from './user-config-client';
import { withConfigDefaults, type UserConfig, type UserConfigPatch } from './user-config';

export type UserConfigStore = {
  config: UserConfig;
  /** A save is in flight. */
  isSaving: boolean;
  /** True when the last save failed; the UI shows the reverted value. */
  hasError: boolean;
  update: (patch: UserConfigPatch) => Promise<void>;
};

const UserConfigContext = createContext<UserConfigStore | null>(null);

/**
 * Account preferences.
 *
 * Seeded from the session, so the settings screen renders its real state on the
 * first frame instead of showing defaults and correcting itself. Writes go
 * through the API and the server's response replaces local state — it is the
 * authority on what was stored, including values it clamped.
 *
 * Applied optimistically and reverted on failure: a toggle that does not move
 * until a round trip completes feels broken, and one that stays moved after a
 * failed save lies.
 */
export function UserConfigProvider({
  children,
  client = apiClients.userConfig,
}: {
  children: ReactNode;
  client?: UserConfigClient;
}) {
  const { user } = useSession();
  const [override, setOverride] = useState<UserConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  const config = override ?? withConfigDefaults(user?.config);

  const update = useCallback(
    async (patch: UserConfigPatch) => {
      const previous = config;
      setOverride({ ...previous, ...patch });
      setIsSaving(true);
      setHasError(false);

      try {
        setOverride(await client.update(patch));
      } catch {
        setOverride(previous);
        setHasError(true);
      } finally {
        setIsSaving(false);
      }
    },
    [client, config],
  );

  const value = useMemo<UserConfigStore>(
    () => ({ config, isSaving, hasError, update }),
    [config, isSaving, hasError, update],
  );

  return <UserConfigContext.Provider value={value}>{children}</UserConfigContext.Provider>;
}

export function useUserConfig(): UserConfigStore {
  const value = useContext(UserConfigContext);
  if (!value) {
    throw new Error('useUserConfig must be used inside <UserConfigProvider>.');
  }
  return value;
}
