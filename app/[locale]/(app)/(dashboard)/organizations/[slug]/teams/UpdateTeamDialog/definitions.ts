import { useTranslations } from "next-intl";
import * as z from "zod";

export const useTeamFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: tValidation("name.required") }),
  });
};

export type TeamForm = z.infer<ReturnType<typeof useTeamFormSchema>>;
