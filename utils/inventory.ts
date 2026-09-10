import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Ingredient,
  IngredientFilterField,
  IngredientSortField,
  InventoryTransaction,
  InventoryTransactionFilterField,
  InventoryTransactionSortField,
  MenuItemRecipeDetail,
  RecipeIngredient,
  RecipeIngredientFilterField,
  RecipeIngredientSortField,
  Supplier,
  SupplierFilterField,
  SupplierSortField,
} from "@/types/inventory";

interface GridQuery<FilterField extends string, SortField extends string> {
  page?: number;
  pageSize?: number;
  filterField?: FilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  quickFilterEnums?: string[];
  quickFilterValue?: string;
  sortBy?: SortField;
  sortDirection?: SortDirection;
}

const getGridSearchParams = <
  FilterField extends string,
  SortField extends string,
>({
  page = 1,
  pageSize = 10,
  filterField,
  filterOperator,
  filterValue,
  quickFilterEnums,
  quickFilterValue,
  sortBy,
  sortDirection,
}: GridQuery<FilterField, SortField>) => {
  const isNoValueOperator =
    filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
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

  return params;
};

export const getIngredients = cache(
  async (
    organizationSlug: string,
    query: GridQuery<IngredientFilterField, IngredientSortField> = {},
    init?: RequestInit,
  ) => {
    try {
      const result = await fetcher<{ data: Ingredient[]; total: number }>(
        `/api/organizations/${organizationSlug}/ingredients?${getGridSearchParams(query).toString()}`,
        init,
      );

      return {
        ingredients: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { ingredients: [], total: 0 };
    }
  },
);

export const getIngredient = cache(
  async (ingredientId: string, init?: RequestInit) => {
    try {
      return await fetcher<Ingredient>(
        `/api/ingredients/${ingredientId}`,
        init,
      );
    } catch {
      return null;
    }
  },
);

export const getInventoryTransactions = cache(
  async (
    ingredientId: string,
    query: GridQuery<
      InventoryTransactionFilterField,
      InventoryTransactionSortField
    > = {},
    init?: RequestInit,
  ) => {
    try {
      const result = await fetcher<{
        data: InventoryTransaction[];
        total: number;
      }>(
        `/api/ingredients/${ingredientId}/inventory-transactions?${getGridSearchParams(query).toString()}`,
        init,
      );

      return {
        transactions: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { transactions: [], total: 0 };
    }
  },
);

export const getSuppliers = cache(
  async (
    organizationSlug: string,
    query: GridQuery<SupplierFilterField, SupplierSortField> = {},
    init?: RequestInit,
  ) => {
    try {
      const result = await fetcher<{ data: Supplier[]; total: number }>(
        `/api/organizations/${organizationSlug}/suppliers?${getGridSearchParams(query).toString()}`,
        init,
      );

      return {
        suppliers: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { suppliers: [], total: 0 };
    }
  },
);

export const getRecipeIngredients = cache(
  async (
    recipeId: string,
    query: GridQuery<
      RecipeIngredientFilterField,
      RecipeIngredientSortField
    > = {},
    init?: RequestInit,
  ) => {
    try {
      const result = await fetcher<{
        data: RecipeIngredient[];
        total: number;
      }>(
        `/api/recipes/${recipeId}/recipe-ingredients?${getGridSearchParams(query).toString()}`,
        init,
      );

      return {
        materials: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { materials: [], total: 0 };
    }
  },
);

export const getRecipeByMenuItem = cache(
  async (menuItemId: string, init?: RequestInit) => {
    try {
      const { recipe } = await fetcher<MenuItemRecipeDetail>(
        `/api/menu-items/${menuItemId}/recipe`,
        init,
      );

      return recipe;
    } catch {
      return null;
    }
  },
);
