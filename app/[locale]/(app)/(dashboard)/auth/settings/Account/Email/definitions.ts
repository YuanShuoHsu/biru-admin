import { useTranslations } from "next-intl";
import * as z from "zod";

export const useEmailFormSchema = (currentEmail: string) => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z
      .email({ error: tValidation("email.invalid") })
      .trim()
      .refine((val) => val !== currentEmail, {
        message: tValidation("email.sameAsCurrent"),
      }),
  });
};

export type EmailForm = z.infer<ReturnType<typeof useEmailFormSchema>>;
