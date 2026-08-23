import type { TutorialStep } from './tutorial';

/**
 * The tour, in order.
 *
 * A registry rather than a component per step: adding a step is one entry here
 * plus two translation keys, and the overlay never grows a switch. It is also
 * what lets the tour be reordered or shortened without touching any screen.
 *
 * Kept deliberately short. Every step is a thing between somebody and the app
 * they just signed up for, so the tour covers what is not discoverable — where
 * the day view is changed, where a lesson is booked, where settings live — and
 * trusts people to find the rest.
 */
export const tour: readonly TutorialStep[] = [
  {
    id: 'calendar',
    route: '/(app)/(tabs)',
    titleKey: 'tutorial.steps.calendar.title',
    bodyKey: 'tutorial.steps.calendar.body',
    anchor: 'calendar.title',
    placement: 'below',
  },
  {
    id: 'views',
    route: '/(app)/(tabs)',
    titleKey: 'tutorial.steps.views.title',
    bodyKey: 'tutorial.steps.views.body',
    anchor: 'calendar.views',
    placement: 'below',
  },
  {
    id: 'booking',
    route: '/(app)/(tabs)',
    titleKey: 'tutorial.steps.booking.title',
    bodyKey: 'tutorial.steps.booking.body',
    anchor: 'calendar.add',
    placement: 'above',
  },
  {
    id: 'news',
    route: '/(app)/(tabs)/news',
    titleKey: 'tutorial.steps.news.title',
    bodyKey: 'tutorial.steps.news.body',
  },
  {
    id: 'more',
    route: '/(app)/(tabs)/more',
    titleKey: 'tutorial.steps.more.title',
    bodyKey: 'tutorial.steps.more.body',
    anchor: 'more.settings',
    placement: 'below',
  },
];
