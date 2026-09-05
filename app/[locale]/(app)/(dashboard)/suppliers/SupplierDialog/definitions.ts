import { useTranslations } from "next-intl";
import * as z from "zod";

export const useSupplierFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, {
        error: tValidation("supplierName.required"),
      }),
    note: z.string().trim().optional(),
    telephone: z.string().trim().optional(),
    url: z
      .string()
      .trim()
      .refine(
        (value) =>
          !value || z.url({ protocol: /^https?$/ }).safeParse(value).success,
        { error: tValidation("url.invalid") },
      )
      .optional(),
  });
};

export type SupplierForm = z.infer<ReturnType<typeof useSupplierFormSchema>>;
