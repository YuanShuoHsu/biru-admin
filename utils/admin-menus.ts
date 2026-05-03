import { cache } from "react";

import { fetcher } from "./fetcher";

import type { AdminMenu, AdminMenuItem, AdminMenuSection } from "@/types/menus";

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
        `/api/menus/${menuId}/sections`,
        init,
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
);

export const getAdminMenuItems = cache(
  async (menuId: string, init?: RequestInit) => {
    try {
      const data = await fetcher<AdminMenuItem[]>(
        `/api/menus/${menuId}/items`,
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
        `/api/menu-sections/${sectionId}/items`,
        init,
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
);
