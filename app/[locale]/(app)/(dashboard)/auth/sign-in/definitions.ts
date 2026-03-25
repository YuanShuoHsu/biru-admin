// https://nextjs.org/docs/app/guides/authentication

import { useTranslations } from "next-intl";
import * as z from "zod";

import { PASSWORD_MIN_LENGTH } from "@/constants/password";

export const useSignInFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { error: tValidation("password.minLength") })
      .regex(/[a-zA-Z]/, { error: tValidation("password.letter") })
      .regex(/[0-9]/, { error: tValidation("password.number") })
      .trim(),
    rememberMe: z.boolean(),
  });
};

export type SignInForm = z.infer<ReturnType<typeof useSignInFormSchema>>;
