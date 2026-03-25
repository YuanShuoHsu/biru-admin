import { useTranslations } from "next-intl";
import * as z from "zod";

export const useForgotPasswordFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
  });
};

export type ForgotPasswordForm = z.infer<
  ReturnType<typeof useForgotPasswordFormSchema>
>;
