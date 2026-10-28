import { useTranslations } from "next-intl";
import * as z from "zod";

import { MONEY_FRACTION_DIGITS } from "@/constants/attendance";

import { isMoney } from "@/utils/attendance";

export const MINIMUM_HOURLY_WAGE_MAX = 9_999_999.99;

const SOURCE_LABEL_MAX_LENGTH = 200;

export const useConfirmRuleSetFormSchema = () => {
  const tPayrollRuleSets = useTranslations("payrollRuleSets");
  const tValidation = useTranslations("validation");

  return z.object({
    minimumHourlyWage: z
      .number()
      .positive({ error: tValidation("number.positive") })
      .max(MINIMUM_HOURLY_WAGE_MAX, {
        error: tValidation("number.max", { max: MINIMUM_HOURLY_WAGE_MAX }),
      })
      .refine(isMoney, {
        error: tValidation("number.maxFractionDigits", {
          digits: MONEY_FRACTION_DIGITS,
        }),
      }),
    sourceLabel: z
      .string()
      .trim()
      .min(1, { error: tPayrollRuleSets("confirm.sourceLabel.required") })
      .max(SOURCE_LABEL_MAX_LENGTH, {
        error: tPayrollRuleSets("confirm.sourceLabel.maxLength", {
          max: SOURCE_LABEL_MAX_LENGTH,
        }),
      }),
    sourceUrl: z.url({
      error: tPayrollRuleSets("confirm.sourceUrl.invalid"),
      hostname: z.regexes.domain,
      protocol: /^https$/,
    }),
  });
};

export type ConfirmRuleSetForm = z.infer<
  ReturnType<typeof useConfirmRuleSetFormSchema>
>;
