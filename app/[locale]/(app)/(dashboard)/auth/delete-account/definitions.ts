import { useTranslations } from "next-intl";
import * as z from "zod";

export const useDeleteAccountFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
  });
};

export type DeleteAccountForm = z.infer<
  ReturnType<typeof useDeleteAccountFormSchema>
>;
