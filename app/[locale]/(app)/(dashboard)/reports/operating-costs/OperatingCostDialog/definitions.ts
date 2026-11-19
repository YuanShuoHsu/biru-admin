import { useTranslations } from "next-intl";
import * as z from "zod";

import { operatingCostCategoryValues } from "@/types/api";

export const useOperatingCostFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    category: z.enum(operatingCostCategoryValues),
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
