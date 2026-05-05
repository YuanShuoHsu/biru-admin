import { cache } from "react";

import { fetcher } from "./fetcher";

import type { AdminMenu, AdminMenuItem, AdminMenuSection } from "@/types/menus";

export const getMenu = cache(
  async (menuId: string, init?: RequestInit) => {
    try {
      return await fetcher<AdminMenu>(`/api/menus/${menuId}`, init);
    } catch {
      return null;
    }
  },
);

export const getMenuSections = cache(
  async (menuId: string, init?: RequestInit) => {
    try {
      const data = await fetcher<AdminMenuSection[]>(
        `/api/menus/${menuId}/menu-sections`,
        init,
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
);

export const getMenuSectionItems = cache(
  async (sectionId: string, init?: RequestInit) => {
    try {
      const data = await fetcher<AdminMenuItem[]>(
        `/api/menu-sections/${sectionId}/menu-items`,
        init,
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
);
