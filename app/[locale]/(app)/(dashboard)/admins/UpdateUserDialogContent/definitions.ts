import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateUserFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    lastName: z.string().trim(),
    firstName: z
      .string()
      .min(1, { error: tValidation("firstName.minLength") })
      .trim(),
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    emailSubscribed: z.boolean(),
  });
};

export type UpdateUserFormValues = z.infer<
  ReturnType<typeof useUpdateUserFormSchema>
>;
