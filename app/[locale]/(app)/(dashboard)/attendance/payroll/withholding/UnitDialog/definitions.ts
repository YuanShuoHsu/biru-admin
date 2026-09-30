import { useTranslations } from "next-intl";
import * as z from "zod";

export const UNIT_ADDRESS_MAX_LENGTH = 26;

export const UNIT_TEXT_FIELDS = [
  { max: 50, name: "name" },
  { max: UNIT_ADDRESS_MAX_LENGTH, name: "address" },
  { max: 20, name: "representativeName" },
  { max: 50, name: "agentName" },
  { max: 20, name: "contactName" },
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
    address: text(UNIT_ADDRESS_MAX_LENGTH),
    agentName: text(50),
    businessNumber: z
      .string()
      .regex(/^\d{8}$/, { error: tValidation("businessNumber.invalid") }),
    contactEmail: z.email({ error: tValidation("email.invalid") }).max(30, {
      error: tValidation("withholdingUnit.maxLength", { max: 30 }),
    }),
    contactName: text(20),
    contactPhone: z
      .string()
      .regex(/^[\d-]{1,15}$/, { error: tValidation("withholdingUnit.phone") }),
    name: text(50),
    representativeName: text(20),
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
