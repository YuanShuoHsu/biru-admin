import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCreateUserFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    firstName: z
      .string()
      .min(1, { error: tValidation("firstName.minLength") })
      .trim(),
    lastName: z.string().trim(),
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    password: z
      .string()
      .min(8, { error: tValidation("password.minLength") })
      .trim(),
    role: z.enum(["user", "admin"]),
  });
};

export type CreateUserForm = z.infer<
  ReturnType<typeof useCreateUserFormSchema>
>;
