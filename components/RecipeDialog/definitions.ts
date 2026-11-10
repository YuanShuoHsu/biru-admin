import { useTranslations } from "next-intl";
import * as z from "zod";

import { unitCodeValues } from "@/types/api";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useRecipeFormSchema = (unbound: boolean) => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      name: unbound
        ? z
            .record(z.string(), z.string().trim())
            .superRefine(
              refineRequiredLocalizedText(
                tValidation("localizedText.required"),
              ),
            )
        : z.record(z.string(), z.string()),
      recipeYield: z
        .string()
        .trim()
        .min(1, {
          error: tValidation("recipeYield.required"),
        })
        .refine((value) => Number.isInteger(Number(value)), {
          error: tValidation("number.integer"),
        })
        .refine((value) => Number(value) <= 9999, {
          error: tValidation("number.max", { max: 9999 }),
        }),
      recipeYieldQuantity: z.string().trim(),
      recipeYieldUnitCode: z.enum(unitCodeValues).or(z.literal("")),
    })
    .superRefine(({ recipeYieldQuantity, recipeYieldUnitCode }, ctx) => {
      if (recipeYieldQuantity && !(Number(recipeYieldQuantity) > 0))
        ctx.addIssue({
          code: "custom",
          message: tValidation("number.positive"),
          path: ["recipeYieldQuantity"],
        });

      if (recipeYieldUnitCode && !recipeYieldQuantity)
        ctx.addIssue({
          code: "custom",
          message: tValidation("quantity.required"),
          path: ["recipeYieldQuantity"],
        });

      if (recipeYieldQuantity && !recipeYieldUnitCode)
        ctx.addIssue({
          code: "custom",
          message: tValidation("recipeYieldUnitCode.notSelected"),
          path: ["recipeYieldUnitCode"],
        });
    });
};

export type RecipeForm = z.infer<ReturnType<typeof useRecipeFormSchema>>;
