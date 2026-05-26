import { useTranslations } from "next-intl";
import * as z from "zod";

import { hasOpeningHoursConflict } from "@/utils/openingHours";

export const useUpdateLocationFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    // https://schema.org/PostalAddress
    addressCountry: z.string().trim().optional(),
    addressLocality: z.string().trim().optional(),
    addressRegion: z.string().trim().optional(),
    extendedAddress: z.string().trim().optional(),
    postalCode: z
      .string()
      .trim()
      .refine((val) => val === "" || /^\d{3}(\d{2}\d?)?$/.test(val), {
        error: tValidation("postalCode.format"),
      })
      .optional(),
    streetAddress: z.string().trim().optional(),

    // https://schema.org/LocalBusiness
    hasMap: z.string().trim().optional(),
    openingHours: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) =>
          !val ||
          val
            .split("\n")
            .filter(Boolean)
            .every((line) => line.indexOf(" ") > 0),
      )
      .refine((val) => !val || !hasOpeningHoursConflict(val)),
    telephone: z.string().trim().optional(),
  });
};

export type UpdateLocationForm = z.infer<
  ReturnType<typeof useUpdateLocationFormSchema>
>;
