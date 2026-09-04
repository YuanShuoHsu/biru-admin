import { useTranslations } from "next-intl";
import * as z from "zod";

import { manualInventoryTransactionTypeValues } from "@/types/api";

export const useTransactionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    note: z.string().trim().optional(),
    quantity: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("quantity.required"),
      }),
    type: z.string().pipe(
      z.enum(manualInventoryTransactionTypeValues, {
        error: tValidation("transactionType.notSelected"),
      }),
    ),
    unitCost: z.string().trim().optional(),
  });
};

export type TransactionFormInput = z.input<
  ReturnType<typeof useTransactionFormSchema>
>;

export type TransactionFormOutput = z.output<
  ReturnType<typeof useTransactionFormSchema>
>;
