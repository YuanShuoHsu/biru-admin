import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCreateOrganizationFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    logo: z.string().trim().optional(),
    name: z
      .string()
      .min(1, { error: tValidation("name.required") })
      .trim(),
    slug: z
      .string()
      .min(1, { error: tValidation("slug.required") })
      .regex(/[a-zA-Z]/, { error: tValidation("slug.letter") })
      .trim(),
  });
};

export type CreateOrganizationForm = z.infer<
  ReturnType<typeof useCreateOrganizationFormSchema>
>;
