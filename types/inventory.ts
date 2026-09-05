import {
  baseUnitCodeValues,
  ingredientFilterFieldValues,
  ingredientSortFieldValues,
  inventoryTransactionFilterFieldValues,
  inventoryTransactionSortFieldValues,
  recipeIngredientFilterFieldValues,
  recipeIngredientSortFieldValues,
  supplierFilterFieldValues,
  supplierSortFieldValues,
  type components,
} from "@/types/api";

export type Ingredient = components["schemas"]["IngredientResponseDto"];
export type InventoryTransaction =
  components["schemas"]["InventoryTransactionResponseDto"];
export type Recipe = components["schemas"]["RecipeResponseDto"];
export type RecipeIngredient =
  components["schemas"]["RecipeIngredientResponseDto"];
export type Supplier = components["schemas"]["SupplierResponseDto"];

export type BaseUnitCode = (typeof baseUnitCodeValues)[number];
export type UnitCode = components["schemas"]["UnitCode"];

export type IngredientFilterField =
  (typeof ingredientFilterFieldValues)[number];
export type IngredientSortField = (typeof ingredientSortFieldValues)[number];
export type InventoryTransactionFilterField =
  (typeof inventoryTransactionFilterFieldValues)[number];
export type InventoryTransactionSortField =
  (typeof inventoryTransactionSortFieldValues)[number];
export type RecipeIngredientFilterField =
  (typeof recipeIngredientFilterFieldValues)[number];
export type RecipeIngredientSortField =
  (typeof recipeIngredientSortFieldValues)[number];
export type SupplierFilterField = (typeof supplierFilterFieldValues)[number];
export type SupplierSortField = (typeof supplierSortFieldValues)[number];
