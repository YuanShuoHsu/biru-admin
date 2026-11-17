import { useTranslations } from "next-intl";
import * as z from "zod";

export const useChecklistItemFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    actionNote: z.string().trim(),
    value: z
      .string()
      .min(1, { error: tValidation("checklistItemValue.required") })
      .regex(/^-?\d+(\.\d{1,2})?$/, {
        error: tValidation("number.maxFractionDigits", { digits: 2 }),
      }),
  });
};

export type ChecklistItemForm = z.infer<
  ReturnType<typeof useChecklistItemFormSchema>
>;
