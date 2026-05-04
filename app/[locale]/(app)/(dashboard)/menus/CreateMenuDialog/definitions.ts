import { useTranslations } from "next-intl";
import * as z from "zod";

import { routing } from "@/i18n/routing";

export const useCreateMenuFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    description: z.string().trim().optional(),
    inLanguage: z.enum(routing.locales),
    image: z.string().trim().optional(),
  });
};

export type CreateMenuForm = z.infer<
  ReturnType<typeof useCreateMenuFormSchema>
>;
