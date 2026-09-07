import { useTranslations } from "next-intl";
import * as z from "zod";

import { unitCodeValues } from "@/types/api";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useIngredientFormSchema = (canViewPurchasing: boolean) => {
  const tValidation = useTranslations("validation");

  return z.object({
    brand: z.string().trim().optional(),
    eligibleQuantity: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("eligibleQuantity.required"),
      }),
    inventoryLevel: z.string().trim().optional(),
    inventoryLevelUnitText: z.string().trim().optional(),
    lowStockThreshold: z.string().trim().optional(),
    note: z.string().trim().optional(),
    transactionNote: z.string().trim().optional(),
    price: z
      .string()
      .trim()
      .min(canViewPurchasing ? 1 : 0, {
        error: tValidation("price.required"),
      }),
    priceCurrency: z
      .string()
      .trim()
      .min(canViewPurchasing ? 1 : 0, {
        error: tValidation("priceCurrency.notSelected"),
      }),
    supplierId: z.string().trim().optional(),
    name: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    unitCode: z.string().pipe(
      z.enum(unitCodeValues, {
        error: tValidation("unitCode.notSelected"),
      }),
    ),
    url: z
      .string()
      .trim()
      .refine(
        (value) =>
          !value || z.url({ protocol: /^https?$/ }).safeParse(value).success,
        { error: tValidation("url.invalid") },
      )
      .optional(),
  });
};

export type IngredientFormInput = z.input<
  ReturnType<typeof useIngredientFormSchema>
>;

export type IngredientFormOutput = z.output<
  ReturnType<typeof useIngredientFormSchema>
>;
