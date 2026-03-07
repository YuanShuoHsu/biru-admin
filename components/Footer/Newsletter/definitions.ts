import { useTranslations } from "next-intl";
import * as z from "zod";

export const useNewsletterFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
  });
};

export type NewsletterFormState =
  | {
      errors?: {
        email?: string[];
      };
      message?: string;
    }
  | undefined;
