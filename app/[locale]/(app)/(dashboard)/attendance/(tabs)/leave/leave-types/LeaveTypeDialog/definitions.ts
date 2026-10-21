import { useTranslations } from "next-intl";
import * as z from "zod";

export const useLeaveTypeFormSchema = (minPaidPercent: number) => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z.string().min(1, { error: tValidation("leaveTypeName.required") }),
    overridden: z.boolean(),
    paidPercent: z
      .number()
      .int({ error: tValidation("number.integer") })
      .min(minPaidPercent, {
        error: tValidation("number.min", { min: minPaidPercent }),
      })
      .max(100, { error: tValidation("number.max", { max: 100 }) }),
    requiresBalance: z.boolean(),
    enabled: z.boolean(),
  });
};

export type LeaveTypeForm = z.infer<ReturnType<typeof useLeaveTypeFormSchema>>;
