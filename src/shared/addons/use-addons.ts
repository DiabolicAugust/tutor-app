import { useMemo } from 'react';

import { useSession } from '@/shared/auth';

import { allAddons, type AddonKey } from './addon';

export type AddonAccess = {
  /** Capabilities the signed-in account holds. */
  granted: readonly AddonKey[];
  has: (key: AddonKey) => boolean;
};

/**
 * What the signed-in account may do.
 *
 * Reads from the session, which already carries the addons from the user's first
 * payload — so gating UI costs no request and nothing flickers into existence a
 * moment after the screen appears.
 *
 * An admin holds everything: they are the person who grants capabilities, so
 * requiring them to grant themselves permission to grant permissions is a loop.
 * The backend applies the same rule, in `AddonsService.resolveFor` — stated in
 * both places because both must agree, and neither can ask the other.
 */
export function useAddons(): AddonAccess {
  const { user } = useSession();

  return useMemo(() => {
    const granted = user?.role === 'admin' ? allAddons : (user?.addons ?? []);
    const set = new Set(granted);

    return { granted, has: (key: AddonKey) => set.has(key) };
  }, [user]);
}
