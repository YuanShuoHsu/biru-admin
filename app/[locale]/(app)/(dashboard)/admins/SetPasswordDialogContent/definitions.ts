import { useTranslations } from "next-intl";
import * as z from "zod";

import { PASSWORD_MIN_LENGTH } from "@/constants/password";

export const useSetPasswordFormSchema = () => {
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
      confirmPassword: z
        .string()
        .min(1, { error: tValidation("confirmPassword.required") })
        .trim(),
    })
    .refine(
      ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
      {
        path: ["confirmPassword"],
        message: tValidation("confirmPassword.mismatch"),
      },
    );
};

export type SetPasswordFormValues = z.infer<
  ReturnType<typeof useSetPasswordFormSchema>
>;
