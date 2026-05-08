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
  async (
    menuId: string,
    page: number,
    pageSize: number,
    init?: RequestInit,
  ) => {
    try {
      const offset = (page - 1) * pageSize;
      const result = await fetcher<{ data: AdminMenuSection[]; total: number }>(
        `/api/menus/${menuId}/menu-sections?limit=${pageSize}&offset=${offset}`,
        init,
      );
      return {
        sections: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { sections: [], total: 0 };
    }
  },
);

export const getAdminMenuSection = cache(
  async (sectionId: string, init?: RequestInit) => {
    try {
      return await fetcher<AdminMenuSection>(
        `/api/menu-sections/${sectionId}`,
        init,
      );
    } catch {
      return null;
    }
  },
);

export const getAdminMenuSectionItems = cache(
  async (
    sectionId: string,
    page: number,
    pageSize: number,
    init?: RequestInit,
  ) => {
    try {
      const offset = (page - 1) * pageSize;
      const result = await fetcher<{ data: AdminMenuItem[]; total: number }>(
        `/api/menu-sections/${sectionId}/menu-items?limit=${pageSize}&offset=${offset}`,
        init,
      );
      return {
        items: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { items: [], total: 0 };
    }
  },
);
