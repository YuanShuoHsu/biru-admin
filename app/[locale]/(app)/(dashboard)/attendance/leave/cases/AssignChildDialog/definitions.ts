import { useTranslations } from "next-intl";
import * as z from "zod";

export const useAssignChildFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    childId: z
      .string()
      .min(1, { error: tValidation("parentalChild.notSelected") }),
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("reason.required") }),
  });
};

export type AssignChildForm = z.infer<
  ReturnType<typeof useAssignChildFormSchema>
>;
