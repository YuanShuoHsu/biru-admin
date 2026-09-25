import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  payrollEmploymentInsuranceExemptionValues,
  payrollHealthInsuranceExemptionValues,
  payrollHealthSupplementExemptionValues,
  payrollLaborInsuranceExemptionValues,
  payrollMonthlyProrationValues,
  payrollSalaryTypeValues,
  payrollTaxMethodValues,
} from "@/types/api";

import { MONEY_FRACTION_DIGITS, MONEY_MAX } from "@/constants/attendance";

import { isMoney } from "@/utils/attendance";

export const AMOUNT_FIELDS = ["salary", "allowance", "otherDeduction"] as const;

export const DECLARED_INSURANCE_FIELDS = [
  "laborBasis",
  "occupationalBasis",
  "healthBasis",
  "pensionBasis",
] as const;

export const PENSION_PERCENT_FIELDS = [
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

  return z.object({
    allowance: money(),
    effectiveFrom: z
      .string()
      .min(1, { error: tValidation("effectiveFrom.required") }),
    employeeId: z
      .string()
      .min(1, { error: tValidation("employee.notSelected") }),
    employerPercent: number(6, 100),
    employmentInsuranceExemption: z
      .enum(payrollEmploymentInsuranceExemptionValues)
      .nullable(),
    healthDependents: number(0, 20),
    healthInsuranceExemption: z
      .enum(payrollHealthInsuranceExemptionValues)
      .nullable(),
    healthInsured: z.boolean(),
    healthSupplementExemption: z
      .enum(payrollHealthSupplementExemptionValues)
      .nullable(),
    laborInsuranceExemption: z
      .enum(payrollLaborInsuranceExemptionValues)
      .nullable(),
    monthlyProration: z.enum(payrollMonthlyProrationValues),
    otherDeduction: money(),
    salary: money(),
    salaryType: z.enum(payrollSalaryTypeValues),
    sourceNote: z.string().trim(),
    taxMethod: z.enum(payrollTaxMethodValues),
    voluntaryLaborInsurance: z.boolean(),
    voluntaryPercent: number(0, 6),
    withholdingDependents: number(0, 99),
  });
};

export type TermsForm = z.infer<ReturnType<typeof useTermsFormSchema>>;
