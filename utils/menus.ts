import { cache } from "react";

import { fetcher } from "./fetcher";

import type { Locale } from "@/i18n/routing";

import type { Menu } from "@/types/menu";
import type {
  Menu as AdminMenu,
  MenuItem as AdminMenuItem,
  MenuItemAddOn as AdminMenuItemAddOn,
  MenuSection as AdminMenuSection,
} from "@/types/menus";

interface OrderMenuItem {
  id: string;
  name: string;
  description: string;
  image: string | null;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderMenuSection {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: OrderMenuItem[];
}

export const getMenus = cache(
  async (slug: string, locale: Locale): Promise<Menu[]> => {
    try {
      const sections = await fetcher<OrderMenuSection[]>(
        `/api/organizations/${slug}/order-menu?lang=${locale}`,
        { next: { revalidate: 60, tags: ["menus"] } },
      );

      if (!Array.isArray(sections)) return [];

      return sections.map((section) => ({
        id: section.id,
        key: section.id,
        storeId: section.organizationId,
        name: section.name,
        isActive: true,
        createdAt: new Date(section.createdAt),
        updatedAt: new Date(section.updatedAt),
        items: section.items.map((item) => ({
          id: item.id,
          key: item.id,
          menuId: section.id,
          name: item.name,
          description: item.description,
          image: item.image,
          price: item.price,
          stock: null,
          sold: 0,
          isActive: true,
          options: [],
          ingredients: [],
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
      }));
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
  async (
    menuId: string,
    page: number,
    pageSize: number,
    filterField?: string,
    filterOperator?: string,
    filterValue?: string,
    quickFilterValue?: string,
    sortBy?: string,
    sortDirection?: "asc" | "desc",
    init?: RequestInit,
  ) => {
    try {
      const offset = (page - 1) * pageSize;
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
        ...(sortBy && { sortBy }),
        ...(sortDirection && { sortDirection }),
        ...(filterField &&
          filterOperator &&
          filterValue && { filterField, filterOperator, filterValue }),
        ...(quickFilterValue && { quickFilterValue }),
      });
      const result = await fetcher<{ data: AdminMenuSection[]; total: number }>(
        `/api/menus/${menuId}/menu-sections?${params.toString()}`,
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
    filterField?: string,
    filterOperator?: string,
    filterValue?: string,
    quickFilterValue?: string,
    sortBy?: string,
    sortDirection?: "asc" | "desc",
    init?: RequestInit,
  ) => {
    try {
      const offset = (page - 1) * pageSize;
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
        ...(sortBy && { sortBy }),
        ...(sortDirection && { sortDirection }),
        ...(filterField &&
          filterOperator &&
          filterValue && { filterField, filterOperator, filterValue }),
        ...(quickFilterValue && { quickFilterValue }),
      });
      const result = await fetcher<{ data: AdminMenuItem[]; total: number }>(
        `/api/menu-sections/${sectionId}/menu-items?${params.toString()}`,
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

export const getAdminMenuItemAddOns = cache(
  async (
    menuItemId: string,
    page: number,
    pageSize: number,
    filterField?: string,
    filterOperator?: string,
    filterValue?: string,
    quickFilterValue?: string,
    sortBy?: string,
    sortDirection?: "asc" | "desc",
    init?: RequestInit,
  ) => {
    try {
      const offset = (page - 1) * pageSize;
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
        ...(sortBy && { sortBy }),
        ...(sortDirection && { sortDirection }),
        ...(filterField &&
          filterOperator &&
          filterValue && { filterField, filterOperator, filterValue }),
        ...(quickFilterValue && { quickFilterValue }),
      });
      const result = await fetcher<{
        data: AdminMenuItemAddOn[];
        total: number;
      }>(`/api/menu-items/${menuItemId}/add-ons?${params.toString()}`, init);
      return {
        addOns: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { addOns: [], total: 0 };
    }
  },
);
