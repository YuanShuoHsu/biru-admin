import { cache } from "react";

import { fetcher } from "./fetcher";

import type {
  Ingredient,
  IngredientFilterField,
  IngredientListResponse,
  IngredientSortField,
  InventoryTransactionFilterField,
  InventoryTransactionListResponse,
  InventoryTransactionSortField,
  MenuItemRecipeDetail,
  Recipe,
  RecipeFilterField,
  RecipeIngredientFilterField,
  RecipeIngredientListResponse,
  RecipeIngredientSortField,
  RecipeListResponse,
  RecipeSortField,
  SupplierFilterField,
  SupplierListResponse,
  SupplierSortField,
} from "@/types/inventory";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

export const getIngredients = cache(
  async (
    organizationSlug: string,
    query: GridQuery<IngredientFilterField, IngredientSortField> = {},
    init?: RequestInit,
    lowStock = false,
  ) => {
    const params = getGridSearchParams(query);

    if (lowStock) params.set("lowStock", "true");

    const result = await fetcher<IngredientListResponse>(
      `/api/organizations/${organizationSlug}/ingredients?${params}`,
      init,
    );

    return {
      ingredients: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getIngredient = cache(
  async (ingredientId: string, init?: RequestInit) => {
    return fetcher<Ingredient>(`/api/ingredients/${ingredientId}`, init);
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
    const result = await fetcher<InventoryTransactionListResponse>(
      `/api/ingredients/${ingredientId}/inventory-transactions?${getGridSearchParams(query).toString()}`,
      init,
    );

    return {
      transactions: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getSuppliers = cache(
  async (
    organizationSlug: string,
    query: GridQuery<SupplierFilterField, SupplierSortField> = {},
    init?: RequestInit,
  ) => {
    const result = await fetcher<SupplierListResponse>(
      `/api/organizations/${organizationSlug}/suppliers?${getGridSearchParams(query).toString()}`,
      init,
    );

    return {
      suppliers: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
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
    const result = await fetcher<RecipeIngredientListResponse>(
      `/api/recipes/${recipeId}/recipe-ingredients?${getGridSearchParams(query).toString()}`,
      init,
    );

    return {
      materials: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getRecipeByMenuItem = cache(
  async (menuItemId: string, init?: RequestInit) => {
    const { recipe } = await fetcher<MenuItemRecipeDetail>(
      `/api/menu-items/${menuItemId}/recipe`,
      init,
    );

    return recipe;
  },
);

export const getRecipeByModifier = cache(
  async (modifierId: string, init?: RequestInit) => {
    const { recipe } = await fetcher<MenuItemRecipeDetail>(
      `/api/modifiers/${modifierId}/recipe`,
      init,
    );

    return recipe;
  },
);

export const getRecipes = cache(
  async (
    organizationSlug: string,
    query: GridQuery<RecipeFilterField, RecipeSortField> = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);

    params.set("hasMenuItem", "false");

    const result = await fetcher<RecipeListResponse>(
      `/api/organizations/${organizationSlug}/recipes?${params}`,
      init,
    );

    return {
      recipes: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getRecipe = cache(async (recipeId: string, init?: RequestInit) =>
  fetcher<Recipe>(`/api/recipes/${recipeId}`, init),
);
