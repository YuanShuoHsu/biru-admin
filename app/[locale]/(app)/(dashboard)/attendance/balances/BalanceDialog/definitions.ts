import { useTranslations } from "next-intl";
import * as z from "zod";

export const useBalanceFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    employeeId: z
      .string()
      .min(1, { error: tValidation("employee.notSelected") }),
    leaveTypeId: z
      .string()
      .min(1, { error: tValidation("leaveType.notSelected") }),
    year: z
      .number()
      .int({ error: tValidation("number.integer") })
      .min(2026, { error: tValidation("number.min", { min: 2026 }) })
      .max(2100, { error: tValidation("number.max", { max: 2100 }) }),
    grantedMinutes: z
      .number()
      .int({ error: tValidation("number.integer") })
      .min(0, { error: tValidation("number.min", { min: 0 }) })
      .max(525600, { error: tValidation("number.max", { max: 525600 }) }),
  });
};

export type BalanceForm = z.infer<ReturnType<typeof useBalanceFormSchema>>;
