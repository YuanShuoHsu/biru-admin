import { useTranslations } from "next-intl";
import * as z from "zod";

import { toCents, useCashAmountSchema } from "../CashAmountField/definitions";

import { cashDrawerMovementTypeValues } from "@/types/api";

export const useCashDrawerMovementFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    type: z.enum(cashDrawerMovementTypeValues),
    amount: useCashAmountSchema().refine((value) => toCents(value) > 0, {
      error: tValidation("number.positive"),
    }),
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("cashDrawerReason.required") }),
  });
};

export type CashDrawerMovementForm = z.infer<
  ReturnType<typeof useCashDrawerMovementFormSchema>
>;
