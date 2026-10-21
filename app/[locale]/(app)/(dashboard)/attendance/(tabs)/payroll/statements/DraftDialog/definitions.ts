import { useTranslations } from "next-intl";
import * as z from "zod";

import { MONEY_FRACTION_DIGITS, MONEY_MAX } from "@/constants/attendance";

import { isMoney } from "@/utils/attendance";

export const useDraftFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    earnings: z.array(
      z.object({
        amount: z
          .number()
          .gt(0, { error: tValidation("number.positive") })
          .max(MONEY_MAX, {
            error: tValidation("number.max", { max: MONEY_MAX }),
          })
          .refine(isMoney, {
            error: tValidation("number.maxFractionDigits", {
              digits: MONEY_FRACTION_DIGITS,
            }),
          }),
        earningTypeId: z
          .string()
          .min(1, { error: tValidation("earningType.notSelected") }),
      }),
    ),
    employeeId: z.string(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
      error: tValidation("payrollMonth.invalid"),
    }),
    reason: z.string().trim(),
  });
};

export type DraftForm = z.infer<ReturnType<typeof useDraftFormSchema>>;
