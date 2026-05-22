import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateUserFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    lastName: z.string().trim().optional(),
    firstName: z
      .string()
      .min(1, { error: tValidation("firstName.minLength") })
      .trim(),
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    bio: z
      .string()
      .trim()
      .max(160, { error: tValidation("bio.maxLength") })
      .optional(),
    emailSubscribed: z.boolean(),
  });
};

export type UpdateUserForm = z.infer<
  ReturnType<typeof useUpdateUserFormSchema>
>;
