/**
 * Where a lesson is held online.
 *
 * The app's half of the server's `MeetingProvider` enum. A closed list on both
 * sides rather than free text, because three separate things have to agree on
 * it: the picker in settings, the rule that says which addresses are acceptable,
 * and the link written onto a lesson when it is booked.
 *
 * Spelled exactly as the server spells it, which is a deliberate break from how
 * `LessonStatus` is handled — that one is `SCHEDULED` on the wire and
 * `scheduled` here, translated at the one boundary it crosses. This setting
 * crosses two: it arrives inside the sign-in payload *and* from the settings
 * endpoint, and those are separate clients. A translation present in one and
 * missing from the other fails silently — the picker would simply show nothing
 * selected — so there is one spelling instead.
 */
export const meetingProviders = ['ZOOM', 'GOOGLE_MEET', 'JITSI'] as const;

export type MeetingProvider = (typeof meetingProviders)[number];

/** What a tutor has chosen. Null, on the config, means they teach in a room. */
export type MeetingSettings = {
  provider: MeetingProvider;
  /**
   * The tutor's own room, for providers that reuse one. Null for providers that
   * create a room per lesson — which is why the two travel together: a room
   * belonging to no provider means nothing.
   */
  roomUrl: string | null;
};

/**
 * How a link for one provider comes about — mirrored from the server, which
 * remains the authority.
 *
 * `generated` is a link per lesson and needs nothing from the tutor.
 * `personalRoom` is the tutor's own address, and is where Zoom and Google Meet
 * sit: neither will create a meeting for somebody without that person's own
 * OAuth consent, so until the app can ask for it, the room they already have is
 * the honest substitute.
 */
type LinkKind =
  | { kind: 'personalRoom'; hosts: readonly string[] }
  | { kind: 'generated' };

/**
 * A `Record` keyed by the union, so a provider added to the list and forgotten
 * here fails to compile rather than silently producing no link.
 */
export const meetingProviderRules: Readonly<Record<MeetingProvider, LinkKind>> =
  {
    ZOOM: { kind: 'personalRoom', hosts: ['zoom.us'] },
    GOOGLE_MEET: { kind: 'personalRoom', hosts: ['meet.google.com'] },
    JITSI: { kind: 'generated' },
  };

/** Whether this provider expects the tutor to supply an address at all. */
export function needsRoomUrl(provider: MeetingProvider): boolean {
  return meetingProviderRules[provider].kind === 'personalRoom';
}

/**
 * The reasons an address can be refused, as the translation keys that state
 * them.
 *
 * A union rather than `string`, so the dictionary checks these at the point they
 * are written: a key renamed in the locale file and missed here stops the build
 * instead of showing somebody the raw key.
 */
export type MeetingRoomProblemKey =
  | 'meetings.problem.missing'
  | 'meetings.problem.notAUrl'
  | 'meetings.problem.notHttps'
  | 'meetings.problem.hasCredentials'
  | 'meetings.problem.wrongHost';

/**
 * Why this address will not do, as a translation key — or null if it will.
 *
 * A second copy of a rule the server also enforces, and deliberately so: this
 * one exists to answer while somebody is still typing. The server stays the
 * authority, and when the two disagree the server's answer is what gets shown.
 */
export function meetingRoomProblemKey(
  provider: MeetingProvider,
  roomUrl: string,
): MeetingRoomProblemKey | null {
  const rules = meetingProviderRules[provider];
  if (rules.kind === 'generated') return null;

  const trimmed = roomUrl.trim();
  if (trimmed === '') return 'meetings.problem.missing';

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'meetings.problem.notAUrl';
  }

  if (parsed.protocol !== 'https:') return 'meetings.problem.notHttps';
  if (parsed.username !== '' || parsed.password !== '') {
    return 'meetings.problem.hasCredentials';
  }
  if (!isHostOf(parsed.hostname, rules.hosts)) {
    return 'meetings.problem.wrongHost';
  }

  return null;
}

/**
 * Exact host, or a subdomain of it — Zoom hands out per-region and per-company
 * ones. Never a plain suffix match on the string: "evilzoom.us" ends with
 * "zoom.us" and belongs to somebody else.
 */
function isHostOf(hostname: string, hosts: readonly string[]): boolean {
  const host = hostname.toLowerCase();
  return hosts.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}
