import { useTranslations } from "next-intl";
import * as z from "zod";

export const useTeamFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .min(1, { error: tValidation("name.required") })
      .trim(),
  });
};

export type TeamForm = z.infer<ReturnType<typeof useTeamFormSchema>>;
