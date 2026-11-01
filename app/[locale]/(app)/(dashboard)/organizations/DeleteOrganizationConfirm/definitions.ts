import { useTranslations } from "next-intl";
import * as z from "zod";

export const useDeleteOrganizationFormSchema = (expected: string) => {
  const tValidation = useTranslations("validation");

  return z.object({
    confirmation: z
      .string()
      .trim()
      .refine((value) => value === expected, {
        error: tValidation("confirmation.mismatch", { expected }),
      }),
  });
};

export type DeleteOrganizationForm = z.infer<
  ReturnType<typeof useDeleteOrganizationFormSchema>
>;
