import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCashAmountSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .string()
    .min(1, { error: tValidation("cashAmount.required") })
    .regex(/^\d{1,8}(\.\d{1,2})?$/, {
      error: tValidation("number.maxFractionDigits", { digits: 2 }),
    });
};

export const toCents = (amount: string) => Math.round(Number(amount) * 100);
