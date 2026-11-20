import { useTranslations } from "next-intl";
import * as z from "zod";

import type { CashDenominations } from "@/types/cashDevices";

export const CASH_DENOMINATIONS = [
  1, 5, 10, 20, 50, 100, 200, 500, 1000, 2000,
] as const satisfies readonly (keyof CashDenominations)[];

export const useCashDeviceRefillFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    counts: z
      .array(z.string())
      .length(CASH_DENOMINATIONS.length)
      .refine((counts) => counts.some((count) => Number(count) > 0), {
        error: tValidation("cashDeviceRefill.required"),
      }),
    note: z.string().trim(),
  });
};

export type CashDeviceRefillForm = z.infer<
  ReturnType<typeof useCashDeviceRefillFormSchema>
>;
