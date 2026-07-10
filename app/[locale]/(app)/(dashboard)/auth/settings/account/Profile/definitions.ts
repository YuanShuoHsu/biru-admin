import { useTranslations } from "next-intl";
import * as z from "zod";

export const useProfileFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    lastName: z.string().trim().optional(),
    firstName: z
      .string()
      .min(1, { error: tValidation("firstName.required") })
      .trim(),
    bio: z
      .string()
      .trim()
      .max(160, { error: tValidation("bio.maxLength") })
      .optional(),
    birthDate: z.string(),
  });
};

export type ProfileForm = z.infer<ReturnType<typeof useProfileFormSchema>>;
