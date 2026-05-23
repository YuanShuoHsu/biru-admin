import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCreateOrganizationFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    logo: z.string().trim().optional(),
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

    // https://schema.org/LocalBusiness
    hasMap: z.string().trim().optional(),
    openingHours: z.string().trim().optional(),
    telephone: z.string().trim().optional(),

    isOpen: z.boolean(),
  });
};

export type CreateOrganizationForm = z.infer<
  ReturnType<typeof useCreateOrganizationFormSchema>
>;
