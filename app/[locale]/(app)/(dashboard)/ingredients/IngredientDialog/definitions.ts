import { useTranslations } from "next-intl";
import * as z from "zod";

import { baseUnitCodeValues } from "@/types/api";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useIngredientFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    brand: z.string().trim().optional(),
    lowStockThreshold: z.string().trim().optional(),
    name: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    unitCode: z.string().pipe(
      z.enum(baseUnitCodeValues, {
        error: tValidation("unitCode.notSelected"),
      }),
    ),
  });
};

export type IngredientFormInput = z.input<
  ReturnType<typeof useIngredientFormSchema>
>;

export type IngredientFormOutput = z.output<
  ReturnType<typeof useIngredientFormSchema>
>;
