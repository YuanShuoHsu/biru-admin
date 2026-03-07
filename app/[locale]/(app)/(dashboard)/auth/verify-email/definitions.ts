import { useTranslations } from "next-intl";
import * as z from "zod";

export const useVerifyEmailFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
  });
};
