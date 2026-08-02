import { cache } from "react";

import { fetcher } from "./fetcher";
import { getHref } from "./href";

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";
import { LOW_STOCK_THRESHOLD } from "@/constants/menus";

import { authClient } from "@/lib/auth-client";

import type { CartAddOn, CartItem } from "@/stores/cart-store";

import type {
  Menu,
  MenuItem,
  MenuItemAddOn,
  MenuItemModifierGroup,
  MenuSection,
  Modifier,
  ModifierGroup,
  OrderMenu,
  OrderMenuAddOnItem,
  OrderMenuItem,
  OrderMenuModifierGroup,
  OrderMenuOffer,
} from "@/types/menus";
import type { ApiOrderMode } from "@/types/orderMode";

export const isLowStock = (offer?: OrderMenuOffer): boolean => {
  const stock = offer?.inventoryLevel?.value;
  if (stock == null || stock <= 0) return false;
  if (offer?.availability === "SoldOut") return false;

  return stock <= LOW_STOCK_THRESHOLD;
};

export interface PromoInfo {
  price: number;
  validThrough: Date | null;
}

export const getActivePromo = (offer?: OrderMenuOffer): PromoInfo | null => {
  const priceSpecification = offer?.priceSpecification;
  if (!priceSpecification) return null;

  const now = new Date();
  const validFrom = priceSpecification.validFrom
    ? new Date(priceSpecification.validFrom)
    : null;
  const validThrough = priceSpecification.validThrough
    ? new Date(priceSpecification.validThrough)
    : null;

  if (validFrom && now < validFrom) return null;
  if (validThrough && now > validThrough) return null;

  return { price: Number(priceSpecification.price), validThrough };
};

export const hasUnsatisfiableModifierGroup = (
  modifierGroups: OrderMenuModifierGroup[],
  mode: ApiOrderMode,
): boolean =>
  modifierGroups.some(
    ({ minSelectionCount, modifiers }) =>
      modifiers.filter(
        ({ availability, availableModes }) =>
          availability !== "SoldOut" &&
          availability !== "Discontinued" &&
          availableModes.includes(mode),
      ).length < minSelectionCount,
  );

export const ADD_ON_OPTION_ID = "addOns";

