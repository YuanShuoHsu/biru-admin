import {
  baseUnitCodeValues,
  ingredientFilterFieldValues,
  ingredientSortFieldValues,
  inventoryTransactionFilterFieldValues,
  inventoryTransactionSortFieldValues,
  manualInventoryTransactionTypeValues,
  recipeFilterFieldValues,
  recipeSortFieldValues,
  supplierFilterFieldValues,
  supplierSortFieldValues,
  type components,
} from "@/types/api";

export type Ingredient = components["schemas"]["IngredientResponseDto"];
export type IngredientOffer =
  components["schemas"]["IngredientOfferResponseDto"];
export type InventoryTransaction =
  components["schemas"]["InventoryTransactionResponseDto"];
export type Recipe = components["schemas"]["RecipeResponseDto"];
export type RecipeIngredient =
  components["schemas"]["RecipeIngredientResponseDto"];
export type Supplier = components["schemas"]["SupplierResponseDto"];

export type BaseUnitCode = (typeof baseUnitCodeValues)[number];
export type UnitCode = components["schemas"]["UnitCode"];
export type InventoryTransactionType =
  components["schemas"]["InventoryTransactionType"];
export type ManualInventoryTransactionType =
  (typeof manualInventoryTransactionTypeValues)[number];

export type IngredientFilterField =
  (typeof ingredientFilterFieldValues)[number];
export type IngredientSortField = (typeof ingredientSortFieldValues)[number];
export type InventoryTransactionFilterField =
  (typeof inventoryTransactionFilterFieldValues)[number];
export type InventoryTransactionSortField =
  (typeof inventoryTransactionSortFieldValues)[number];
export type RecipeFilterField = (typeof recipeFilterFieldValues)[number];
export type RecipeSortField = (typeof recipeSortFieldValues)[number];
export type SupplierFilterField = (typeof supplierFilterFieldValues)[number];
export type SupplierSortField = (typeof supplierSortFieldValues)[number];
