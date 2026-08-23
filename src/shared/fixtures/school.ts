import type { Invitation, SchoolMember } from '@/shared/school/school';

/**
 * Test data for school management.
 *
 * Invitations cover all three states on purpose — pending, accepted, expired —
 * so the list in a test build shows what each looks like without waiting three
 * days for one to lapse.
 */
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export const fixtureSchoolName = 'Fox Academy Demo';

export const fixtureMembers: SchoolMember[] = [
  { id: 'me', name: 'My calendar', email: 'anna.koval@school.com', role: 'tutor' },
  { id: 'tutor-2', name: 'Olena Hrytsenko', email: 'olena.hrytsenko@school.com', role: 'tutor' },
  { id: 'tutor-3', name: 'Taras Lysenko', email: 'taras.lysenko@school.com', role: 'tutor' },
  { id: 'tutor-4', name: 'Yulia Danylchenko', email: 'yulia.d@school.com', role: 'tutor' },
];

export const fixtureInvitations: Invitation[] = [
  {
    id: 'invite-1',
    email: 'nadia.kovalenko@gmail.com',
    status: 'pending',
    expiresAt: hoursFromNow(60),
    createdAt: hoursFromNow(-12),
  },
  {
    id: 'invite-2',
    email: 'oleksii.marchenko@gmail.com',
    status: 'accepted',
    expiresAt: hoursFromNow(-24),
    createdAt: hoursFromNow(-96),
  },
  {
    id: 'invite-3',
    email: 'stale.address@gmail.com',
    status: 'expired',
    expiresAt: hoursFromNow(-2),
    createdAt: hoursFromNow(-120),
  },
];
