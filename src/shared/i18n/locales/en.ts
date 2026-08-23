/**
 * The default locale and the **source of truth for the key type**: every other
 * dictionary is typed against this one, and `t()` only accepts paths that exist
 * here. Add a key here first.
 *
 * Structure: group by feature (`auth`, `lessons`, `settings`), keep truly
 * generic strings in `common`.
 */
export const en = {
  common: {
    appName: 'Fox Academy',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    close: 'Close',
    retry: 'Retry',
    search: 'Search',
    loading: 'Loading…',
    empty: 'Nothing here yet',
    error: 'Something went wrong',
  },
  settings: {
    title: 'Settings',
    appearance: {
      title: 'Appearance',
      accent: 'Accent color',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    navigation: {
      title: 'Bottom navigation',
      hint: 'Choose which tabs appear and in what order.',
      moveUp: 'Move up',
      moveDown: 'Move down',
      toggle: 'Show or hide',
      reset: 'Reset to default',
    },
    language: {
      title: 'Language',
      /** `null` override — follow the device language. */
      system: 'Device language',
      systemShort: 'Auto',
    },
  },
  auth: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    signInTitle: 'Welcome back',
    signInSubtitle: 'Sign in to manage your lessons and students.',
    emailPlaceholder: 'you@school.com',
    signingIn: 'Signing in…',
    signInFailed: 'Could not sign in. Please try again.',
    mockNotice: 'No backend yet — any email and password will sign you in.',
  },
  tabs: {
    calendar: 'Calendar',
    news: 'News',
    more: 'More',
  },
  news: {
    title: 'News',
    empty: 'No news yet',
    emptyHint: 'Announcements, payment reminders and lessons to confirm show up here.',
    markAllRead: 'Mark all as read',
    unread: {
      zero: 'All caught up',
      one: '{{count}} unread',
      other: '{{count}} unread',
    },
    actions: {
      markHeld: 'Took place',
      markMissed: 'Did not happen',
    },
    kinds: {
      adminAnnouncement: {
        title: 'Announcement',
        body: '{{text}}',
      },
      tutorJoined: {
        title: 'New tutor joined',
        body: '{{personName}} joined the school as a {{text}} tutor.',
      },
      paymentRunningOut: {
        title: 'Paid lessons running out',
        body: {
          one: '{{studentName}} has {{count}} paid lesson left.',
          other: '{{studentName}} has {{count}} paid lessons left.',
        },
      },
      lessonStartingSoon: {
        title: 'Lesson starting soon',
        body: 'Lesson with {{studentName}} at {{time}}.',
      },
      lessonNeedsConfirmation: {
        title: 'Did this lesson take place?',
        body: 'Lesson with {{studentName}} at {{time}} is still unconfirmed.',
      },
    },
  },
  calendarSettings: {
    title: 'Calendar settings',
    view: 'View',
    day: 'Day',
    threeDays: '3 days',
    month: 'Month',
  },
  filters: {
    title: 'Filters',
    calendars: 'Calendars',
    calendarsHint: 'Choose whose schedule is shown on your calendar.',
    visibleCount: {
      zero: 'No calendars shown',
      one: '{{count}} calendar shown',
      other: '{{count}} calendars shown',
    },
  },
  event: {
    add: 'New lesson',
    student: 'Student',
    newStudent: 'Add a new student',
    pickExisting: 'Pick from my students',
    newStudentName: 'Student name',
    lessonsLeft: {
      zero: 'no lessons left',
      one: '{{count}} lesson left',
      other: '{{count}} lessons left',
    },
    ownCalendarNote: 'Lessons are added to your own calendar.',
    studentPlaceholder: 'Who is the lesson with?',
    subject: 'Subject',
    subjectPlaceholder: 'Mathematics',
    date: 'Date',
    startTime: 'Starts at',
    duration: 'Duration',
    minutes: '{{count}} min',
    create: 'Add lesson',
    missingStudent: 'Enter a student name.',
  },
  calendar: {
    title: 'Calendar',
    today: 'Today',
    previous: 'Previous',
    next: 'Next',
    empty: 'No lessons on this day',
  },
  more: {
    title: 'More',
    settings: 'Settings',
    preferences: 'Preferences',
    account: 'Account',
  },
  lessons: {
    title: 'Lessons',
    count: {
      zero: 'No lessons scheduled',
      one: '{{count}} lesson',
      other: '{{count}} lessons',
    },
    nextWith: 'Next lesson with {{name}}',
  },
  students: {
    title: 'Students',
    count: {
      zero: 'No students yet',
      one: '{{count}} student',
      other: '{{count}} students',
    },
  },
} as const;

/** The canonical dictionary shape. Other locales are partials of this. */
export type AppDictionary = typeof en;