export const getAddOnItems = (item: OrderMenuItem): OrderMenuAddOnItem[] => {
  const seen = new Set<string>();

  return item.addOns
    .flatMap(({ menuItems }) => menuItems)
    .filter(({ id }) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
};

export const getItemPrice = (offer?: OrderMenuOffer): number => {
  const promo = getActivePromo(offer);

  return promo !== null ? promo.price : Number(offer?.price || 0);
};

export const getAddOnPrice = (addOnItem: OrderMenuAddOnItem): number =>
  getItemPrice(addOnItem.offers[0]);

export const getGroupsExtraCost = (
  groups: OrderMenuModifierGroup[],
  selections: Record<string, string[]>,
): number =>
  groups.reduce((sum, { id, modifiers }) => {
    const selected = selections[id] || [];

    return (
      sum +
      modifiers.reduce(
        (groupSum, { id, priceAdjustment }) =>
          selected.includes(id)
            ? groupSum + Number(priceAdjustment || 0)
            : groupSum,
        0,
      )
    );
  }, 0);

export const calcCartItemExtraCost = (
  menu: OrderMenu | null,
  menuItemId: string,
  modifiers: Record<string, string[]>,
  addOns: CartAddOn[],
): number => {
  const item = findItemById(menu, menuItemId);
  if (!item) return 0;

  const modifierExtraCost = getGroupsExtraCost(item.modifierGroups, modifiers);

  const addOnMap = new Map(addOns.map((a) => [a.menuItemId, a]));
  const selectedAddOnItems = getAddOnItems(item).filter(({ id }) =>
    addOnMap.has(id),
  );

  const addOnExtraCost = selectedAddOnItems.reduce((sum, addOnItem) => {
    const addOnModifiers = addOnMap.get(addOnItem.id)?.modifiers || {};

    return (
      sum +
      getAddOnPrice(addOnItem) +
      getGroupsExtraCost(addOnItem.modifierGroups, addOnModifiers)
    );
  }, 0);

  return modifierExtraCost + addOnExtraCost;
};

export const calcCartItemAmount = (
  menu: OrderMenu | null,
  item: CartItem,
): number => {
  const { menuItemId, modifiers, addOns, quantity } = item;
  const menuItem = findItemById(menu, menuItemId);
  if (!menuItem) return 0;

  const offer = menuItem.offers[0];
  const price = getItemPrice(offer);
  const extraCost = calcCartItemExtraCost(menu, menuItemId, modifiers, addOns);

  return (price + extraCost) * quantity;
};

export const getCartCurrency = (
  menu: OrderMenu | null,
  cartItemsList: CartItem[],
): string => {
  if (!cartItemsList.length) return "";
  const item = findItemById(menu, cartItemsList[0].menuItemId);

  return item?.offers[0]?.priceCurrency || "";
};

export const getItemKey = (
  menuItemId: string,
  modifiers: Record<string, string[]>,
  addOns: CartAddOn[],
): string => {
  const parts = [
    ...Object.entries(modifiers).flatMap(([groupId, selected]) =>
      [...selected].sort().map((modifierId) => `${groupId}:${modifierId}`),
    ),
    ...[...addOns]
      .sort((a, b) => a.menuItemId.localeCompare(b.menuItemId))
      .flatMap(({ menuItemId: addOnId, modifiers }) => [
        `${ADD_ON_OPTION_ID}:${addOnId}`,
        ...Object.entries(modifiers).flatMap(([groupId, selected]) =>
          [...selected]
            .sort()
            .map(
              (modifierId) =>
                `${ADD_ON_OPTION_ID}:${addOnId}:${groupId}:${modifierId}`,
            ),
        ),
      ]),
  ];

  return parts.length > 0 ? `${menuItemId}_${parts.join("_")}` : menuItemId;
};

export const findItemById = (
  menu: OrderMenu | null,
  itemId: string,
): OrderMenuItem | undefined =>
  menu?.sections
    ?.flatMap(({ menuItems }) => menuItems)
    .find(({ id }) => id === itemId);

export const getItemName = (menu: OrderMenu | null, itemId: string): string => {
  const item = findItemById(menu, itemId);
  if (!item) return "";

  return item.name;
};

export const getOfferStock = (offer?: OrderMenuOffer): number | null => {
  if (
    offer?.availability === "SoldOut" ||
    offer?.availability === "Discontinued"
  )
    return 0;
  // || 把 0 當 null，null 代表無追蹤，缺貨變無限制
  return offer?.inventoryLevel?.value ?? null;
};

export const getItemStock = (
  menu: OrderMenu | null,
  itemId: string,
  mode: ApiOrderMode,
): number | null => {
  const item = findItemById(menu, itemId);
  if (!item) return 0;
  if (!item.availableModes.includes(mode)) return 0;

  return getOfferStock(item.offers[0]);
};

type AddOnLimitResult = { cap: number; names: string[] };

export const getAddOnsCap = (
  selectedAddOnItems: OrderMenuAddOnItem[],
  getChoiceAvailableQuantity: (choiceId: string, choiceStock: number) => number,
): AddOnLimitResult =>
  selectedAddOnItems.reduce<AddOnLimitResult>(
    (acc, { id, name, offers }) => {
      const stock = getOfferStock(offers[0]);
      const available =
        stock === null ? Infinity : getChoiceAvailableQuantity(id, stock);

      if (available < acc.cap) return { cap: available, names: [name] };
      if (
        available === acc.cap &&
        acc.cap !== Infinity &&
        !acc.names.includes(name)
      )
        acc.names.push(name);

      return acc;
    },
    { cap: Infinity, names: [] },
  );

export const getLimitingAddOnsCap = (
  menu: OrderMenu | null,
  menuItemId: string,
  addOns: CartAddOn[],
  getChoiceAvailableQuantity: (choiceId: string, choiceStock: number) => number,
): AddOnLimitResult => {
  const item = findItemById(menu, menuItemId);
  if (!item) return { cap: Infinity, names: [] };

  const selectedAddOnItems = getAddOnItems(item).filter(({ id }) =>
    addOns.some((addOn) => addOn.menuItemId === id),
  );

  return getAddOnsCap(selectedAddOnItems, getChoiceAvailableQuantity);
};

interface CommonSeparators {
  addOnLabel?: string;
  colon: string;
  delimiter: string;
  parenthesisOpen: string;
  parenthesisClose: string;
}

export const getChoiceNames = (
  menu: OrderMenu | null,
  menuItemId: string,
  modifiers: Record<string, string[]>,
  addOns: CartAddOn[],
  {
    addOnLabel,
    colon,
    delimiter,
    parenthesisOpen,
    parenthesisClose,
  }: CommonSeparators,
): string => {
  const item = findItemById(menu, menuItemId);
  if (!item) return "";

  const modifierParts = Object.entries(modifiers).flatMap(
    ([groupId, modifierIds]) => {
      if (!modifierIds.length) return [];

      const group = item.modifierGroups.find(({ id }) => id === groupId);

      const modifierNames = modifierIds
        .map(
          (modifierId) =>
            group?.modifiers.find(({ id }) => id === modifierId)?.displayName,
        )
        .filter(Boolean)
        .join(delimiter);

      return modifierNames
        ? [`${group?.displayName ?? ""}${colon}${modifierNames}`]
        : [];
    },
  );

  const addOnItems = getAddOnItems(item);
  const addOnNames = addOns
    .map(({ menuItemId: addOnId, modifiers }) => {
      const addOnItem = addOnItems.find(({ id }) => id === addOnId);
      if (!addOnItem) return "";

      const modifierParts = Object.entries(modifiers)
        .flatMap(([groupId, modifierIds]) => {
          if (!modifierIds.length) return [];

          const group = addOnItem.modifierGroups.find(
            ({ id }) => id === groupId,
          );

          const names = modifierIds
            .map(
              (modifierId) =>
                group?.modifiers.find(({ id }) => id === modifierId)
                  ?.displayName,
            )
            .filter(Boolean)
            .join(delimiter);

          return names ? [`${group?.displayName ?? ""}${colon}${names}`] : [];
        })
        .join(delimiter);

      return modifierParts
        ? `${addOnItem.name}${parenthesisOpen}${modifierParts}${parenthesisClose}`
        : addOnItem.name;
    })
    .filter(Boolean)
    .join(delimiter);

  return [
    ...modifierParts,
    ...(addOnNames ? [`${addOnLabel ?? ""}${colon}${addOnNames}`] : []),
  ].join(delimiter);
};

export const DEFAULT_MENUS_HREF = getHref(
  "/menus/sections",
  DEFAULT_PAGINATION_QUERY,
);

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

export const getResolvedAdminOrganization = cache(
  async (organizationSlug?: string, init?: { headers: { cookie: string } }) => {
    const [{ data: rawOrganizations }, { data: session }] = await Promise.all([
      authClient.organization.list({ fetchOptions: init }),
      authClient.getSession({ fetchOptions: init }),
    ]);

    const organizations = rawOrganizations ?? [];

    return (
      organizations.find(({ slug }) => slug === organizationSlug) ||
      organizations.find(
        ({ id }) => id === session?.session?.activeOrganizationId,
      ) ||
      organizations[0]
    );
  },
);

export const getResolvedAdminOrganizationMenu = cache(
  async (organizationSlug?: string, init?: { headers: { cookie: string } }) => {
    const organization = await getResolvedAdminOrganization(
      organizationSlug,
      init,
    );
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
