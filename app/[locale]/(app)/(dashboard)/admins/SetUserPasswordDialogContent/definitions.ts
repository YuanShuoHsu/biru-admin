import { useTranslations } from "next-intl";
import * as z from "zod";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/constants/password";

export const useSetUserPasswordFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      email: z.email({ error: tValidation("email.invalid") }).trim(),
      newPassword: z
        .string()
        .trim()
        .min(PASSWORD_MIN_LENGTH, { error: tValidation("password.minLength") })
        .max(PASSWORD_MAX_LENGTH, { error: tValidation("password.maxLength") })
        .regex(/[a-zA-Z]/, { error: tValidation("password.letter") })
        .regex(/[0-9]/, { error: tValidation("password.number") }),
      confirmPassword: z
        .string()
        .trim()
        .min(1, { error: tValidation("confirmPassword.required") }),
    })
    .refine(
      ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
      {
        path: ["confirmPassword"],
        message: tValidation("confirmPassword.mismatch"),
      },
    );
};

export type SetUserPasswordForm = z.infer<
  ReturnType<typeof useSetUserPasswordFormSchema>
>;
