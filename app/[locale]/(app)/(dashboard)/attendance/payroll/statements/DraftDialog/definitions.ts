import { useTranslations } from "next-intl";
import * as z from "zod";

export const useDraftFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    employeeId: z
      .string()
      .min(1, { error: tValidation("employee.notSelected") }),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
      error: tValidation("payrollMonth.invalid"),
    }),
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("reason.required") }),
  });
};

export type DraftForm = z.infer<ReturnType<typeof useDraftFormSchema>>;
