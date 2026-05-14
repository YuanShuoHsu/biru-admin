import { useTranslations } from "next-intl";
import * as z from "zod";

import { routing } from "@/i18n/routing";

export const useUpdateMenuFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    image: z.string().trim().optional(),
    name: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    inLanguage: z.enum(routing.locales),
    description: z.string().trim().optional(),
  });
};

export type UpdateMenuForm = z.infer<
  ReturnType<typeof useUpdateMenuFormSchema>
>;
