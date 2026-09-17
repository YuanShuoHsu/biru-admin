import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  payrollTermsDtoMonthlyProrationValues,
  payrollTermsDtoSalaryTypeValues,
  taiwanInsuranceDtoLaborCoverageValues,
  taiwanInsuranceDtoLaborLadderValues,
  taiwanInsuranceDtoTaxMethodValues,
} from "@/types/api";

import { MONEY_FRACTION_DIGITS, MONEY_MAX } from "@/constants/attendance";

import { isMoney } from "@/utils/attendance";

export const AMOUNT_FIELDS = [
  "salary",
  "allowance",
  "laborInsurance",
  "healthInsurance",
  "voluntaryPension",
  "employerPension",
  "withholding",
  "otherDeduction",
] as const;

export const AUTO_INSURANCE_AMOUNT_FIELDS = [
  "laborInsurance",
  "healthInsurance",
  "voluntaryPension",
  "employerPension",
] as const;

export const PENSION_BASIS_RANGE = { max: 150000, min: 1 } as const;

export const INSURANCE_NUMBER_FIELDS = [
  { max: 20, min: 0, name: "healthDependents" },
  { max: 6, min: 0, name: "voluntaryPercent" },
  { max: 100, min: 6, name: "employerPercent" },
] as const;

export const useTermsFormSchema = () => {
  const tValidation = useTranslations("validation");

  const number = (min: number, max?: number) => {
    const schema = z
      .number()
      .min(min, { error: tValidation("number.min", { min }) });

    return max === undefined
      ? schema
      : schema.max(max, { error: tValidation("number.max", { max }) });
  };

  const money = () =>
    number(0, MONEY_MAX).refine(isMoney, {
      error: tValidation("number.maxFractionDigits", {
        digits: MONEY_FRACTION_DIGITS,
      }),
    });

  return z
    .object({
      allowance: money(),
      allowanceHours: number(1, 744).nullable(),
      autoInsurance: z.boolean(),
      effectiveFrom: z
        .string()
        .min(1, { error: tValidation("effectiveFrom.required") }),
      employeeId: z
        .string()
        .min(1, { error: tValidation("employee.notSelected") }),
      employerPension: money(),
      employerPercent: number(6, 100),
      healthBasis: z.number().nullable(),
      healthDependents: number(0, 20),
      healthInsurance: money(),
      laborBasis: z.number().nullable(),
      laborCoverage: z.enum(taiwanInsuranceDtoLaborCoverageValues),
      laborInsurance: money(),
      laborLadder: z.enum(taiwanInsuranceDtoLaborLadderValues),
      monthlyProration: z.enum(payrollTermsDtoMonthlyProrationValues),
      otherDeduction: money(),
      pensionBasis: number(
        PENSION_BASIS_RANGE.min,
        PENSION_BASIS_RANGE.max,
      ).nullable(),
      salary: money(),
      salaryType: z.enum(payrollTermsDtoSalaryTypeValues),
      sourceNote: z
        .string()
        .trim()
        .min(1, { error: tValidation("sourceNote.required") }),
      taxMethod: z.enum(taiwanInsuranceDtoTaxMethodValues),
      voluntaryPension: money(),
      voluntaryPercent: number(0, 6),
      withholding: money(),
    })
    .superRefine((data, ctx) => {
      if (!data.autoInsurance) return;

      const requiredMessages = {
        ...(data.laborCoverage === "none"
          ? {}
          : { laborBasis: tValidation("laborBasis.notSelected") }),
        healthBasis: tValidation("healthBasis.notSelected"),
        pensionBasis: tValidation("pensionBasis.required"),
      };

      for (const field of Object.keys(requiredMessages) as Array<
        keyof typeof requiredMessages
      >)
        if (data[field] === null)
          ctx.addIssue({
            code: "custom",
            message: requiredMessages[field],
            path: [field],
          });
    });
};

export type TermsForm = z.infer<ReturnType<typeof useTermsFormSchema>>;
