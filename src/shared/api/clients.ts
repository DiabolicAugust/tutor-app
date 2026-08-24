import { httpAuthClient } from '@/shared/auth/http-auth-client';
import { mockAuthClient, unavailableAuthClient, type AuthClient } from '@/shared/auth/auth-client';
import {
  httpFilesClient,
  mockFilesClient,
  type FilesClient,
} from '@/shared/files/files-client';
import {
  httpGradebookClient,
  type GradebookClient,
} from '@/shared/gradebook/gradebook-client';
import { mockGradebookClient } from '@/shared/gradebook/mock-gradebook-client';
import {
  httpGroupsClient,
  type GroupsClient,
} from '@/shared/groups/groups-client';
import { mockGroupsClient } from '@/shared/groups/mock-groups-client';
import {
  httpLessonsClient,
  mockLessonsClient,
  type LessonsClient,
} from '@/shared/lessons/lessons-client';
import {
  httpNotesClient,
  mockNotesClient,
  type NotesClient,
} from '@/shared/notes/notes-client';
import {
  httpNotificationsClient,
  mockNotificationsClient,
  type NotificationsClient,
} from '@/shared/notifications/notifications-client';
import {
  httpPushClient,
  mockPushClient,
  type PushClient,
} from '@/shared/push/push-client';
import { httpSchoolClient } from '@/shared/school/http-school-client';
import { mockSchoolClient } from '@/shared/school/mock-school-client';
import type { SchoolClient } from '@/shared/school/school-client';
import {
  httpStudentsClient,
  mockStudentsClient,
  type StudentsClient,
} from '@/shared/students/students-client';
import {
  httpSubjectsClient,
  mockSubjectsClient,
  type SubjectsClient,
} from '@/shared/subjects/subjects-client';
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
  subjects: SubjectsClient;
  notifications: NotificationsClient;
  notes: NotesClient;
  gradebook: GradebookClient;
  groups: GroupsClient;
  files: FilesClient;
  push: PushClient;
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
      subjects: mockSubjectsClient,
      notifications: mockNotificationsClient,
      notes: mockNotesClient,
      gradebook: mockGradebookClient,
      groups: mockGroupsClient,
      files: mockFilesClient,
      push: mockPushClient,
      userConfig: mockUserConfigClient,
      support: mockSupportClient,
    }
  : hasApi
    ? {
        auth: httpAuthClient,
        school: httpSchoolClient,
        lessons: httpLessonsClient,
        students: httpStudentsClient,
        subjects: httpSubjectsClient,
        notifications: httpNotificationsClient,
        notes: httpNotesClient,
        gradebook: httpGradebookClient,
        groups: httpGroupsClient,
        files: httpFilesClient,
        push: httpPushClient,
        userConfig: httpUserConfigClient,
        support: httpSupportClient,
      }
    : {
        auth: unavailableAuthClient,
        school: mockSchoolClient,
        lessons: mockLessonsClient,
        students: mockStudentsClient,
        subjects: mockSubjectsClient,
        notifications: mockNotificationsClient,
        notes: mockNotesClient,
        gradebook: mockGradebookClient,
        groups: mockGroupsClient,
        files: mockFilesClient,
        push: mockPushClient,
        userConfig: mockUserConfigClient,
        support: mockSupportClient,
      };
