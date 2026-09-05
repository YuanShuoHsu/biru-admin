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
  });
};

export type TransactionFormInput = z.input<
  ReturnType<typeof useTransactionFormSchema>
>;

export type TransactionFormOutput = z.output<
  ReturnType<typeof useTransactionFormSchema>
>;
