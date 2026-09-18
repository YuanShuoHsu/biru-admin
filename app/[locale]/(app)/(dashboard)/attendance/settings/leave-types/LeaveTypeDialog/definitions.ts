import { useTranslations } from "next-intl";
import * as z from "zod";

import { statutoryLeaveKindValues } from "@/types/api";

export const useLeaveTypeFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z.string().min(1, { error: tValidation("leaveTypeName.required") }),
    statutoryKind: z.enum(statutoryLeaveKindValues),
    paidPercent: z
      .number()
      .int({ error: tValidation("number.integer") })
      .min(0, { error: tValidation("number.min", { min: 0 }) })
      .max(100, { error: tValidation("number.max", { max: 100 }) }),
    requiresBalance: z.boolean(),
    enabled: z.boolean(),
  });
};

export type LeaveTypeForm = z.infer<ReturnType<typeof useLeaveTypeFormSchema>>;
