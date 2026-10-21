import { useTranslations } from "next-intl";
import * as z from "zod";

import { payrollEarningCategoryValues } from "@/types/api";

export const useEarningTypeFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    category: z.enum(payrollEarningCategoryValues),
    name: z
      .string()
      .trim()
      .min(1, { error: tValidation("earningTypeName.required") })
      .max(50, { error: tValidation("earningTypeName.maxLength") }),
  });
};

export type EarningTypeForm = z.infer<
  ReturnType<typeof useEarningTypeFormSchema>
>;
