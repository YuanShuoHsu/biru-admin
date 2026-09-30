import { useTranslations } from "next-intl";
import * as z from "zod";

export const TAX_IDENTITY_ADDRESS_MAX_LENGTH = 100;

export const useTaxIdentityFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    address: z
      .string()
      .trim()
      .min(1, { error: tValidation("registeredAddress.required") })
      .max(TAX_IDENTITY_ADDRESS_MAX_LENGTH, {
        error: tValidation("registeredAddress.maxLength", {
          max: TAX_IDENTITY_ADDRESS_MAX_LENGTH,
        }),
      }),
    taxId: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z][12]\d{8}$/, { error: tValidation("taxId.invalid") }),
  });
};

export type TaxIdentityForm = z.infer<
  ReturnType<typeof useTaxIdentityFormSchema>
>;
