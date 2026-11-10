import { type CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  hasIncompleteOpeningHours,
  hasOpeningHoursConflict,
} from "@/utils/openingHours";

// https://developers.google.com/maps/documentation/embed/embedding-map
const GOOGLE_MAPS_EMBED_URL =
  /^https:\/\/www\.google\.com\/maps\/embed([/?#]|$)/i;
const IFRAME_SRC = /<iframe\b[^>]*\ssrc="([^"]*)"/i;

export const useUpdateLocationFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      // https://schema.org/PostalAddress
      addressCountry: z
        .string()
        .trim()
        .min(1, { error: tValidation("addressCountry.notSelected") }),
      currency: z
        .string()
        .trim()
        .min(1, { error: tValidation("currency.notSelected") }),
      addressLocality: z
        .string()
        .trim()
        .min(1, { error: tValidation("addressLocality.required") }),
      addressRegion: z
        .string()
        .trim()
        .min(1, { error: tValidation("addressRegion.required") }),
      extendedAddress: z.string().trim().optional(),
      postalCode: z
        .string()
        .trim()
        .refine((value) => value === "" || /^\d{3}(\d{2}\d?)?$/.test(value), {
          error: tValidation("postalCode.format"),
        })
        .optional(),
      streetAddress: z
        .string()
        .trim()
        .min(1, { error: tValidation("streetAddress.required") }),

      // https://schema.org/LocalBusiness
      hasMap: z
        .string()
        .trim()
        .transform(
          (value) =>
            IFRAME_SRC.exec(value)?.[1].replaceAll("&amp;", "&") ?? value,
        )
        .refine((value) => !value || GOOGLE_MAPS_EMBED_URL.test(value), {
          error: tValidation("hasMap.invalid"),
        })
        .optional(),
      openingHours: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || !hasIncompleteOpeningHours(value))
        .refine((value) => !value || !hasOpeningHoursConflict(value)),
      telephone: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.addressCountry &&
        data.telephone &&
        !isValidPhoneNumber(data.telephone, data.addressCountry as CountryCode)
      ) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("telephone.invalid"),
          path: ["telephone"],
        });
      }
    });
};

export type UpdateLocationForm = z.infer<
  ReturnType<typeof useUpdateLocationFormSchema>
>;
