/**
 * Groups of students taught together.
 *
 * The container a group lesson hangs off: membership changes, and the schedule
 * follows it, so adding somebody to a group puts them in its next lesson without
 * anybody editing the lesson.
 */
export {
  byGroupName,
  describeGroup,
  membersOf,
  type Group,
  type GroupMember,
  type GroupPatch,
  type NewGroupInput,
} from './group';
export type { GroupsClient } from './groups-client';
export { useGroups, type GroupsState } from './use-groups';
export { GroupFormSheet } from './components/group-form-sheet';
