import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCreateAddOnFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    addOnMenuSectionId: z
      .string()
      .min(1, { error: tValidation("addOnMenuSectionId.required") }),
    addOnMenuItemId: z.string().optional(),
  });
};

export type CreateAddOnForm = z.infer<
  ReturnType<typeof useCreateAddOnFormSchema>
>;
