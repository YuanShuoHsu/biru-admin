import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  BUSINESS_NUMBER_PATTERN,
  isValidBusinessNumber,
} from "@/utils/businessNumber";

export const UNIT_TEXT_MAX_LENGTH = {
  address: 26,
  agentName: 50,
  contactName: 20,
  name: 50,
  representativeName: 20,
} as const;

export const UNIT_TEXT_FIELDS = [
  "name",
  "address",
  "representativeName",
  "agentName",
  "contactName",
] as const;

export const useUnitFormSchema = () => {
  const tValidation = useTranslations("validation");

  const text = (max: number) =>
    z
      .string()
      .trim()
      .min(1, { error: tValidation("withholdingUnit.required") })
      .max(max, { error: tValidation("withholdingUnit.maxLength", { max }) });

  return z.object({
    address: text(UNIT_TEXT_MAX_LENGTH.address),
    agentName: text(UNIT_TEXT_MAX_LENGTH.agentName),
    businessNumber: z
      .string()
      .regex(BUSINESS_NUMBER_PATTERN, {
        abort: true,
        error: tValidation("businessNumber.invalid"),
      })
      .refine(isValidBusinessNumber, {
        error: tValidation("businessNumber.checksum"),
      }),
    contactEmail: z.email({ error: tValidation("email.invalid") }).max(30, {
      error: tValidation("withholdingUnit.maxLength", { max: 30 }),
    }),
    contactName: text(UNIT_TEXT_MAX_LENGTH.contactName),
    contactPhone: z
      .string()
      .regex(/^[\d-]{1,15}$/, { error: tValidation("withholdingUnit.phone") }),
    name: text(UNIT_TEXT_MAX_LENGTH.name),
    representativeName: text(UNIT_TEXT_MAX_LENGTH.representativeName),
    taxOfficeCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]\d{2}$/, {
        error: tValidation("withholdingUnit.taxOfficeCode"),
      }),
    taxRegistrationNumber: z.string().regex(/^\d{4}[0-9FGHP]\d{4}$/, {
      error: tValidation("withholdingUnit.taxRegistrationNumber"),
    }),
  });
};

export type UnitForm = z.infer<ReturnType<typeof useUnitFormSchema>>;
