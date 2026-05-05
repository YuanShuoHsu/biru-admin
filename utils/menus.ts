import { cache } from "react";

import { fetcher } from "./fetcher";

// 未來要修
import type { Menu } from "@/types/menu";
import type {
  Menu as AdminMenu,
  MenuItem as AdminMenuItem,
  MenuSection as AdminMenuSection,
} from "@/types/menus";

export const getMenus = cache(async (storeId: string) => {
  try {
    const data = await fetcher<Menu[]>(`/api/stores/${storeId}/menus`, {
      next: { revalidate: 60, tags: ["menus"] },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
});

export const getAdminMenu = cache(
  async (menuId: string, init?: RequestInit) => {
    try {
      return await fetcher<AdminMenu>(`/api/menus/${menuId}`, init);
    } catch {
      return null;
    }
  },
);

export const getAdminMenuSections = cache(
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

export const getAdminMenuSectionItems = cache(
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
