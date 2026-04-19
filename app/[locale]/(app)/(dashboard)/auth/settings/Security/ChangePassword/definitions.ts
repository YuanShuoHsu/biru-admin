import { useTranslations } from "next-intl";
import * as z from "zod";

import { PASSWORD_MIN_LENGTH } from "@/constants/password";

const PASSWORD_MAX_LENGTH = 128;

export const useChangePasswordFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      currentPassword: z
        .string()
        .min(1, { error: tValidation("currentPassword.required") }),
      newPassword: z
        .string()
        .min(PASSWORD_MIN_LENGTH, {
          error: tValidation("newPassword.minLength"),
        })
        .max(PASSWORD_MAX_LENGTH),
      confirmNewPassword: z
        .string()
        .min(1, { error: tValidation("confirmPassword.required") }),
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

export type ChangePasswordForm = z.infer<
  ReturnType<typeof useChangePasswordFormSchema>
>;
