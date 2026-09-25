import { useTranslations } from "next-intl";
import * as z from "zod";

import { attendanceLegalStatusValues } from "@/types/api";

export const useEmployeeFormSchema = () => {
  const tValidation = useTranslations("validation");

  const periods = (field: "studentVacation" | "workPermit") =>
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
    })
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
    );
};

export type EmployeeForm = z.infer<ReturnType<typeof useEmployeeFormSchema>>;
