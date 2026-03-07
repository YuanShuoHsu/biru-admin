import { useTranslations } from "next-intl";
import * as z from "zod";

import { PASSWORD_MIN_LENGTH } from "@/constants/password";

export const useResetPasswordFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      email: z.email({ error: tValidation("email.invalid") }).trim(),
      newPassword: z
        .string()
        .min(PASSWORD_MIN_LENGTH, { error: tValidation("password.minLength") })
        .regex(/[a-zA-Z]/, { error: tValidation("password.letter") })
        .regex(/[0-9]/, { error: tValidation("password.number") })
        .trim(),
      confirmNewPassword: z
        .string()
        .min(1, { error: tValidation("confirmPassword.required") })
        .trim(),
    })
    .refine(
      ({ newPassword, confirmNewPassword }) =>
        newPassword === confirmNewPassword,
      {
        path: ["confirmNewPassword"],
        message: tValidation("confirmPassword.mismatch"),
      },
    );
};
