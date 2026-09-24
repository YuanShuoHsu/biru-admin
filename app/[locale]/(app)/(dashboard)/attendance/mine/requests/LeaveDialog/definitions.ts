import { useTranslations } from "next-intl";
import * as z from "zod";

import { attendanceParentalModeValues } from "@/types/api";
import type { AttendanceLeaveType } from "@/types/attendance";

export const useLeaveFormSchema = (leaveTypes: AttendanceLeaveType[]) => {
  const tValidation = useTranslations("validation");

  const leaveFormObject = z.object({
    leaveTypeId: z
      .string()
      .min(1, { error: tValidation("leaveType.notSelected") }),
    leaveCaseId: z.string(),
    parentalMode: z.enum(attendanceParentalModeValues).or(z.literal("")),
    startsAt: z.string().min(1, { error: tValidation("startsAt.required") }),
    endsAt: z.string().min(1, { error: tValidation("endsAt.required") }),
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("reason.required") }),
  });

  return leaveFormObject
    .refine(({ endsAt, startsAt }) => new Date(endsAt) > new Date(startsAt), {
      error: tValidation("endsAt.afterStartsAt"),
      path: ["endsAt"],
    })
    .superRefine(
      (data, ctx) => {
        const leaveType = leaveTypes.find(({ id }) => id === data.leaveTypeId);

        if (leaveType?.eventLeave && !data.leaveCaseId)
          ctx.addIssue({
            code: "custom",
            message: tValidation("leaveCase.notSelected"),
            path: ["leaveCaseId"],
          });

        if (leaveType?.statutoryKind === "parental" && !data.parentalMode)
          ctx.addIssue({
            code: "custom",
            message: tValidation("parentalMode.notSelected"),
            path: ["parentalMode"],
          });
      },
      {
        when: ({ value }) =>
          leaveFormObject
            .pick({ leaveCaseId: true, leaveTypeId: true, parentalMode: true })
            .safeParse(value).success,
      },
    );
};

export type LeaveForm = z.infer<ReturnType<typeof useLeaveFormSchema>>;
