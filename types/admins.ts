import {
  type components,
  userFilterFieldValues,
  userFilterOperatorValues,
  userSortFieldValues,
} from "@/types/api";

export type User = components["schemas"]["UserResponseDto"];
export type UserRole = NonNullable<User["role"]>;

export type UserFilterField = (typeof userFilterFieldValues)[number];
export type UserFilterOperator = (typeof userFilterOperatorValues)[number];
export type UserSortField = (typeof userSortFieldValues)[number];
