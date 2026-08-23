/**
 * The numbers a gradebook is read for. Mirrors the server's `ProgressSummary`
 * exactly, so the client is a fetch rather than a mapping layer.
 */

export type GradeAverage = {
  /** Weighted mean, already rounded to two places by the server. */
  average: number;
  count: number;
};

/**
 * Averages per grading kind, never across them: a 5 on a twelve-point scale and
 * 5% are both "5" and mean opposite things.
 *
 * A null side is how the app learns which register this school grades in,
 * without anybody having to configure it.
 */
export type GradeSummary = {
  count: number;
  classic: GradeAverage | null;
  percentage: GradeAverage | null;
  descriptiveCount: number;
};

export type AttendanceSummary = {
  present: number;
  late: number;
  absentExcused: number;
  absentUnexcused: number;
  /** Lessons somebody has actually marked — the denominator for `rate`. */
  marked: number;
  /**
   * Share attended, 0–1, or null when nothing is marked yet.
   *
   * Null rather than 0: a brand-new student has not missed anything, and a 0%
   * badge on their card would be a lie the screen must not tell.
   */
  rate: number | null;
};

export type ProgressSummary = {
  lessons: {
    total: number;
    completed: number;
    cancelled: number;
    scheduled: number;
  };
  attendance: AttendanceSummary;
  grades: GradeSummary;
};

/** What an empty gradebook looks like, for a screen with nothing loaded yet. */
export const emptyProgress: ProgressSummary = {
  lessons: { total: 0, completed: 0, cancelled: 0, scheduled: 0 },
  attendance: {
    present: 0,
    late: 0,
    absentExcused: 0,
    absentUnexcused: 0,
    marked: 0,
    rate: null,
  },
  grades: { count: 0, classic: null, percentage: null, descriptiveCount: 0 },
};
