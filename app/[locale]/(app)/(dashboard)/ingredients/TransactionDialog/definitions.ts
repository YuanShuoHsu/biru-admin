import { useTranslations } from "next-intl";
import * as z from "zod";

export const useTransactionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    inventoryLevel: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("inventoryLevel.required"),
      }),
    note: z.string().trim().optional(),
  });
};

export type TransactionFormInput = z.input<
  ReturnType<typeof useTransactionFormSchema>
>;

export type TransactionFormOutput = z.output<
  ReturnType<typeof useTransactionFormSchema>
>;
