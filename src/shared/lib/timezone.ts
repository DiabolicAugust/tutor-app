/**
 * The device's IANA time zone, or `UTC` if it cannot be determined.
 *
 * Wrapped in a try/catch rather than called directly because Hermes ships a
 * reduced `Intl`: the app has already been bitten once by an `Intl` API that
 * exists on web and not on device, and a school created with a crash instead of
 * a time zone is a worse outcome than one created in UTC.
 */
export function deviceTimezone(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return resolved && resolved.length > 0 ? resolved : 'UTC';
  } catch {
    return 'UTC';
  }
}
