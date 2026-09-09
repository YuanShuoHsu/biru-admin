import type { Recipe } from "@/types/inventory";

type RecipeCost = Pick<Recipe, "recipeYield"> & { cost?: number | null };

export const costPerServing = ({ cost, recipeYield }: RecipeCost) =>
  cost == null ? null : cost / recipeYield;

export const grossProfitPerServing = (recipe: RecipeCost, price: number) => {
  const perServing = costPerServing(recipe);

  return perServing == null || !price ? null : price - perServing;
};

export const grossMargin = (recipe: RecipeCost, price: number) => {
  const profit = grossProfitPerServing(recipe, price);

  return profit == null ? null : profit / price;
};
