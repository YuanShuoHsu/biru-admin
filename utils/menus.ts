import { cache } from "react";

import { fetcher } from "./fetcher";

import type { Locale } from "@/i18n/routing";

import type { Menu, MenuItem } from "@/types/menu";
import type {
  Menu as AdminMenu,
  MenuItem as AdminMenuItem,
  MenuItemAddOn as AdminMenuItemAddOn,
  MenuSection as AdminMenuSection,
} from "@/types/menus";

export const getItemKey = (
  itemId: string,
  choices: Record<string, string[]>,
): string => {
  if (!choices) return itemId;

  const parts = Object.entries(choices).flatMap(([optionId, selected]) =>
    selected.length > 0
      ? [...selected].sort().map((choiceId) => `${optionId}:${choiceId}`)
      : [],
  );

  return parts.length > 0 ? `${itemId}_${parts.join("_")}` : itemId;
};

const findItemById = (menus: Menu[], itemId: string): MenuItem | undefined =>
  menus.flatMap(({ items }) => items).find(({ id }) => id === itemId);

export const getItemName = (menus: Menu[], itemId: string): string => {
  const item = findItemById(menus, itemId);
  if (!item) return "";

  return item.name;
};

export const getItemStock = (menus: Menu[], itemId: string): number | null => {
  const item = findItemById(menus, itemId);
  if (!item) return 0;

  return item.stock;
};

const findOptionChoiceById = (
  option: Option,
  choiceId: string,
): Choice | undefined => option.choices.find(({ id }) => id === choiceId);

const getOptionChoiceName = (option: Option, choiceId: string): string => {
  const choice = findOptionChoiceById(option, choiceId);

  return choice?.name || "";
};

const findItemOptionById = (
  item: MenuItem,
  optionId: string,
): Option | undefined => item.options.find(({ id }) => id === optionId);

type OptionLimitResult = { cap: number; names: string[] };

export const getLimitingChoicesCap = (
  menus: Menu[],
  id: string,
  choices: Record<string, string[]>,
  getChoiceAvailableQuantity: (
    choiceId: string,
    choiceStock: number | null,
    isShared: boolean,
    itemId: string,
  ) => number,
): OptionLimitResult => {
  const item = findItemById(menus, id);
  if (!item) return { cap: Infinity, names: [] };

  const { names, cap } = Object.entries(choices).reduce<OptionLimitResult>(
    (acc, [optionId, choiceIds]) => {
      if (!choiceIds.length) return acc;

      const option = findItemOptionById(item, optionId);
      if (!option) return acc;

      const optionCap = choiceIds.reduce((min, choiceId) => {
        const choice = findOptionChoiceById(option, choiceId);
        if (!choice) return min;

        const { stock: choiceStock, isShared, name } = choice;
        const available = getChoiceAvailableQuantity(
          choiceId,
          choiceStock,
          isShared,
          id,
        );

        if (available < acc.cap) {
          acc.names = [name];
          acc.cap = available;
        } else if (available === acc.cap && !acc.names.includes(name))
          acc.names.push(name);

        return Math.min(min, available);
      }, Infinity);

      acc.cap = Math.min(acc.cap, optionCap);
      return acc;
    },
    { cap: Infinity, names: [] },
  );

  return { names, cap };
};

interface CommonSeparators {
  colon: string;
  delimiter: string;
  joinWith?: string;
}

export const getChoiceNames = (
  menus: Menu[],
  itemId: string,
  choices: Record<string, string[]>,
  { colon, delimiter, joinWith = "\n" }: CommonSeparators,
): string => {
  const item = findItemById(menus, itemId);
  if (!item) return "";

  return Object.entries(choices)
    .flatMap(([optionId, choiceIds]) => {
      if (!choiceIds.length) return [];

      const option = findItemOptionById(item, optionId);
      if (!option) return [];

      const choiceNames = choiceIds
        .map((choiceId) => getOptionChoiceName(option, choiceId))
        .filter(Boolean)
        .join(delimiter);

      return choiceNames ? [`${option.name}${colon}${choiceNames}`] : [];
    })
    .join(joinWith);
};

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
