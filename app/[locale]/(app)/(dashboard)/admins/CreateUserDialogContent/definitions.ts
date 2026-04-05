import { useTranslations } from "next-intl";
import * as z from "zod";

import { roles } from "@/constants/admins";

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
    role: z
      .string()
      .pipe(z.enum(roles, { error: tValidation("role.required") })),
  });
};

export type CreateUserFormInput = z.input<
  ReturnType<typeof useCreateUserFormSchema>
>;

export type CreateUserFormOutput = z.output<
  ReturnType<typeof useCreateUserFormSchema>
>;
