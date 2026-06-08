import { cache } from "react";

import { fetcher } from "./fetcher";

import { authClient } from "@/lib/auth-client";

import type {
  Menu,
  MenuItem,
  MenuItemAddOn,
  MenuItemModifierGroup,
  MenuSection,
  Modifier,
  ModifierGroup,
  OrderMenu,
  OrderMenuItem,
} from "@/types/menus";

export interface Choice {
  id: string;
  name: string;
  extraCost: number;
  stock: number | null;
  isShared: boolean;
  isActive: boolean;
}

export interface Option {
  id: string;
  name: string;
  choices: Choice[];
  multiple: boolean;
  required: boolean;
}

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

const findItemById = (
  menus: OrderMenu[],
  itemId: string,
): OrderMenuItem | undefined =>
  menus.flatMap(({ menuItems }) => menuItems).find(({ id }) => id === itemId);

export const getItemName = (menus: OrderMenu[], itemId: string): string => {
  const item = findItemById(menus, itemId);
  if (!item) return "";

  return item.name;
};

export const getItemStock = (
  menus: OrderMenu[],
  itemId: string,
): number | null => {
  const item = findItemById(menus, itemId);
  if (!item) return null;

  return item.offers[0]?.inventoryLevel?.value || null;
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
  item: OrderMenuItem & { options: Option[] },
  optionId: string,
): Option | undefined => item.options.find(({ id }) => id === optionId);

type OptionLimitResult = { cap: number; names: string[] };

export const getLimitingChoicesCap = (
  menus: OrderMenu[],
  id: string,
  choices: Record<string, string[]>,
  getChoiceAvailableQuantity: (
    choiceId: string,
    choiceStock: number | null,
    isShared: boolean,
    itemId: string,
  ) => number,
): OptionLimitResult => {
  const item = findItemById(menus, id) as
    | (OrderMenuItem & { options: Option[] })
    | undefined;
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
  menus: OrderMenu[],
  itemId: string,
  choices: Record<string, string[]>,
  { colon, delimiter, joinWith = "\n" }: CommonSeparators,
): string => {
  const item = findItemById(menus, itemId) as
    | (OrderMenuItem & { options: Option[] })
    | undefined;
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

export const DEFAULT_MENUS_HREF = "/menus/sections?page=1&pageSize=10";

export const getAdminOrganization = cache(
  async (organizationSlug?: string, init?: { headers: { cookie: string } }) => {
    const { data: organizations = [] } = await authClient.organization.list({
      fetchOptions: init,
    });

    return organizations?.find(({ slug }) => slug === organizationSlug);
  },
);

export const getAdminOrganizationMenu = cache(
  async (organizationSlug?: string, init?: { headers: { cookie: string } }) => {
    const organization = await getAdminOrganization(organizationSlug, init);
    if (!organization) return { organization: null, menu: null };

    const menus = await fetcher<Menu[]>(
      `/api/organizations/${organization.id}/menus`,
      init,
    );

    return { organization, menu: menus[0] };
  },
);

export const getAdminMenu = cache(
  async (menuId: string, init?: RequestInit) => {
    try {
      return await fetcher<Menu>(`/api/menus/${menuId}`, init);
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
      const result = await fetcher<{ data: MenuSection[]; total: number }>(
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
      return await fetcher<MenuSection>(
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
      const result = await fetcher<{ data: MenuItem[]; total: number }>(
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
        data: MenuItemAddOn[];
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
      const result = await fetcher<{ data: ModifierGroup[]; total: number }>(
        `/api/menus/${menuId}/modifier-groups?${params.toString()}`,
        init,
      );
      return {
        groups: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { groups: [], total: 0 };
    }
  },
);

export const getAdminModifierGroup = cache(
  async (groupId: string, init?: RequestInit) => {
    try {
      return await fetcher<ModifierGroup>(
        `/api/modifier-groups/${groupId}`,
        init,
      );
    } catch {
      return null;
    }
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
      const result = await fetcher<{ data: Modifier[]; total: number }>(
        `/api/modifier-groups/${groupId}/modifiers?${params.toString()}`,
        init,
      );
      return {
        modifiers: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { modifiers: [], total: 0 };
    }
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
        data: MenuItemModifierGroup[];
        total: number;
      }>(
        `/api/menu-items/${menuItemId}/modifier-groups?${params.toString()}`,
        init,
      );
      return {
        links: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { links: [], total: 0 };
    }
  },
);
