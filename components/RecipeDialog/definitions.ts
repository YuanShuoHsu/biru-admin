import { useTranslations } from "next-intl";
import * as z from "zod";

export const useRecipeFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    recipeYield: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("recipeYield.required"),
      }),
  });
};

export type RecipeForm = z.infer<ReturnType<typeof useRecipeFormSchema>>;
