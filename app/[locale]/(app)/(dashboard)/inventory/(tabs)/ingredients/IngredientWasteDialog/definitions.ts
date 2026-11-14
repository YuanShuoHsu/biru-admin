import { useTranslations } from "next-intl";
import * as z from "zod";

import { wasteReasonValues } from "@/types/api";

export const useIngredientWasteFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    note: z.string().trim(),
    quantity: z
      .string()
      .trim()
      .refine((value) => Number(value) > 0, {
        error: tValidation("quantity.required"),
      }),
    wasteReason: z.string().pipe(
      z.enum(wasteReasonValues, {
        error: tValidation("wasteReason.notSelected"),
      }),
    ),
  });
};

export type IngredientWasteFormInput = z.input<
  ReturnType<typeof useIngredientWasteFormSchema>
>;

export type IngredientWasteFormOutput = z.output<
  ReturnType<typeof useIngredientWasteFormSchema>
>;
