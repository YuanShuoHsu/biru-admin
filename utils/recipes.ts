import type { Recipe } from "@/types/inventory";

type RecipeCost = Pick<Recipe, "recipeYield"> & { cost?: number | null };

export const costPerServing = ({ cost, recipeYield }: RecipeCost) =>
  cost == null ? null : cost / recipeYield;

export const grossMargin = (recipe: RecipeCost, price: number) => {
  const perServing = costPerServing(recipe);

  return perServing == null || !price ? null : (price - perServing) / price;
};
