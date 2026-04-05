import { useTranslations } from "next-intl";
import * as z from "zod";

import { roles } from "@/constants/admins";
import { PASSWORD_MIN_LENGTH } from "@/constants/password";

export const useCreateUserFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      lastName: z.string().trim(),
      firstName: z
        .string()
        .min(1, { error: tValidation("firstName.minLength") })
        .trim(),
      email: z.email({ error: tValidation("email.invalid") }).trim(),
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, {
          error: tValidation("password.minLength"),
        })
        .regex(/[a-zA-Z]/, { error: tValidation("password.letter") })
        .regex(/[0-9]/, { error: tValidation("password.number") })
        .trim(),
      confirmPassword: z
        .string()
        .min(1, { error: tValidation("confirmPassword.required") })
        .trim(),
      emailSubscribed: z.boolean(),
      role: z
        .string()
        .pipe(z.enum(roles, { error: tValidation("role.required") })),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      path: ["confirmPassword"],
      message: tValidation("confirmPassword.mismatch"),
    });
};

export type CreateUserFormInput = z.input<
  ReturnType<typeof useCreateUserFormSchema>
>;

export type CreateUserFormOutput = z.output<
  ReturnType<typeof useCreateUserFormSchema>
>;
