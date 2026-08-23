import type { AppDictionary, TranslationKey } from '@/shared/i18n';
import { icons, type IconName } from '@/shared/ui';

/**
 * Capabilities that can be granted to an individual member.
 *
 * Roles say what job someone does; addons say what they are allowed to do. A
 * school may want one senior tutor who can invite colleagues without making them
 * an admin, and that is not expressible with roles alone.
 *
 * Matches the backend's `AddonKey` enum, screaming snake case included, because
 * these values travel over the wire and through the session. Unlike the other
 * wire mappings in this app, translating them would buy nothing: an addon key is
 * an identifier, not copy.
 */
export type AddonKey = 'INVITE_TUTORS' | 'BROADCAST_ANNOUNCEMENTS';

/**
 * Where an addon's behaviour lives.
 *
 * Not decoration — it says what granting the addon actually changes:
 * - `app` — unlocks UI only; nothing on the server knows about it.
 * - `api` — the server enforces it; the app need not even show it.
 * - `both` — UI plus an endpoint that checks the same capability.
 *
 * A `both` addon that the app gates but the server does not is a lock on a door
 * with no wall, so the field exists to make that mismatch a thing you can see.
 */
export type AddonSurface = 'app' | 'api' | 'both';

export type AddonDescriptor = {
  key: AddonKey;
  surface: AddonSurface;
  icon: IconName;
  titleKey: TranslationKey<AppDictionary>;
  descriptionKey: TranslationKey<AppDictionary>;
};

/**
 * Every addon the app knows about.
 *
 * Adding one: extend `AddonKey`, add an entry here, add its copy under
 * `addons.*`, and — if its surface is `api` or `both` — the matching
 * `@RequiresAddon` on the backend. The record is exhaustive by type, so
 * TypeScript points at whatever is left undone.
 */
export const addonRegistry: Record<AddonKey, AddonDescriptor> = {
  INVITE_TUTORS: {
    key: 'INVITE_TUTORS',
    surface: 'both',
    icon: icons.person,
    titleKey: 'addons.inviteTutors.title',
    descriptionKey: 'addons.inviteTutors.description',
  },
  BROADCAST_ANNOUNCEMENTS: {
    key: 'BROADCAST_ANNOUNCEMENTS',
    surface: 'both',
    icon: icons.megaphone,
    titleKey: 'addons.broadcastAnnouncements.title',
    descriptionKey: 'addons.broadcastAnnouncements.description',
  },
};

export const allAddons: readonly AddonKey[] = Object.keys(addonRegistry) as AddonKey[];

export function describeAddon(key: AddonKey): AddonDescriptor {
  return addonRegistry[key];
}

export function isAddonKey(value: unknown): value is AddonKey {
  return typeof value === 'string' && value in addonRegistry;
}
