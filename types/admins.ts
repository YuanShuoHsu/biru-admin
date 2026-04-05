import type { UserWithRole } from "better-auth/client/plugins";

import type { roles } from "@/constants/admins";

export type AdminRole = (typeof roles)[number];

export type AdminUser = Omit<UserWithRole, "role"> & { role: AdminRole };
