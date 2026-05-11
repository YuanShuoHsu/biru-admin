import { useTranslations } from "next-intl";
import * as z from "zod";

export const useMenusFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    organizationSlug: z
      .string()
      .min(1, tValidation("organizationSlug.required")),
  });
};

export type MenusForm = z.infer<ReturnType<typeof useMenusFormSchema>>;
