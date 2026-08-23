/**
 * Whether the student turned up.
 *
 * Four values rather than present/absent, because the third and fourth are the
 * whole commercial difference: a lesson cancelled in time is refunded, a no-show
 * is charged. The server owns that rule — see its `STATUS_FOR_ATTENDANCE` — and
 * this side only has to render it honestly.
 */
export type AttendanceStatus = 'present' | 'late' | 'absentExcused' | 'absentUnexcused';

/**
 * The order the picker offers them in: most common first.
 *
 * A tutor marking up a day of lessons taps "present" far more than anything
 * else, so it is the first target rather than the alphabetical one.
 */
export const attendanceOrder = [
  'present',
  'late',
  'absentExcused',
  'absentUnexcused',
] as const satisfies readonly AttendanceStatus[];

/** Copy keys, as a record so a renamed status fails to compile rather than render. */
export const attendanceKeys = {
  present: 'gradebook.attendance.present',
  late: 'gradebook.attendance.late',
  absentExcused: 'gradebook.attendance.absentExcused',
  absentUnexcused: 'gradebook.attendance.absentUnexcused',
} as const satisfies Record<AttendanceStatus, string>;

/** Short forms, for the segmented picker where four labels share a phone width. */
export const attendanceShortKeys = {
  present: 'gradebook.attendance.shortPresent',
  late: 'gradebook.attendance.shortLate',
  absentExcused: 'gradebook.attendance.shortExcused',
  absentUnexcused: 'gradebook.attendance.shortUnexcused',
} as const satisfies Record<AttendanceStatus, string>;

/**
 * Whether the student was taught.
 *
 * Late counts as attended: they were there and the hour happened. The
 * distinction stays visible in its own right, and does not distort a rate the
 * school reads as "how often do they show up".
 */
export function isAttended(status: AttendanceStatus): boolean {
  return status === 'present' || status === 'late';
}

/** The API speaks `ABSENT_UNEXCUSED`, the app speaks `absentUnexcused`. */
export type WireAttendance =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT_EXCUSED'
  | 'ABSENT_UNEXCUSED';

const fromWire: Record<WireAttendance, AttendanceStatus> = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT_EXCUSED: 'absentExcused',
  ABSENT_UNEXCUSED: 'absentUnexcused',
};

const toWire: Record<AttendanceStatus, WireAttendance> = {
  present: 'PRESENT',
  late: 'LATE',
  absentExcused: 'ABSENT_EXCUSED',
  absentUnexcused: 'ABSENT_UNEXCUSED',
};

export const toDomainAttendance = (
  wire: WireAttendance | null | undefined,
): AttendanceStatus | null => (wire ? fromWire[wire] : null);

export const toWireAttendance = (status: AttendanceStatus): WireAttendance =>
  toWire[status];
