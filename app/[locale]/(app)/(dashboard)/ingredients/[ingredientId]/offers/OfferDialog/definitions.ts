import { useTranslations } from "next-intl";
import * as z from "zod";

import { unitCodeValues } from "@/types/api";

export const useIngredientOfferFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    eligibleQuantity: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("eligibleQuantity.required"),
      }),
    eligibleQuantityUnitCode: z
      .string()
      .pipe(
        z.enum(unitCodeValues, { error: tValidation("unitCode.notSelected") }),
      ),
    price: z
      .string()
      .trim()
      .min(1, { error: tValidation("price.required") }),
    supplierId: z.string().trim().optional(),
    url: z.string().trim().optional(),
  });
};

export type IngredientOfferFormInput = z.input<
  ReturnType<typeof useIngredientOfferFormSchema>
>;

export type IngredientOfferFormOutput = z.output<
  ReturnType<typeof useIngredientOfferFormSchema>
>;
