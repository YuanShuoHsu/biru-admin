import {
  type components,
  userFilterFieldValues,
  userFilterOperatorValues,
  userSessionFilterFieldValues,
  userSessionSortFieldValues,
  userSortFieldValues,
} from "@/types/api";

export type User = components["schemas"]["UserListItemDto"];
export type UserRole = NonNullable<User["role"]>;
export type UserStatsResponse = components["schemas"]["UserStatsResponseDto"];

export type UserFilterField = (typeof userFilterFieldValues)[number];
export type UserFilterOperator = (typeof userFilterOperatorValues)[number];
export type UserSortField = (typeof userSortFieldValues)[number];

export type UserSession = components["schemas"]["UserSessionResponseDto"];
export type UserSessionFilterField =
  (typeof userSessionFilterFieldValues)[number];
export type UserSessionSortField = (typeof userSessionSortFieldValues)[number];
