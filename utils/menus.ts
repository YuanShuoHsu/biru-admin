import { cache } from "react";

import { fetcher } from "./fetcher";

import type { Menu, MenuItem, MenuSection } from "@/types/menus";

export const getMenu = cache(async (menuId: string, init?: RequestInit) => {
  try {
    return await fetcher<Menu>(`/api/menus/${menuId}`, init);
  } catch {
    return null;
  }
});

export const getMenuSections = cache(
  async (menuId: string, init?: RequestInit) => {
    try {
      const data = await fetcher<MenuSection[]>(
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
      const data = await fetcher<MenuItem[]>(
        `/api/menu-sections/${sectionId}/menu-items`,
        init,
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
);
