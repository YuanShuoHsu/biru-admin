import { useTranslations } from "next-intl";
import * as z from "zod";

import { residenceCountryCodeValues } from "@/types/api";

export const TAX_IDENTITY_ADDRESS_MAX_LENGTH = 100;

export const FOREIGN_TAX_ID_MAX_LENGTH = 30;

export const useTaxIdentityFormSchema = (foreign: boolean) => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      address: z
        .string()
        .trim()
        .min(1, { error: tValidation("registeredAddress.required") })
        .max(TAX_IDENTITY_ADDRESS_MAX_LENGTH, {
          error: tValidation("registeredAddress.maxLength", {
            max: TAX_IDENTITY_ADDRESS_MAX_LENGTH,
          }),
        }),
      foreignTaxId: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9-]{0,30}$/, {
          error: tValidation("foreignTaxId.invalid"),
        }),
      residenceCountryCode: z.enum(residenceCountryCodeValues).nullable(),
      taxId: z
        .string()
        .trim()
        .toUpperCase()
        .regex(
          foreign ? /^([A-Z][A-D89]\d{8}|\d{8}[A-Z]{2})$/ : /^[A-Z][12]\d{8}$/,
          {
            error: tValidation(
              foreign ? "residentCertificateId.invalid" : "taxId.invalid",
            ),
          },
        ),
    })
    .superRefine(({ foreignTaxId, residenceCountryCode }, context) => {
      if (!foreign) return;
      if (!residenceCountryCode)
        context.addIssue({
          code: "custom",
          message: tValidation("residenceCountryCode.required"),
          path: ["residenceCountryCode"],
        });
      if (!foreignTaxId)
        context.addIssue({
          code: "custom",
          message: tValidation("foreignTaxId.required"),
          path: ["foreignTaxId"],
        });
    });
};

export type TaxIdentityForm = z.infer<
  ReturnType<typeof useTaxIdentityFormSchema>
>;
