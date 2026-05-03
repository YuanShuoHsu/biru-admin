import { cache } from "react";

import { fetcher } from "./fetcher";

import type { AdminMenu } from "@/types/menus";

export const getAdminMenus = cache(
  async (organizationId: string, init?: RequestInit) => {
    try {
      const data = await fetcher<AdminMenu[]>(
        `/api/organizations/${organizationId}/menus`,
        init,
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
);
