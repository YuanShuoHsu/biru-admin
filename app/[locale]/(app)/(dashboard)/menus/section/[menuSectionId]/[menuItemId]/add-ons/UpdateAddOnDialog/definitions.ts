import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateAddOnFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    addOnMenuSectionId: z
      .string()
      .min(1, { error: tValidation("addOnMenuSectionId.required") }),
    addOnMenuItemId: z.string().optional(),
  });
};

export type UpdateAddOnForm = z.infer<
  ReturnType<typeof useUpdateAddOnFormSchema>
>;
