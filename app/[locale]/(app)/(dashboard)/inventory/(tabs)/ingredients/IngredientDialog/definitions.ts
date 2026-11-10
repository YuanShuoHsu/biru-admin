import { useTranslations } from "next-intl";
import * as z from "zod";

import { UNIT_FACTORS } from "@/constants/inventory";

import { unitCodeValues } from "@/types/api";

import { maxPackages } from "@/utils/ingredients";
import { refineRequiredLocalizedText } from "@/utils/locale";

export const useIngredientFormSchema = (
  canViewPurchasing: boolean,
  recountOnTrackingRestore: boolean,
  stockEditable: boolean,
  editable: boolean,
) => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      brand: z.string().trim().optional(),
      eligibleQuantity: z.string().trim(),
      inventoryLevel: z.string().trim().optional(),
      inventoryLevelUnitText: z.string().trim().optional(),
      lowStockThreshold: z.string().trim().optional(),
      note: z.string().trim().optional(),
      transactionNote: z.string().trim().optional(),
      price: z.string().trim(),
      recipeId: z.string(),
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
      unlimitedStock: z.boolean(),
      url: z
        .string()
        .trim()
        .refine(
          (value) =>
            !value || z.url({ protocol: /^https?$/ }).safeParse(value).success,
          { error: tValidation("url.invalid") },
        )
        .optional(),
    })
    .superRefine(
      (
        {
          eligibleQuantity,
          inventoryLevel,
          lowStockThreshold,
          price,
          recipeId,
          unitCode,
          unlimitedStock,
        },
        ctx,
      ) => {
        if (!recipeId && !eligibleQuantity)
          ctx.addIssue({
            code: "custom",
            message: tValidation("eligibleQuantity.required"),
            path: ["eligibleQuantity"],
          });

        if (!recipeId && canViewPurchasing && !price)
          ctx.addIssue({
            code: "custom",
            message: tValidation("price.required"),
            path: ["price"],
          });

        if (recountOnTrackingRestore && !unlimitedStock && !inventoryLevel)
          ctx.addIssue({
            code: "custom",
            message: tValidation("inventoryLevel.required"),
            path: ["inventoryLevel"],
          });

        const max = maxPackages(
          (recipeId ? 1 : Number(eligibleQuantity)) * UNIT_FACTORS[unitCode],
        );
        if (max === undefined || unlimitedStock) return;

        for (const [field, value, checked] of [
          ["inventoryLevel", inventoryLevel, stockEditable],
          ["lowStockThreshold", lowStockThreshold, editable],
        ] as const)
          if (checked && value && Number(value) > max)
            ctx.addIssue({
              code: "custom",
              message: tValidation("number.max", { max }),
              path: [field],
            });
      },
    );
};

export type IngredientFormInput = z.input<
  ReturnType<typeof useIngredientFormSchema>
>;

export type IngredientFormOutput = z.output<
  ReturnType<typeof useIngredientFormSchema>
>;
