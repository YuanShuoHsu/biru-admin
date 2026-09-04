import { useTranslations } from "next-intl";
import * as z from "zod";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useRecipeFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    menuItemId: z.string().trim().optional(),
    name: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    recipeYield: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("recipeYield.required"),
      }),
  });
};

export type RecipeForm = z.infer<ReturnType<typeof useRecipeFormSchema>>;
