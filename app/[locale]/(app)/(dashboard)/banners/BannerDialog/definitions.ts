import { useTranslations } from "next-intl";
import * as z from "zod";

export const useBannerFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      alt: z.record(z.string(), z.string()),
      endsAt: z.string(),
      isActive: z.boolean(),
      startsAt: z.string(),
      url: z.string().trim().max(2048),
    })
    .refine(
      ({ endsAt, startsAt }) =>
        !startsAt || !endsAt || new Date(endsAt) > new Date(startsAt),
      { error: tValidation("endsAt.afterStartsAt"), path: ["endsAt"] },
    );
};

export type BannerForm = z.infer<ReturnType<typeof useBannerFormSchema>>;
