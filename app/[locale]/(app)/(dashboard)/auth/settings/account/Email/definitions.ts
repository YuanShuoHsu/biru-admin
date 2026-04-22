import { useTranslations } from "next-intl";
import * as z from "zod";

export const useEmailFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
  });
};

export type EmailForm = z.infer<ReturnType<typeof useEmailFormSchema>>;
