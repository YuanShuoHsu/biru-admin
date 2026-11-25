import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { cache } from "react";

import { fetcher } from "./fetcher";

import { STORE_TIMEZONE } from "@/constants/timezone";

import type {
  AddOnFilterField,
  AddOnSortField,
  Menu,
  MenuItem,
  MenuItemAddOnListResponse,
  MenuItemFilterField,
  MenuItemListResponse,
  MenuItemModifierGroupListResponse,
  MenuItemSortField,
  MenuSection,
  MenuSectionFilterField,
  MenuSectionListResponse,
  MenuSectionSortField,
  Modifier,
  ModifierFilterField,
  ModifierGroup,
  ModifierGroupFilterField,
  ModifierGroupListResponse,
  ModifierGroupSortField,
  ModifierListResponse,
  ModifierSortField,
} from "@/types/menus";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

// API 計價用同一個格式判斷促銷期間，改這裡要一起改
const PROMO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/;

export const storeDateOf = (value: string): string | null => {
  if (!PROMO_DATE_PATTERN.test(value)) return null;
  const date = dayjs.utc(value);
  return date.isValid() ? date.tz(STORE_TIMEZONE).format("YYYY-MM-DD") : null;
};

export const getAdminMenu = cache(
  async (menuId: string, init?: RequestInit) => {
    return fetcher<Menu>(`/api/menus/${menuId}`, init);
  },
);

export const getAdminMenuSections = cache(
  async (
    menuId: string,
    query: GridQuery<MenuSectionFilterField, MenuSectionSortField> = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);
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
    query: GridQuery<MenuItemFilterField, MenuItemSortField> = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);
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
    query: GridQuery<AddOnFilterField, AddOnSortField> = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);
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
    query: GridQuery<ModifierGroupFilterField, ModifierGroupSortField> = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);
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

export const getAdminModifier = cache(
  async (modifierId: string, init?: RequestInit) => {
    return fetcher<Modifier>(`/api/modifiers/${modifierId}`, init);
  },
);

export const getAdminModifiers = cache(
  async (
    groupId: string,
    query: GridQuery<ModifierFilterField, ModifierSortField> = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);
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
    query: GridQuery<ModifierGroupFilterField, ModifierGroupSortField> = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);
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
