import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  attendanceLegalStatusValues,
  attendanceTerminationReasonValues,
} from "@/types/api";

export const useEmployeeFormSchema = () => {
  const tValidation = useTranslations("validation");

  const periods = (
    field:
      | "nursingPeriod"
      | "pregnancyPeriod"
      | "studentVacation"
      | "workPermit",
  ) =>
    z.array(
      z
        .object({
          from: z.string().min(1, { error: tValidation(`${field}.required`) }),
          to: z.string().min(1, { error: tValidation(`${field}.required`) }),
        })
        .refine(({ from, to }) => !from || !to || from <= to, {
          error: tValidation(`${field}.order`),
          path: ["to"],
        }),
    );

  return z
    .object({
      userId: z.string(),
      hiredAt: z.string().min(1, { error: tValidation("hiredAt.required") }),
      terminatedAt: z.string(),
      enabled: z.boolean(),
      birthDate: z
        .string()
        .min(1, { error: tValidation("birthDate.required") }),
      legalStatus: z.enum(attendanceLegalStatusValues),
      taiwanStaySince: z.string(),
      studentVacations: periods("studentVacation"),
      workPermits: periods("workPermit"),
      pregnancyPeriods: periods("pregnancyPeriod"),
      nursingPeriods: periods("nursingPeriod"),
      indigenousHolidays: z
        .array(
          z.object({
            date: z
              .string()
              .min(1, { error: tValidation("indigenousHoliday.required") }),
          }),
        )
        .superRefine((holidays, context) =>
          holidays.forEach(({ date }, index) => {
            if (
              date &&
              holidays.findIndex((other) => other.date === date) !== index
            )
              context.addIssue({
                code: "custom",
                message: tValidation("indigenousHoliday.duplicate"),
                path: [index, "date"],
              });
          }),
        ),
      terminationReason: z.enum(attendanceTerminationReasonValues).nullable(),
      terminationNoticedAt: z.string(),
      regularLeaveWeekday: z.number().int().min(0).max(6).nullable(),
      restDayWeekday: z.number().int().min(0).max(6).nullable(),
    })
    .refine(
      ({ regularLeaveWeekday, restDayWeekday }) =>
        (regularLeaveWeekday === null) === (restDayWeekday === null) &&
        (regularLeaveWeekday === null ||
          regularLeaveWeekday !== restDayWeekday),
      {
        error: tValidation("restWeekdays.pair"),
        path: ["restDayWeekday"],
      },
    )
    .refine(
      ({ legalStatus, taiwanStaySince }) =>
        legalStatus === "national" || !!taiwanStaySince,
      {
        error: tValidation("taiwanStaySince.required"),
        path: ["taiwanStaySince"],
      },
    )
    .refine(
      ({ hiredAt, terminatedAt }) =>
        !terminatedAt || new Date(terminatedAt) > new Date(hiredAt),
      {
        error: tValidation("terminatedAt.afterHiredAt"),
        path: ["terminatedAt"],
      },
    )
    .refine(
      ({ terminatedAt, terminationReason }) =>
        !terminatedAt || !!terminationReason,
      {
        error: tValidation("terminationReason.required"),
        path: ["terminationReason"],
      },
    )
    .refine(
      ({ hiredAt, terminatedAt, terminationNoticedAt }) =>
        !terminationNoticedAt ||
        (new Date(terminationNoticedAt) >= new Date(hiredAt) &&
          new Date(terminationNoticedAt) <= new Date(terminatedAt)),
      {
        error: tValidation("terminationNoticedAt.withinEmployment"),
        path: ["terminationNoticedAt"],
      },
    );
};

export type EmployeeForm = z.infer<ReturnType<typeof useEmployeeFormSchema>>;
