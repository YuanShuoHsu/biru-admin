import type { UserWithRole } from "better-auth/client/plugins";

import type { roles } from "@/constants/admins";

import type { Locale } from "@/i18n/routing";

export type AdminRole = (typeof roles)[number];

export type AdminUser = Omit<UserWithRole, "role"> & {
  bio?: string;
  emailSubscribed: boolean;
  firstName: string;
  lang: Locale;
  lastName?: string;
  role: AdminRole;
};
