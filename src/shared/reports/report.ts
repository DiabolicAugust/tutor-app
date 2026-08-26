/**
 * What a school did over a period.
 *
 * The shape the server returns, unchanged — see the backend's `ReportsService`.
 * Every number here is derived from lessons, the register and the gradebook, so
 * nothing is stored twice and a report cannot drift from what the calendar says.
 */

/** Work done, grouped by subject or by tutor. */
export type ReportBreakdown = {
  id: string | null;
  /** Null for lessons booked without a subject, or a tutor who has left. */
  name: string | null;
  lessons: number;
  minutes: number;
};

export type ReportAttendance = {
  present: number;
  late: number;
  absentExcused: number;
  absentUnexcused: number;
  /** Lessons somebody actually marked. The denominator for `rate`. */
  marked: number;
  /**
   * Share of marked lessons attended, 0–1, or null when nothing is marked.
   *
   * Null rather than 0, because "nothing marked" and "nobody came" are opposite
   * facts and showing 0% for the first is a lie.
   */
  rate: number | null;
};

export type ReportGradeAverage = { average: number; count: number };

export type ReportGrades = {
  count: number;
  /** Null when the school grades in another register, or has not graded at all. */
  classic: ReportGradeAverage | null;
  percentage: ReportGradeAverage | null;
  descriptiveCount: number;
};

export type Report = {
  from: string;
  to: string;
  /** One tutor, or null for the whole school. */
  scope: { tutorId: string | null };
  lessons: {
    total: number;
    completed: number;
    cancelled: number;
    scheduled: number;
  };
  /** Completed lessons only — the number somebody bills from. */
  minutesTaught: number;
  studentsTaught: number;
  attendance: ReportAttendance;
  grades: ReportGrades;
  bySubject: ReportBreakdown[];
  /** Null when somebody is reading their own work rather than the school's. */
  byTutor: ReportBreakdown[] | null;
};

/**
 * The periods offered on the screen, in days.
 *
 * Days rather than calendar months, because a report is read as "the last while"
 * and a month boundary makes the first of the month show almost nothing. Named
 * so the labels and the query cannot disagree.
 */
export const reportPeriods = [7, 30, 90, 365] as const;

export type ReportPeriod = (typeof reportPeriods)[number];

export const defaultReportPeriod: ReportPeriod = 30;

/**
 * Translation keys for the period chips.
 *
 * Keyed by the period itself, so a period added to the list without a label
 * fails to compile. The literal union rather than `string`, so the dictionary
 * checks the keys where they are written.
 */
export const reportPeriodKeys: Readonly<
  Record<
    ReportPeriod,
    | 'reports.period.week'
    | 'reports.period.month'
    | 'reports.period.quarter'
    | 'reports.period.year'
  >
> = {
  7: 'reports.period.week',
  30: 'reports.period.month',
  90: 'reports.period.quarter',
  365: 'reports.period.year',
};

/**
 * Hours, to one decimal place.
 *
 * Minutes are what the server counts, because a lesson is 45 or 90 of them and
 * summing hours would round each one. Hours are what anybody reads.
 */
export function hoursFrom(minutes: number): number {
  return Math.round(minutes / 6) / 10;
}
