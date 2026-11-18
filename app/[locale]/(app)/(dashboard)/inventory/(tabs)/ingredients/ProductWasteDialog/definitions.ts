import { useTranslations } from "next-intl";
import * as z from "zod";

import { wasteReasonValues } from "@/types/api";

export const useProductWasteFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    menuItemId: z.string().min(1, {
      error: tValidation("menuItemId.notSelected"),
    }),
    modifierIds: z.array(z.string()),
    note: z.string().trim(),
    servings: z
      .string()
      .trim()
      .refine((value) => Number(value) > 0, {
        error: tValidation("servings.required"),
      })
      .refine((value) => Number.isInteger(Number(value)), {
        error: tValidation("number.integer"),
      })
      .refine((value) => Number(value) <= 9999, {
        error: tValidation("number.max", { max: 9999 }),
      }),
    wasteReason: z.string().pipe(
      z.enum(wasteReasonValues, {
        error: tValidation("wasteReason.notSelected"),
      }),
    ),
  });
};

export type ProductWasteFormInput = z.input<
  ReturnType<typeof useProductWasteFormSchema>
>;

export type ProductWasteFormOutput = z.output<
  ReturnType<typeof useProductWasteFormSchema>
>;
