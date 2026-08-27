import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { apiClients } from '@/shared/api';
import { useSession } from '@/shared/auth';

import type { UserConfigClient } from './user-config-client';
import {
  withConfigDefaults,
  type UserConfig,
  type UserConfigPatch,
} from './user-config';

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
  const { user, updateUser } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  /**
   * Which save is the current one.
   *
   * A counter rather than a queue: settings are independent fields, so there is
   * nothing to gain by making the second wait for the first — only by making the
   * first stop speaking once the second exists.
   */
  const latest = useRef(0);

  const config = withConfigDefaults(user?.config);

  /**
   * Saves a change, and keeps the session as the only place the answer lives.
   *
   * Previously this held its own copy alongside the session's. The server stored
   * the new value and the screen showed it, but the persisted session still held
   * what was true at sign-in — so the setting reverted on the next launch and
   * read as never having saved. One owner, written through.
   */
  const update = useCallback(
    async (patch: UserConfigPatch) => {
      const ticket = (latest.current += 1);
      const previous = config;
      // Optimistic: a toggle that waits for a round trip feels broken.
      updateUser({ config: { ...previous, ...patch } });
      setIsSaving(true);
      setHasError(false);

      try {
        // The server is the authority, including on values it clamped.
        const stored = await client.update(patch);
        // But only about the change it was answering. Two settings changed in
        // quick succession and the *first* reply arrived last: it carried the
        // config as it stood before the second change, and applying it turned
        // marking back on a moment after somebody switched it off. A whole-config
        // reply is only the truth while it is the newest one.
        if (ticket === latest.current) updateUser({ config: stored });
      } catch {
        // Reverted only while nothing newer is in flight, since `previous` is
        // this call's idea of "before" and undoing to it would take a later
        // change with it. The newer reply carries the real stored state and
        // corrects this one on arrival — which is also why a stale failure says
        // nothing: an error beside a change that is about to succeed is worse
        // than silence.
        if (ticket === latest.current) {
          updateUser({ config: previous });
          setHasError(true);
        }
      } finally {
        if (ticket === latest.current) setIsSaving(false);
      }
    },
    [client, config, updateUser],
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
