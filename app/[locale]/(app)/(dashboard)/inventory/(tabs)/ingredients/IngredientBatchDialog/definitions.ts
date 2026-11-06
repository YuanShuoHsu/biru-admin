import { useTranslations } from "next-intl";
import * as z from "zod";

export const useIngredientBatchFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    note: z.string().trim(),
    quantity: z
      .string()
      .trim()
      .refine((value) => Number(value) > 0, {
        error: tValidation("quantity.required"),
      }),
  });
};

export type IngredientBatchForm = z.infer<
  ReturnType<typeof useIngredientBatchFormSchema>
>;
