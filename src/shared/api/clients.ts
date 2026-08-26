import { httpAuthClient } from '@/shared/auth/http-auth-client';
import { unavailableAuthClient, type AuthClient } from '@/shared/auth/auth-client';
import { httpFilesClient, type FilesClient } from '@/shared/files/files-client';
import {
  httpGradebookClient,
  type GradebookClient,
} from '@/shared/gradebook/gradebook-client';
import { httpGroupsClient, type GroupsClient } from '@/shared/groups/groups-client';
import { httpLessonsClient, type LessonsClient } from '@/shared/lessons/lessons-client';
import { httpNotesClient, type NotesClient } from '@/shared/notes/notes-client';
import {
  httpNotificationsClient,
  type NotificationsClient,
} from '@/shared/notifications/notifications-client';
import { httpPushClient, type PushClient } from '@/shared/push/push-client';
import {
  httpMeetingsClient,
  type MeetingsClient,
} from '@/shared/meetings/meetings-client';
import {
  httpReportsClient,
  type ReportsClient,
} from '@/shared/reports/reports-client';
import { httpSchoolClient } from '@/shared/school/http-school-client';
import type { SchoolClient } from '@/shared/school/school-client';
import { httpStudentsClient, type StudentsClient } from '@/shared/students/students-client';
import { httpSubjectsClient, type SubjectsClient } from '@/shared/subjects/subjects-client';
import { httpSupportClient, type SupportClient } from '@/shared/support/support-client';
import {
  httpUserConfigClient,
  type UserConfigClient,
} from '@/shared/user-config/user-config-client';

import { hasApi } from './api-config';

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
  meetings: MeetingsClient;
  reports: ReportsClient;
  userConfig: UserConfigClient;
  support: SupportClient;
};

/**
 * Where data comes from: the API, and nothing else.
 *
 * This used to choose between three sets — fixtures, HTTP, and a set that refused
 * to do anything — which was the right shape while the app was written ahead of
 * its backend. There is a backend now, and a second implementation of every
 * client was a second thing to keep in step with the server, silently wrong the
 * moment it fell behind. Deleted rather than left as a fallback: a build that
 * quietly runs on invented students is one nobody can trust a bug report from.
 *
 * Authentication is the exception, and only in one direction. With no
 * `EXPO_PUBLIC_API_URL` configured, signing in fails loudly instead of fetching a
 * relative path — which is the difference between "this build was not pointed at
 * a server" and "the server is broken". The rest need no such guard: nothing
 * behind sign-in is reachable without a session.
 */
export const apiClients: ApiClients = {
  auth: hasApi ? httpAuthClient : unavailableAuthClient,
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
  meetings: httpMeetingsClient,
  reports: httpReportsClient,
  userConfig: httpUserConfigClient,
  support: httpSupportClient,
};
