import { useTranslations } from "next-intl";
import * as z from "zod";

import type { AttendanceLeaveType } from "@/types/attendance";

export const useLeaveCaseFormSchema = (leaveTypes: AttendanceLeaveType[]) => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      childId: z.string(),
      earlyParentalAgreed: z.boolean(),
      employeeId: z
        .string()
        .min(1, { error: tValidation("employee.notSelected") }),
      endsAt: z.string().min(1, { error: tValidation("endsAt.required") }),
      eventDate: z.string(),
      extensionAgreed: z.boolean(),
      leaveTypeId: z
        .string()
        .min(1, { error: tValidation("leaveType.notSelected") }),
      reason: z
        .string()
        .trim()
        .min(1, { error: tValidation("reason.required") }),
      reference: z
        .string()
        .trim()
        .min(1, { error: tValidation("caseReference.required") }),
      startsAt: z.string().min(1, { error: tValidation("startsAt.required") }),
    })
    .superRefine((data, ctx) => {
      if (new Date(data.endsAt) <= new Date(data.startsAt))
        ctx.addIssue({
          code: "custom",
          message: tValidation("endsAt.afterStartsAt"),
          path: ["endsAt"],
        });

      const isParental =
        leaveTypes.find(({ id }) => id === data.leaveTypeId)?.statutoryKind ===
        "parental";

      if (isParental && !data.childId)
        ctx.addIssue({
          code: "custom",
          message: tValidation("parentalChild.notSelected"),
          path: ["childId"],
        });

      if (!isParental && !data.eventDate)
        ctx.addIssue({
          code: "custom",
          message: tValidation("eventDate.required"),
          path: ["eventDate"],
        });
    });
};

export type LeaveCaseForm = z.infer<ReturnType<typeof useLeaveCaseFormSchema>>;
