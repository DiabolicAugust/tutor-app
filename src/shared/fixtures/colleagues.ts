import type { Tutor } from '@/shared/tutors/tutor';

/**
 * Other tutors whose calendars can be overlaid. Test data only: in production
 * the roster comes from the school's record.
 *
 * `colorIndex` starts at 1 because index 0 belongs to the signed-in tutor's own
 * calendar.
 */
export const fixtureColleagues: Tutor[] = [
  { id: 'tutor-2', name: 'Olena Hrytsenko', speciality: 'English', colorIndex: 1 },
  { id: 'tutor-3', name: 'Taras Lysenko', speciality: 'Physics', colorIndex: 2 },
  { id: 'tutor-4', name: 'Yulia Danylchenko', speciality: 'Chemistry', colorIndex: 3 },
];
