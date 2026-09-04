import { useTranslations } from "next-intl";
import * as z from "zod";

export const useRecipeIngredientFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    ingredientId: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("ingredientId.notSelected"),
      }),
    requiredQuantity: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("requiredQuantity.required"),
      }),
  });
};

export type RecipeIngredientForm = z.infer<
  ReturnType<typeof useRecipeIngredientFormSchema>
>;
