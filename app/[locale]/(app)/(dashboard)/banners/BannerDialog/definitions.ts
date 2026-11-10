import { useTranslations } from "next-intl";
import * as z from "zod";

const BANNER_URL_PATTERN = /^(?:\/(?![/\\])|https:\/\/[^\s\\/])[^\s\\]*$/;

export const useBannerFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      alt: z.record(
        z.string(),
        z
          .string()
          .trim()
          .max(160, {
            error: tValidation("localizedText.maxLength", { max: 160 }),
          }),
      ),
      endsAt: z.string(),
      image: z.string().min(1, { error: tValidation("image.notSelected") }),
      isActive: z.boolean(),
      startsAt: z.string(),
      url: z
        .string()
        .trim()
        .refine((value) => !value || BANNER_URL_PATTERN.test(value), {
          error: tValidation("url.invalid"),
        }),
    })
    .refine(
      ({ endsAt, startsAt }) =>
        !startsAt || !endsAt || new Date(endsAt) > new Date(startsAt),
      { error: tValidation("endsAt.afterStartsAt"), path: ["endsAt"] },
    );
};

export type BannerForm = z.infer<ReturnType<typeof useBannerFormSchema>>;
