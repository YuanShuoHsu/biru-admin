import { useTranslations } from "next-intl";
import * as z from "zod";

export const useProfileFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    lastName: z.string().trim().optional(),
    firstName: z
      .string()
      .min(1, { error: tValidation("firstName.minLength") })
      .trim(),
  });
};

export type ProfileForm = z.infer<ReturnType<typeof useProfileFormSchema>>;
