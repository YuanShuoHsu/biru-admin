import type { UserWithRole } from "better-auth/client/plugins";

import type { roles } from "@/constants/admins";

import type { Locale } from "@/i18n/routing";

import {
  userFilterFieldValues,
  userFilterOperatorValues,
  userSortFieldValues,
} from "@/types/api";

export type AdminRole = (typeof roles)[number];

export type UserFilterField = (typeof userFilterFieldValues)[number];
export type UserFilterOperator = (typeof userFilterOperatorValues)[number];
export type UserSortField = (typeof userSortFieldValues)[number];

export type AdminUser = Omit<UserWithRole, "role"> & {
  bio?: string;
  emailSubscribed: boolean;
  firstName: string;
  lang: Locale;
  lastName?: string;
  role: AdminRole;
};
