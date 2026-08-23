import { httpAuthClient } from '@/shared/auth/http-auth-client';
import { mockAuthClient, unavailableAuthClient, type AuthClient } from '@/shared/auth/auth-client';
import {
  httpLessonsClient,
  mockLessonsClient,
  type LessonsClient,
} from '@/shared/lessons/lessons-client';
import {
  httpNotificationsClient,
  mockNotificationsClient,
  type NotificationsClient,
} from '@/shared/notifications/notifications-client';
import { httpSchoolClient } from '@/shared/school/http-school-client';
import { mockSchoolClient } from '@/shared/school/mock-school-client';
import type { SchoolClient } from '@/shared/school/school-client';
import {
  httpStudentsClient,
  mockStudentsClient,
  type StudentsClient,
} from '@/shared/students/students-client';
import {
  httpSupportClient,
  mockSupportClient,
  type SupportClient,
} from '@/shared/support/support-client';
import {
  httpUserConfigClient,
  mockUserConfigClient,
  type UserConfigClient,
} from '@/shared/user-config/user-config-client';

import { hasApi, useMockClients } from './api-config';

export type ApiClients = {
  auth: AuthClient;
  school: SchoolClient;
  lessons: LessonsClient;
  students: StudentsClient;
  notifications: NotificationsClient;
  userConfig: UserConfigClient;
  support: SupportClient;
};

/**
 * The one place that decides where data comes from.
 *
 * Every provider takes its client from here by default, so pointing the whole
 * app at a real backend is setting `EXPO_PUBLIC_API_URL` — not editing five
 * files. Individual providers still accept a `client` prop, which is what makes
 * them testable in isolation.
 *
 * With no API and no fixtures (a production build that has not been pointed at a
 * server yet) the auth client fails loudly rather than fabricating a session,
 * and the rest return nothing. Better an empty app than a convincing lie.
 */
export const apiClients: ApiClients = useMockClients
  ? {
      auth: mockAuthClient,
      school: mockSchoolClient,
      lessons: mockLessonsClient,
      students: mockStudentsClient,
      notifications: mockNotificationsClient,
      userConfig: mockUserConfigClient,
      support: mockSupportClient,
    }
  : hasApi
    ? {
        auth: httpAuthClient,
        school: httpSchoolClient,
        lessons: httpLessonsClient,
        students: httpStudentsClient,
        notifications: httpNotificationsClient,
        userConfig: httpUserConfigClient,
        support: httpSupportClient,
      }
    : {
        auth: unavailableAuthClient,
        school: mockSchoolClient,
        lessons: mockLessonsClient,
        students: mockStudentsClient,
        notifications: mockNotificationsClient,
        userConfig: mockUserConfigClient,
        support: mockSupportClient,
      };
