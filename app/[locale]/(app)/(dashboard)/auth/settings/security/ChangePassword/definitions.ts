import { useTranslations } from "next-intl";
import * as z from "zod";

import { PASSWORD_MIN_LENGTH } from "@/constants/password";

export const useChangePasswordFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      currentPassword: z
        .string()
        .min(1, { error: tValidation("currentPassword.required") })
        .trim(),
      newPassword: z
        .string()
        .min(PASSWORD_MIN_LENGTH, {
          error: tValidation("newPassword.minLength"),
        })
        .regex(/[a-zA-Z]/, { error: tValidation("newPassword.letter") })
        .regex(/[0-9]/, { error: tValidation("newPassword.number") })
        .trim(),
      confirmNewPassword: z
        .string()
        .min(1, { error: tValidation("confirmNewPassword.required") })
        .trim(),
    })
    .refine(
      ({ currentPassword, newPassword }) => currentPassword !== newPassword,
      {
        path: ["newPassword"],
        message: tValidation("newPassword.sameAsCurrent"),
      },
    )
    .refine(
      ({ newPassword, confirmNewPassword }) =>
        newPassword === confirmNewPassword,
      {
        path: ["confirmNewPassword"],
        message: tValidation("confirmNewPassword.mismatch"),
      },
    );
};

export type ChangePasswordForm = z.infer<
  ReturnType<typeof useChangePasswordFormSchema>
>;
