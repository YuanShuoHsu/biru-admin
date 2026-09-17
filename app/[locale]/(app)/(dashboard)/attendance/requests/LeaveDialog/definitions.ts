import { useTranslations } from "next-intl";
import * as z from "zod";

import { attendanceRequestDtoParentalModeValues } from "@/types/api";

export const useLeaveFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      leaveTypeId: z
        .string()
        .min(1, { error: tValidation("leaveType.notSelected") }),
      leaveCaseId: z.string(),
      parentalMode: z
        .enum(attendanceRequestDtoParentalModeValues)
        .or(z.literal("")),
      startsAt: z.string().min(1, { error: tValidation("startsAt.required") }),
      endsAt: z.string().min(1, { error: tValidation("endsAt.required") }),
      reason: z
        .string()
        .trim()
        .min(1, { error: tValidation("reason.required") }),
    })
    .refine(({ endsAt, startsAt }) => new Date(endsAt) > new Date(startsAt), {
      error: tValidation("endsAt.afterStartsAt"),
      path: ["endsAt"],
    });
};

export type LeaveForm = z.infer<ReturnType<typeof useLeaveFormSchema>>;
