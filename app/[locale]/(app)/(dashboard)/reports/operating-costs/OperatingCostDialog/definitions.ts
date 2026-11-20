import { useTranslations } from "next-intl";
import * as z from "zod";

import { operatingCostCategoryValues } from "@/types/api";
import type { OperatingCostCategory } from "@/types/reports";

export const INPUT_TAX_DEDUCTIBLE_BY_CATEGORY: Record<
  OperatingCostCategory,
  boolean
> = {
  electricity: true,
  equipment: true,
  gas: true,
  insurance: false,
  marketing: true,
  other: false,
  personnel: false,
  rent: false,
  telecom: true,
  water: true,
};

export const useOperatingCostFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    category: z.enum(operatingCostCategoryValues),
    inputTaxDeductible: z.boolean(),
    effectiveFrom: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/, {
      error: tValidation("operatingCost.effectiveFrom.required"),
    }),
    monthlyAmount: z
      .string()
      .trim()
      .regex(/^\d{1,10}(\.\d{1,2})?$/, {
        error: tValidation("operatingCost.monthlyAmount.invalid"),
      }),
    note: z
      .string()
      .trim()
      .max(200, {
        error: tValidation("operatingCost.note.maxLength"),
      }),
  });
};

export type OperatingCostForm = z.infer<
  ReturnType<typeof useOperatingCostFormSchema>
>;
