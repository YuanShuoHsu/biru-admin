import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { LOW_STOCK_THRESHOLD } from "@/constants/menus";

import type {
  Menu,
  MenuItem,
  MenuItemAddOnListResponse,
  MenuItemListResponse,
  MenuItemModifierGroupListResponse,
  MenuSection,
  MenuSectionListResponse,
  ModifierGroup,
  ModifierGroupListResponse,
  ModifierListResponse,
  OrderMenuOffer,
} from "@/types/menus";

export const isLowStock = (offer?: OrderMenuOffer): boolean => {
  const stock = offer?.inventoryLevel?.value;
  if (stock == null || stock <= 0) return false;
  if (offer?.availability === "SoldOut") return false;

  return stock <= LOW_STOCK_THRESHOLD;
};

export const getAdminMenu = cache(
  async (menuId: string, init?: RequestInit) => {
    return fetcher<Menu>(`/api/menus/${menuId}`, init);
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
    const offset = (page - 1) * pageSize;
    const isNoValueOperator =
      filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      ...(sortBy && { sortBy }),
      ...(sortDirection && { sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || isNoValueOperator) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });
    const result = await fetcher<MenuSectionListResponse>(
      `/api/menus/${menuId}/menu-sections?${params.toString()}`,
      init,
    );
    return {
      sections: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getAdminMenuSection = cache(
  async (sectionId: string, init?: RequestInit) => {
    return fetcher<MenuSection>(`/api/menu-sections/${sectionId}`, init);
  },
);

export const getAdminMenuItem = cache(
  async (menuItemId: string, init?: RequestInit) => {
    return fetcher<MenuItem>(`/api/menu-items/${menuItemId}`, init);
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
    quickFilterEnums?: string[],
    sortBy?: string,
    sortDirection?: "asc" | "desc",
    init?: RequestInit,
  ) => {
    const offset = (page - 1) * pageSize;
    const isNoValueOperator =
      filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      ...(sortBy && { sortBy }),
      ...(sortDirection && { sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || isNoValueOperator) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });
    for (const entry of quickFilterEnums || [])
      params.append("quickFilterEnums", entry);

    const result = await fetcher<MenuItemListResponse>(
      `/api/menu-sections/${sectionId}/menu-items?${params.toString()}`,
      init,
    );
    return {
      items: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
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
    const offset = (page - 1) * pageSize;
    const isNoValueOperator =
      filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      ...(sortBy && { sortBy }),
      ...(sortDirection && { sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || isNoValueOperator) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });
    const result = await fetcher<MenuItemAddOnListResponse>(
      `/api/menu-items/${menuItemId}/add-ons?${params.toString()}`,
      init,
    );
    return {
      addOns: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getAdminModifierGroups = cache(
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
    const offset = (page - 1) * pageSize;
    const isNoValueOperator =
      filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      ...(sortBy && { sortBy }),
      ...(sortDirection && { sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || isNoValueOperator) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });
    const result = await fetcher<ModifierGroupListResponse>(
      `/api/menus/${menuId}/modifier-groups?${params.toString()}`,
      init,
    );
    return {
      groups: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getAdminModifierGroup = cache(
  async (groupId: string, init?: RequestInit) => {
    return fetcher<ModifierGroup>(`/api/modifier-groups/${groupId}`, init);
  },
);

export const getAdminModifiers = cache(
  async (
    groupId: string,
    page: number,
    pageSize: number,
    filterField?: string,
    filterOperator?: string,
    filterValue?: string,
    quickFilterValue?: string,
    quickFilterEnums?: string[],
    sortBy?: string,
    sortDirection?: "asc" | "desc",
    init?: RequestInit,
  ) => {
    const offset = (page - 1) * pageSize;
    const isNoValueOperator =
      filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      ...(sortBy && { sortBy }),
      ...(sortDirection && { sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || isNoValueOperator) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });
    for (const entry of quickFilterEnums || [])
      params.append("quickFilterEnums", entry);

    const result = await fetcher<ModifierListResponse>(
      `/api/modifier-groups/${groupId}/modifiers?${params.toString()}`,
      init,
    );
    return {
      modifiers: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getAdminMenuItemModifierGroups = cache(
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
    const offset = (page - 1) * pageSize;
    const isNoValueOperator =
      filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      ...(sortBy && { sortBy }),
      ...(sortDirection && { sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || isNoValueOperator) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });
    const result = await fetcher<MenuItemModifierGroupListResponse>(
      `/api/menu-items/${menuItemId}/modifier-groups?${params.toString()}`,
      init,
    );
    return {
      links: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);
