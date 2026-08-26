/**
 * Reports: what was taught over a period, and how it went.
 *
 * Every figure is derived from lessons, the register and the gradebook — there
 * is nothing stored here, so a report cannot drift from the calendar it counts.
 */
export {
  defaultReportPeriod,
  hoursFrom,
  reportPeriodKeys,
  reportPeriods,
  type Report,
  type ReportAttendance,
  type ReportBreakdown,
  type ReportGradeAverage,
  type ReportGrades,
  type ReportPeriod,
} from './report';
export { ReportView } from './components/report-view';
export { httpReportsClient, type ReportsClient } from './reports-client';
export { useReport } from './use-report';
