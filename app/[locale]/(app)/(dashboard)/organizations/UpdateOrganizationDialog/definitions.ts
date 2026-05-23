import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateOrganizationFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    slug: z
      .string()
      .min(1, { error: tValidation("slug.minLength") })
      .regex(/[a-zA-Z]/, { error: tValidation("slug.letter") })
      .trim(),
    // https://schema.org/PostalAddress
    addressCountry: z.string().trim().optional(),
    addressLocality: z.string().trim().optional(),
    addressRegion: z.string().trim().optional(),
    extendedAddress: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    streetAddress: z.string().trim().optional(),

    isOpen: z.boolean(),
  });
};

export type UpdateOrganizationForm = z.infer<
  ReturnType<typeof useUpdateOrganizationFormSchema>
>;
